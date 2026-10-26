"""Smoke tests for the Knowledge Vault routes; parsing/model work is mocked."""
import importlib
import io
from pathlib import Path

import pytest
pytest.importorskip("fastapi")
pytest.importorskip("httpx")
import pymupdf
from fastapi.testclient import TestClient

from backend import knowledge_vault as vault
from backend import main


def make_pdf():
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((72, 72), "The Pacific Ocean is the largest ocean on Earth.")
    data = doc.tobytes()
    doc.close()
    return data


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(vault, "VAULT_ROOT", tmp_path / "vault")
    return TestClient(main.app)


def test_upload_list_detail_delete(client):
    response = client.post(
        "/vault/documents",
        files={"file": ("ocean.pdf", make_pdf(), "application/pdf")},
    )
    assert response.status_code == 201, response.text
    document = response.json()
    assert document["filename"] == "ocean.pdf"
    assert document["page_count"] >= 1
    assert len(client.get("/vault/documents").json()) == 1

    detail = client.get(f"/vault/documents/{document['id']}")
    assert detail.status_code == 200
    assert "Pacific Ocean" in detail.json()["pages"][0]["text"]

    deleted = client.delete(f"/vault/documents/{document['id']}")
    assert deleted.status_code == 204
    assert client.get("/vault/documents").json() == []
    assert client.get(f"/vault/documents/{document['id']}").status_code == 404


def test_reject_non_pdf_and_invalid_pdf(client):
    assert client.post(
        "/vault/documents",
        files={"file": ("notes.txt", b"hello", "text/plain")},
    ).status_code == 400
    assert client.post(
        "/vault/documents",
        files={"file": ("broken.pdf", b"not a real PDF", "application/pdf")},
    ).status_code == 422


def test_search_returns_page_provenance(client):
    uploaded = client.post(
        "/vault/documents",
        files={"file": ("ocean.pdf", make_pdf(), "application/pdf")},
    )
    assert uploaded.status_code == 201
    results = client.get("/vault/search", params={"q": "Pacific Ocean"}).json()
    assert results["results"]
    assert results["results"][0]["document_id"] == uploaded.json()["id"]
    assert results["results"][0]["page"] == 1

    
def test_search_returns_no_zero_score_matches(client):
    uploaded = client.post(
        "/vault/documents",
        files={"file": ("ocean.pdf", make_pdf(), "application/pdf")},
    )
    assert uploaded.status_code == 201

    response = client.get(
        "/vault/search",
        params={"q": "quantum computing"},
    )

    assert response.status_code == 200
    results = response.json()["results"]
    assert all(result["score"] > 0.0 for result in results)
