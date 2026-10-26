
import logging
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from starlette.concurrency import run_in_threadpool

from backend.audit_report import (
    build_audit_assessment,
    build_verification_summary,
)
from backend.claim_extractor import extract_claims
from backend.confidence import build_confidence_report
from backend.error_localizer import localize_numeric_conflict
from backend.evidence_selection import (
    VerificationModelError,
    build_verified_claim,
)
from backend.pdf_parser import PDFParseError, extract_pdf_pages
from backend.reasoning_checker import check_reasoning_consistency
from backend.retriever import TfidfRetriever
from backend.schemas import VerifiedClaim, VerifyResponse
from backend.verifier import classify_evidence
from backend.knowledge_vault import (
    load_document_pages,
    router as knowledge_vault_router,
)


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Second Opinion API",
    description=(
        "Audit claims in AI-generated answers against uploaded PDF sources "
        "and documents saved in the Personal Knowledge Vault."
    ),
    version="0.2.0",
)

app.include_router(knowledge_vault_router)

# Development configuration. Restrict origins before production deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

TOP_K = 5
MIN_RETRIEVAL_SCORE = 0.05
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB per PDF


def custom_openapi():
    """Build the OpenAPI schema for the verification and Vault APIs."""
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    schemas = openapi_schema.setdefault("components", {}).setdefault(
        "schemas", {}
    )
    body_schema = schemas.get("Body_verify_answer_verify_post")

    if body_schema is not None:
        properties = body_schema.setdefault("properties", {})

        # Optional array of uploaded PDF files.
        # Keep the binary format for OpenAPI 3.0-compatible tooling.
        properties["files"] = {
            "type": "array",
            "title": "Files",
            "description": (
                "Optional source PDF files. Leave empty when using "
                "saved Knowledge Vault documents."
            ),
            "items": {
                "type": "string",
                "format": "binary",
            },
        }

        # Optional IDs of documents already stored in the Vault.
        properties["document_ids"] = {
            "type": "array",
            "title": "Document Ids",
            "description": (
                "Optional IDs of documents saved in the Knowledge Vault. "
                "Submit one ID per value."
            ),
            "items": {
                "type": "string",
            },
        }

        # Only answer is required. The endpoint validates that at least
        # one evidence source is supplied.
        required = body_schema.get("required", [])
        body_schema["required"] = [
            field
            for field in required
            if field not in {"files", "document_ids"}
        ]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


@app.get("/")
def root():
    return {
        "name": "Second Opinion API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


def _run_audit(answer: str, pages: list) -> VerifyResponse:
    """Run retrieval, evidence verification, and reasoning checks."""
    claims = extract_claims(answer)

    if not claims:
        raise HTTPException(
            status_code=422,
            detail="No checkable sentences were found in the answer.",
        )

    retriever = TfidfRetriever()

    try:
        retriever.fit(pages)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Could not index the evidence documents: {exc}",
        ) from exc

    verified_claims: list[VerifiedClaim] = []

    try:
        for claim in claims:
            passages = retriever.retrieve(claim, top_k=TOP_K)

            verified_claims.append(
                build_verified_claim(
                    claim,
                    passages,
                    classifier=classify_evidence,
                    confidence_builder=build_confidence_report,
                    localizer=localize_numeric_conflict,
                    min_retrieval_score=MIN_RETRIEVAL_SCORE,
                )
            )
    except VerificationModelError as exc:
        logger.exception("Evidence verification model failed.")
        raise HTTPException(
            status_code=500,
            detail="The evidence verification model failed.",
        ) from exc

    reasoning_issues = check_reasoning_consistency(
        [item.claim for item in verified_claims]
    )

    for issue in reasoning_issues:
        for item in verified_claims:
            if item.claim in issue.related_claims:
                item.reasoning_issues.append(issue)

    summary = build_verification_summary(verified_claims)
    assessment = build_audit_assessment(
        verified_claims,
        reasoning_issues,
    )

    return VerifyResponse(
        claims=verified_claims,
        summary=summary,
        reasoning_issues=reasoning_issues,
        assessment=assessment,
    )


def _remove_temp_file(path: Path) -> None:
    """Remove a temporary PDF without masking the original error."""
    try:
        path.unlink(missing_ok=True)
    except OSError:
        logger.warning(
            "Could not remove temporary PDF file: %s",
            path,
            exc_info=True,
        )


@app.post("/verify", response_model=VerifyResponse)
async def verify_answer(
    answer: str = Form(..., min_length=1),
    files: list[UploadFile] | None = File(
        default=None,
        description="Optional source PDF files to use as evidence.",
    ),
    document_ids: list[str] | None = Form(
        default=None,
        description=(
            "Optional IDs of documents already stored in the Knowledge Vault. "
            "Submit one ID per value."
        ),
    ),
):
    """Verify claims against uploaded PDFs, saved Vault documents, or both."""
    if not answer.strip():
        raise HTTPException(
            status_code=400,
            detail="Answer must not be empty.",
        )

    uploaded_files = files or []

    selected_document_ids = list(
        dict.fromkeys(
            document_id.strip()
            for document_id in (document_ids or [])
            if document_id and document_id.strip()
        )
    )

    if not uploaded_files and not selected_document_ids:
        raise HTTPException(
            status_code=400,
            detail=(
                "Provide at least one source PDF or one saved Vault "
                "document ID."
            ),
        )

    pages = []

    if selected_document_ids:
        saved_pages = await run_in_threadpool(
            load_document_pages,
            selected_document_ids,
        )
        pages.extend(saved_pages)

    for uploaded_file in uploaded_files:
        filename = Path(
            uploaded_file.filename or "source.pdf"
        ).name
        temp_path = None

        try:
            if not filename.lower().endswith(".pdf"):
                raise HTTPException(
                    status_code=400,
                    detail=f"'{filename}' is not a PDF file.",
                )

            content = await uploaded_file.read(MAX_FILE_SIZE + 1)

            if not content:
                raise HTTPException(
                    status_code=400,
                    detail=f"'{filename}' is empty.",
                )

            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail=f"'{filename}' exceeds the 20 MB file limit.",
                )

            if b"%PDF-" not in content[:1024]:
                raise HTTPException(
                    status_code=422,
                    detail=f"'{filename}' is not a valid PDF file.",
                )

            with tempfile.NamedTemporaryFile(
                mode="wb",
                suffix=".pdf",
                prefix="second_opinion_",
                delete=False,
            ) as temp_file:
                temp_file.write(content)
                temp_path = Path(temp_file.name)

            try:
                extracted_pages = await run_in_threadpool(
                    extract_pdf_pages,
                    temp_path,
                    filename,
                )
            except PDFParseError as exc:
                logger.info(
                    "Could not parse uploaded PDF '%s': %s",
                    filename,
                    exc,
                )
                raise HTTPException(
                    status_code=422,
                    detail=(
                        f"Could not read '{filename}'. "
                        "Ensure it is a valid, readable PDF."
                    ),
                ) from exc

            pages.extend(extracted_pages)

        finally:
            if temp_path is not None:
                _remove_temp_file(temp_path)

            await uploaded_file.close()

    if not pages:
        raise HTTPException(
            status_code=422,
            detail=(
                "No readable text was extracted from the provided "
                "evidence documents."
            ),
        )

    return await run_in_threadpool(
        _run_audit,
        answer,
        pages,
    )
