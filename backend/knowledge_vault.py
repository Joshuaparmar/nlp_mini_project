
"""Local, persistent Personal Knowledge Vault APIs for Second Opinion.

Storage defaults to backend/data/vault and can be overridden with
SECOND_OPINION_VAULT_DIR. The directory contains vault.sqlite3 and PDFs.
"""

from __future__ import annotations

import hashlib
import logging
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from backend.pdf_parser import PDFParseError, PDFPage, extract_pdf_pages
from backend.retriever import TfidfRetriever


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vault", tags=["Knowledge Vault"])

MAX_VAULT_FILE_SIZE = 20 * 1024 * 1024
DEFAULT_VAULT_DIR = Path(__file__).resolve().parent / "data" / "vault"

VAULT_ROOT = Path(
    os.getenv("SECOND_OPINION_VAULT_DIR", str(DEFAULT_VAULT_DIR))
).expanduser()


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class DocumentSummary(BaseModel):
    id: str
    filename: str
    uploaded_at: str
    size_bytes: int
    page_count: int
    sha256: str


class DocumentDetail(DocumentSummary):
    pages: list[dict[str, Any]] = Field(default_factory=list)


class SearchHit(BaseModel):
    document_id: str
    filename: str
    page: int
    text: str
    score: float


class SearchResponse(BaseModel):
    query: str
    results: list[SearchHit]


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def _connect() -> sqlite3.Connection:
    """Open the local SQLite database and ensure its schema exists."""
    VAULT_ROOT.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(
        VAULT_ROOT / "vault.sqlite3",
        timeout=15,
    )
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA journal_mode = WAL")

    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            stored_filename TEXT NOT NULL UNIQUE,
            uploaded_at TEXT NOT NULL,
            size_bytes INTEGER NOT NULL CHECK(size_bytes >= 0),
            page_count INTEGER NOT NULL CHECK(page_count >= 0),
            sha256 TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at
            ON documents(uploaded_at DESC);

        CREATE TABLE IF NOT EXISTS pages (
            document_id TEXT NOT NULL,
            page_number INTEGER NOT NULL CHECK(page_number >= 1),
            text TEXT NOT NULL,
            PRIMARY KEY(document_id, page_number),
            FOREIGN KEY(document_id)
                REFERENCES documents(id)
                ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_pages_document
            ON pages(document_id, page_number);
        """
    )

    return connection


def _summary(row: sqlite3.Row) -> dict[str, Any]:
    """Convert a database row into a document summary."""
    return {
        "id": row["id"],
        "filename": row["filename"],
        "uploaded_at": row["uploaded_at"],
        "size_bytes": row["size_bytes"],
        "page_count": row["page_count"],
        "sha256": row["sha256"],
    }


def _safe_unlink(path: Path) -> None:
    """Attempt temporary-file cleanup without masking the original error."""
    try:
        path.unlink(missing_ok=True)
    except OSError:
        logger.warning(
            "Could not remove Vault file: %s",
            path,
            exc_info=True,
        )


def _extract(path: Path, filename: str) -> list[PDFPage]:
    """Extract page-aware text from a PDF."""
    try:
        return extract_pdf_pages(path, source_name=filename)
    except PDFParseError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc


# ---------------------------------------------------------------------------
# Saved-document integration helper
# ---------------------------------------------------------------------------

def load_document_pages(document_ids: list[str]) -> list[PDFPage]:
    """Load selected saved documents as page-aware evidence for /verify."""
    if not document_ids:
        return []

    connection = _connect()

    try:
        pages: list[PDFPage] = []

        # Remove duplicate IDs while preserving their original order.
        for document_id in dict.fromkeys(document_ids):
            document = connection.execute(
                "SELECT filename FROM documents WHERE id = ?",
                (document_id,),
            ).fetchone()

            if document is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Vault document '{document_id}' was not found.",
                )

            rows = connection.execute(
                """
                SELECT page_number, text
                FROM pages
                WHERE document_id = ?
                ORDER BY page_number
                """,
                (document_id,),
            ).fetchall()

            pages.extend(
                PDFPage(
                    source=document["filename"],
                    page=row["page_number"],
                    text=row["text"],
                )
                for row in rows
            )

        return pages

    finally:
        connection.close()


# ---------------------------------------------------------------------------
# Upload a PDF
# ---------------------------------------------------------------------------

@router.post(
    "/documents",
    response_model=DocumentSummary,
    status_code=201,
)
async def upload_document(file: UploadFile = File(...)):
    """Persist one text-readable PDF and its extracted page text."""
    staging_path: Path | None = None
    final_path: Path | None = None

    try:
        # Strip directory components from the user-supplied filename.
        filename = Path(file.filename or "document.pdf").name

        if not filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are supported.",
            )

        # Read at most one byte above the configured limit.
        content_bytes = await file.read(MAX_VAULT_FILE_SIZE + 1)

        if not content_bytes:
            raise HTTPException(
                status_code=400,
                detail="The uploaded PDF is empty.",
            )

        if len(content_bytes) > MAX_VAULT_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="PDF exceeds the 20 MB file limit.",
            )

        # Basic signature check before writing or parsing the file.
        if b"%PDF-" not in content_bytes[:1024]:
            raise HTTPException(
                status_code=422,
                detail="The uploaded file is not a valid PDF.",
            )

        document_id = uuid.uuid4().hex
        stored_filename = f"{document_id}.pdf"

        VAULT_ROOT.mkdir(parents=True, exist_ok=True)

        staging_path = VAULT_ROOT / f".{document_id}.upload.pdf"
        final_path = VAULT_ROOT / stored_filename

        staging_path.write_bytes(content_bytes)

        # Run the potentially expensive PDF extraction outside the
        # asynchronous event loop.
        pages = await run_in_threadpool(
            _extract,
            staging_path,
            filename,
        )

        uploaded_at = datetime.now(timezone.utc).isoformat()
        digest = hashlib.sha256(content_bytes).hexdigest()

        # Publish the PDF only after successful extraction.
        staging_path.replace(final_path)

        connection = _connect()

        try:
            # Store document metadata and page text in one transaction.
            with connection:
                connection.execute(
                    """
                    INSERT INTO documents (
                        id,
                        filename,
                        stored_filename,
                        uploaded_at,
                        size_bytes,
                        page_count,
                        sha256
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        document_id,
                        filename,
                        stored_filename,
                        uploaded_at,
                        len(content_bytes),
                        len(pages),
                        digest,
                    ),
                )

                connection.executemany(
                    """
                    INSERT INTO pages (
                        document_id,
                        page_number,
                        text
                    )
                    VALUES (?, ?, ?)
                    """,
                    [
                        (document_id, page.page, page.text)
                        for page in pages
                    ],
                )

        finally:
            connection.close()

        return DocumentSummary(
            id=document_id,
            filename=filename,
            uploaded_at=uploaded_at,
            size_bytes=len(content_bytes),
            page_count=len(pages),
            sha256=digest,
        )

    except HTTPException:
        # Preserve the intended HTTP response while cleaning up files.
        if staging_path is not None:
            _safe_unlink(staging_path)

        if final_path is not None:
            _safe_unlink(final_path)

        raise

    except Exception as exc:
        logger.exception("Could not save a document to the local Vault.")

        if staging_path is not None:
            _safe_unlink(staging_path)

        if final_path is not None:
            _safe_unlink(final_path)

        raise HTTPException(
            status_code=500,
            detail="Could not save the document to the local vault.",
        ) from exc

    finally:
        await file.close()


# ---------------------------------------------------------------------------
# List saved documents
# ---------------------------------------------------------------------------

@router.get(
    "/documents",
    response_model=list[DocumentSummary],
)
def list_documents():
    """Return saved documents, newest first."""
    connection = _connect()

    try:
        rows = connection.execute(
            """
            SELECT
                id,
                filename,
                uploaded_at,
                size_bytes,
                page_count,
                sha256
            FROM documents
            ORDER BY uploaded_at DESC
            """
        ).fetchall()

        return [_summary(row) for row in rows]

    finally:
        connection.close()


# ---------------------------------------------------------------------------
# Get a document and its extracted pages
# ---------------------------------------------------------------------------

@router.get(
    "/documents/{document_id}",
    response_model=DocumentDetail,
)
def get_document(document_id: str):
    """Return document metadata and its extracted page text."""
    connection = _connect()

    try:
        row = connection.execute(
            """
            SELECT
                id,
                filename,
                stored_filename,
                uploaded_at,
                size_bytes,
                page_count,
                sha256
            FROM documents
            WHERE id = ?
            """,
            (document_id,),
        ).fetchone()

        if row is None:
            raise HTTPException(
                status_code=404,
                detail="Vault document not found.",
            )

        page_rows = connection.execute(
            """
            SELECT page_number, text
            FROM pages
            WHERE document_id = ?
            ORDER BY page_number
            """,
            (document_id,),
        ).fetchall()

        result = _summary(row)
        result["pages"] = [
            {
                "page": page["page_number"],
                "text": page["text"],
            }
            for page in page_rows
        ]

        return result

    finally:
        connection.close()


# ---------------------------------------------------------------------------
# Delete a saved document
# ---------------------------------------------------------------------------

@router.delete(
    "/documents/{document_id}",
    status_code=204,
)
def delete_document(document_id: str):
    """Delete a saved document and its associated page text."""
    connection = _connect()

    try:
        row = connection.execute(
            """
            SELECT stored_filename
            FROM documents
            WHERE id = ?
            """,
            (document_id,),
        ).fetchone()

        if row is None:
            raise HTTPException(
                status_code=404,
                detail="Vault document not found.",
            )

        stored_path = VAULT_ROOT / row["stored_filename"]

        # Deleting the document row also deletes its pages through
        # the configured foreign-key cascade.
        with connection:
            connection.execute(
                "DELETE FROM documents WHERE id = ?",
                (document_id,),
            )

        try:
            stored_path.unlink(missing_ok=True)
        except OSError as exc:
            logger.exception(
                "Document metadata was deleted, but its PDF could not "
                "be removed: %s",
                stored_path,
            )
            raise HTTPException(
                status_code=500,
                detail=(
                    "Document metadata was deleted, but the stored PDF "
                    "could not be removed from disk."
                ),
            ) from exc

    finally:
        connection.close()


# ---------------------------------------------------------------------------
# Search saved page text
# ---------------------------------------------------------------------------

@router.get(
    "/search",
    response_model=SearchResponse,
)
def search_vault(
    q: str = Query(..., min_length=1, max_length=1000),
    top_k: int = Query(5, ge=1, le=20),
):
    """Search saved PDF pages using TF-IDF retrieval."""
    query = q.strip()

    if not query:
        raise HTTPException(
            status_code=400,
            detail="Search query must not be empty.",
        )

    connection = _connect()

    try:
        rows = connection.execute(
            """
            SELECT
                p.document_id,
                d.filename,
                p.page_number,
                p.text
            FROM pages AS p
            JOIN documents AS d
                ON d.id = p.document_id
            ORDER BY
                d.uploaded_at DESC,
                p.page_number ASC
            """
        ).fetchall()

    finally:
        connection.close()

    if not rows:
        return SearchResponse(
            query=query,
            results=[],
        )

    pages = [
        PDFPage(
            source=f"{row['document_id']}::{row['filename']}",
            page=row["page_number"],
            text=row["text"],
        )
        for row in rows
    ]

    retriever = TfidfRetriever()

    
    try:
        retriever.fit(pages)
        passages = retriever.retrieve(
            query,
            top_k=top_k,
        )
        # Do not return passages with no lexical match to the query.
        passages = [
            passage
            for passage in passages
            if passage.retrieval_score > 0.0
        ]

    except ValueError:
        return SearchResponse(
            query=query,
            results=[],
        )


    hits: list[SearchHit] = []

    for passage in passages:
        document_id, _, filename = passage.source.partition("::")

        hits.append(
            SearchHit(
                document_id=document_id,
                filename=filename,
                page=passage.page,
                text=passage.text,
                score=passage.retrieval_score,
            )
        )

    return SearchResponse(
        query=query,
        results=hits,
    )
