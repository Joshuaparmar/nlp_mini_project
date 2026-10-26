from dataclasses import dataclass
from pathlib import Path

import pymupdf


@dataclass(frozen=True)
class PDFPage:
    """Text extracted from one PDF page, with source provenance."""

    source: str
    page: int
    text: str


class PDFParseError(ValueError):
    """Raised when a PDF cannot be parsed or contains no extractable text."""


def extract_pdf_pages(
    file_path: str | Path,
    source_name: str | None = None,
) -> list[PDFPage]:
    """
    Extract text page by page while preserving source and page numbers.

    Page numbers are one-based. This function does not perform OCR.
    """
    path = Path(file_path)

    if not path.is_file():
        raise PDFParseError(f"PDF file not found: {path}")

    filename = source_name or path.name
    pages: list[PDFPage] = []

    try:
        with pymupdf.open(path) as document:
            if document.is_encrypted:
                raise PDFParseError(
                    f"PDF is encrypted and cannot be read: {filename}"
                )

            for page_number, page in enumerate(document, start=1):
                text = page.get_text("text", sort=False).strip()

                if text:
                    pages.append(
                        PDFPage(
                            source=filename,
                            page=page_number,
                            text=text,
                        )
                    )

    except PDFParseError:
        raise
    except Exception as exc:
        raise PDFParseError(
            f"Failed to parse PDF '{filename}': {exc}"
        ) from exc

    if not pages:
        raise PDFParseError(
            f"No extractable text found in '{filename}'. "
            "The PDF may be scanned or image-only; OCR is not implemented."
        )

    return pages