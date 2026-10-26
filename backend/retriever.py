
import logging
import re
from dataclasses import dataclass

import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.pdf_parser import PDFPage


logger = logging.getLogger(__name__)

_EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
_SEMANTIC_WEIGHT = 0.65
_LEXICAL_WEIGHT = 0.35

# Load the model only once per Python process.
_embedding_model = None


def _get_embedding_model() -> SentenceTransformer:
    global _embedding_model

    if _embedding_model is None:
        logger.info("Loading semantic embedding model: %s", _EMBEDDING_MODEL_NAME)
        _embedding_model = SentenceTransformer(_EMBEDDING_MODEL_NAME)

    return _embedding_model


def _normalize_pdf_text(text: str) -> str:
    """Normalize whitespace and repair words split across PDF lines."""
    text = re.sub(r"(?<=\w)-\s*\n\s*(?=\w)", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


@dataclass(frozen=True)
class EvidencePassage:
    """A searchable text passage with its original provenance."""

    source: str
    page: int
    text: str
    retrieval_score: float


def split_into_passages(
    pages: list[PDFPage],
    max_words: int = 180,
    overlap_words: int = 35,
) -> list[EvidencePassage]:
    """Split PDF text into sentence-level, source-preserving passages."""
    if max_words < 1:
        raise ValueError("max_words must be at least 1.")

    if overlap_words < 0 or overlap_words >= max_words:
        raise ValueError(
            "overlap_words must be non-negative and smaller than max_words."
        )

    passages: list[EvidencePassage] = []
    step = max_words - overlap_words

    for page in pages:
        page_text = _normalize_pdf_text(page.text)

        if not page_text:
            continue

        sentences = re.split(
            r"(?<=[.!?])\s+(?=[^\s])",
            page_text,
        )

        for sentence in sentences:
            sentence = re.sub(r"\s+", " ", sentence).strip()

            if not sentence:
                continue

            words = sentence.split()

            if len(words) <= max_words:
                passages.append(
                    EvidencePassage(
                        source=page.source,
                        page=page.page,
                        text=sentence,
                        retrieval_score=0.0,
                    )
                )
                continue

            for start in range(0, len(words), step):
                chunk = " ".join(words[start : start + max_words]).strip()

                if chunk:
                    passages.append(
                        EvidencePassage(
                            source=page.source,
                            page=page.page,
                            text=chunk,
                            retrieval_score=0.0,
                        )
                    )

                if start + max_words >= len(words):
                    break

    logger.info(
        "Split %d PDF pages into %d evidence passages.",
        len(pages),
        len(passages),
    )

    return passages


class TfidfRetriever:
    """Hybrid lexical and semantic retriever for PDF evidence."""

    def __init__(self) -> None:
        self._vectorizer = TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            sublinear_tf=True,
            strip_accents="unicode",
            token_pattern=r"(?u)\b\w+\b",
        )
        self._passages: list[EvidencePassage] = []
        self._matrix = None
        self._embeddings: np.ndarray | None = None
        self._fitted = False

    @property
    def passage_count(self) -> int:
        return len(self._passages)

    def fit(self, pages: list[PDFPage]) -> None:
        """Index PDF passages using TF-IDF and semantic embeddings."""
        if not pages:
            raise ValueError(
                "Cannot index documents without extracted pages."
            )

        passages = split_into_passages(pages)

        if not passages:
            raise ValueError(
                "No non-empty passages were available for indexing."
            )

        texts = [passage.text for passage in passages]

        try:
            matrix = self._vectorizer.fit_transform(texts)
        except ValueError as exc:
            raise ValueError(
                "Could not build the search index. "
                "The supplied documents may contain no searchable terms."
            ) from exc

        model = _get_embedding_model()
        embeddings = model.encode(
            texts,
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        )

        self._passages = passages
        self._matrix = matrix
        self._embeddings = np.asarray(embeddings, dtype=np.float32)
        self._fitted = True

        logger.info(
            "Indexed %d evidence passages using hybrid retrieval.",
            len(self._passages),
        )

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
    ) -> list[EvidencePassage]:
        """Rank passages using combined lexical and semantic similarity."""
        if not self._fitted or self._matrix is None or self._embeddings is None:
            raise RuntimeError("Call fit() before retrieve().")

        if not query or not query.strip():
            raise ValueError("Query must not be empty.")

        if top_k < 1:
            raise ValueError("top_k must be at least 1.")

        query_vector = self._vectorizer.transform([query])
        lexical_scores = cosine_similarity(
            query_vector,
            self._matrix,
        ).ravel()

        model = _get_embedding_model()
        query_embedding = model.encode(
            [query],
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        )[0]

        semantic_scores = self._embeddings @ query_embedding

        # Cosine similarity may be negative; shift semantic scores to [0, 1]
        # so both components contribute on a comparable scale.
        semantic_scores = np.clip((semantic_scores + 1.0) / 2.0, 0.0, 1.0)

        combined_scores = (
            _LEXICAL_WEIGHT * lexical_scores
            + _SEMANTIC_WEIGHT * semantic_scores
        )

        # Stable ordering: higher score first, then original passage order.
        ranked_indices = sorted(
            range(len(combined_scores)),
            key=lambda index: (-float(combined_scores[index]), index),
        )[:top_k]

        return [
            EvidencePassage(
                source=self._passages[index].source,
                page=self._passages[index].page,
                text=self._passages[index].text,
                retrieval_score=float(combined_scores[index]),
            )
            for index in ranked_indices
        ]
