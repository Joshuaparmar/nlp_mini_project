# Second Opinion

Second Opinion helps review factual claims in AI-generated answers against
source documents. It extracts candidate claims, retrieves relevant passages
from PDFs, and presents evidence with source and page references so a person
can assess the result.

> **Important:** Second Opinion is an assistive review tool, not a fact-checking
> authority. Its model scores are not calibrated probabilities of correctness.
> Review the cited passages and use independent judgment.

## What it does

- Accepts an answer and one or more source PDFs for claim-level review.
- Extracts PDF text while preserving document and page provenance.
- Retrieves evidence using a combination of TF-IDF and semantic embeddings.
- Classifies evidence as **SUPPORTED**, **CONTRADICTED**, or
  **INSUFFICIENT EVIDENCE**.
- Abstains when evidence is missing, off-topic, or conflicting rather than
  treating every model output as conclusive.
- Saves PDFs and extracted page text in a local Personal Knowledge Vault for
  reuse and search.
- Provides a React interface for preparing audits and reviewing claims and
  evidence.

## Technology

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Python, FastAPI, Pydantic
- **PDF processing:** PyMuPDF
- **Retrieval:** scikit-learn TF-IDF and Sentence Transformers
- **Evidence classification:** Hugging Face Transformers NLI model
- **Vault:** SQLite and local PDF files

## Requirements

- Python 3.10 or newer
- Node.js supported by Vite 8 (Node.js 20.19+ or 22.12+)
- Internet access on first use to download the pretrained Hugging Face models

No third-party API key is required. Model files are cached by the Hugging Face
libraries on the machine running the backend.

## Get started

Clone the repository and enter its directory:

```shell
git clone https://github.com/Joshuaparmar/nlp_mini_project.git
cd nlp_mini_project
```

### 1. Set up and start the backend

In PowerShell:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
python -m uvicorn backend.main:app --reload
```

If PowerShell prevents virtual-environment activation, see Microsoft's
[execution policy documentation](https://learn.microsoft.com/powershell/module/microsoft.powershell.security/set-executionpolicy).
You can also run the environment's Python directly without activating it:

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

The API is available at `http://localhost:8000`. Interactive API
documentation is at `http://localhost:8000/docs`.

### 2. Set up and start the frontend

Open a second terminal in the repository root:

```shell
npm ci
npm run dev
```

Open the local URL printed by Vite (by default, `http://localhost:5173`).
The frontend connects to `http://localhost:8000` by default.

On Windows, you can start both development servers and open the app in your
browser with `Start_Second_Opinion.bat` after installing the dependencies.

## Configuration

| Variable | Component | Default | Description |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Frontend | `http://localhost:8000` | Base URL used for backend requests. Set it before starting Vite. |
| `SECOND_OPINION_VAULT_DIR` | Backend | `backend/data/vault` | Directory for the local SQLite database and saved PDF files. |

PowerShell example for a non-default API URL:

```powershell
$env:VITE_API_BASE_URL = "http://localhost:8000"
npm run dev
```

## API overview

The backend exposes these primary endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Check that the backend is running. |
| `POST` | `/verify` | Verify an answer against uploaded PDFs, saved Vault documents, or both. |
| `POST` | `/vault/documents` | Add a PDF to the local Knowledge Vault. |
| `GET` | `/vault/documents` | List saved documents. |
| `GET` | `/vault/documents/{document_id}` | Get a saved document and its extracted page text. |
| `DELETE` | `/vault/documents/{document_id}` | Remove a saved document. |
| `GET` | `/vault/search?q=...` | Search extracted text in saved documents. |

`POST /verify` accepts `multipart/form-data` with:

- `answer` — the answer text to review.
- `files` — zero or more source PDFs (each up to 20 MB).
- `document_ids` — zero or more IDs of PDFs already saved in the Vault.

At least one PDF file or Vault document ID is required. The verification
response includes extracted claims, verdicts, evidence passages, source/page
references, explanations, and uncertainty details where applicable. See
`/docs` for the full request and response schemas.

## How verification works

1. The backend splits the answer into candidate sentence-level claims. This is
   a heuristic, not a semantic claim detector.
2. PDF text is extracted page by page. Image-only/scanned PDFs are not
   OCR-processed.
3. Text is split into overlapping passages and ranked with a hybrid retriever:
   65% semantic similarity and 35% TF-IDF lexical similarity.
4. Retrieved passages are evaluated with the
   [`cross-encoder/nli-deberta-v3-small`](https://huggingface.co/cross-encoder/nli-deberta-v3-small)
   natural-language-inference model. A lexical relevance check helps prevent
   off-subject contradictions from being treated as decisive.
5. Results preserve the source filename and page number for human review.

The first verification request may take longer while the models are downloaded
and loaded.

## Tests and checks

Run the backend test suite from the repository root:

```shell
python -m pytest
```

The model-backed test is skipped by default. To run it, set
`RUN_MODEL_TESTS=1`; it downloads and loads the real models:

```powershell
$env:RUN_MODEL_TESTS = "1"
python -m pytest tests\test_model_backed_oceans.py -s
```

Build and lint the frontend:

```shell
npm run build
npm run lint
```

## Data, privacy, and deployment

- PDFs saved to the Knowledge Vault and their extracted text remain in the
  configured local Vault directory. Uploaded PDFs used only for `/verify` are
  processed via temporary files and removed after extraction.
- The default backend configuration is for local development: it allows
  requests from any origin and does not provide authentication. Restrict CORS,
  add appropriate access controls, and review data-retention requirements
  before exposing it to a network or using sensitive documents.
- Evidence retrieval and NLI classification can be wrong or incomplete.
  Unsupported claims, contradictory sources, and model uncertainty require
  human review.

## Repository layout

```text
backend/       FastAPI API, PDF handling, retrieval, verification, and Vault
src/           React and TypeScript frontend
tests/         Backend unit and API contract tests
public/        Static frontend assets
```