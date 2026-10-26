"""
Relevance-aware evidence selection for claim verification.

Why this module exists
----------------------
A sentence-pair NLI model labels *pairs*; it does not know whether a passage is
about the same subject as the claim. Models trained on SNLI/MNLI often answer
"contradiction" for two fluent sentences that describe different entities with
the same predicate (e.g. "The Indian Ocean is the third-largest ocean" versus
the claim "The Pacific Ocean is the largest ocean"). Those labels can carry
high softmax scores, but a high score is not a probability of being correct.

This module therefore separates two questions:

1. Is the passage *on the claim's subject*? (cheap lexical anchor check)
2. What did the NLI model say about the pair?

Only passages that are on-subject may support or contradict a claim. An
off-subject "contradiction" never overturns on-subject evidence. If the ONLY
signal is an off-subject contradiction, the claim is NOT marked CONTRADICTED;
the system abstains and shows the passage for human review.

Genuine conflicts (an on-subject supporting passage AND an on-subject
contradicting passage) still produce an abstention.

Limitations (deliberate and documented)
---------------------------------------
* The anchor check is lexical. It does not resolve synonyms, pronouns, or
  coreference across sentences, and it can miss legitimate cross-entity
  refutations (e.g. "Arctic is the smallest" refuting "Indian is the smallest").
  Those cases abstain instead of guessing.
* It does not make the NLI model more accurate on on-subject passages.
* It is not a substitute for an evaluated, calibrated verifier.

This module has no dependency on torch, transformers or scikit-learn so it can
be unit-tested without downloading a model.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from typing import Any, Callable, Sequence

from backend.schemas import EvidenceItem, VerifiedClaim


logger = logging.getLogger(__name__)

MAX_EVIDENCE_ITEMS = 3

# Share of the claim's content words that must appear in the passage.
MIN_ENTITY_CONTENT_COVERAGE = 0.20  # when the claim has a named-entity anchor
MIN_FALLBACK_COVERAGE = 0.50  # when the claim has no named-entity anchor

STOPWORDS = frozenset(
    """
    a an the and or but if of in on at to for from by with as is are was were
    be been being it its this that these those he she they we you i his her
    their our your not no than then there here which who whom whose what when
    where why how also into over under about after before between during per
    s has have had do does did can could will would may might
    """.split()
)

# Generic head nouns that often follow a proper name ("Pacific Ocean"). They are
# not required to match, so "The Pacific is..." still anchors "Pacific Ocean".
GENERIC_ENTITY_HEADS = frozenset(
    {
        "ocean", "sea", "river", "lake", "mountain", "mount", "university",
        "company", "inc", "corp", "ltd", "city", "country", "state",
    }
)

_TOKEN_RE = re.compile(r"[^\W_]+", re.UNICODE)


class VerificationModelError(RuntimeError):
    """Raised when the NLI classifier fails for a claim/passage pair."""


# --------------------------------------------------------------------------
# Relevance
# --------------------------------------------------------------------------

@dataclass(frozen=True)
class Relevance:
    anchored: bool
    anchor_tokens: tuple[str, ...]
    anchor_matched: bool
    content_coverage: float
    reason: str


def _tokens(text: str) -> list[str]:
    return _TOKEN_RE.findall(text)


def _norm(token: str) -> str:
    value = token.lower()
    if len(value) > 3 and value.endswith("s") and not value.endswith("ss"):
        value = value[:-1]
    return value


def _is_capitalised(token: str) -> bool:
    return token[0].isupper() or any(ch.isupper() for ch in token[1:])


def extract_entity_phrases(text: str) -> list[tuple[str, ...]]:
    """
    Return runs of capitalised, non-stopword tokens as lower-cased tuples.

    A single capitalised word at the very start of the text is ignored because
    it is usually just sentence-initial capitalisation ("Revenue grew ...").
    """
    tokens = _tokens(text)
    phrases: list[tuple[str, ...]] = []
    run: list[str] = []
    run_start = 0

    for index, token in enumerate(tokens + [""]):
        if token and _is_capitalised(token) and token.lower() not in STOPWORDS:
            if not run:
                run_start = index
            run.append(token)
            continue

        if run:
            if not (run_start == 0 and len(run) == 1):
                phrases.append(tuple(item.lower() for item in run))
            run = []

    return phrases


def claim_anchor_tokens(claim: str) -> tuple[str, ...]:
    """
    Tokens that identify the claim's subject: the FIRST named-entity phrase,
    minus generic head nouns. Empty when the claim contains no named entity.
    """
    phrases = extract_entity_phrases(claim)
    if not phrases:
        return ()

    first = phrases[0]
    specific = tuple(t for t in first if t not in GENERIC_ENTITY_HEADS)
    return tuple(_norm(t) for t in (specific or first))


def _content_set(text: str) -> set[str]:
    return {
        _norm(token)
        for token in _tokens(text)
        if token.lower() not in STOPWORDS
    }


def assess_relevance(claim: str, passage_text: str) -> Relevance:
    """Decide whether a passage is on the claim's subject (lexical check)."""
    claim_content = _content_set(claim)
    passage_content = _content_set(passage_text)

    coverage = (
        len(claim_content & passage_content) / len(claim_content)
        if claim_content
        else 0.0
    )

    anchor = claim_anchor_tokens(claim)

    if anchor:
        matched = all(token in passage_content for token in anchor)
        anchored = matched and coverage >= MIN_ENTITY_CONTENT_COVERAGE
        if not matched:
            reason = (
                "Passage does not mention the claim's subject "
                f"({' '.join(anchor)})."
            )
        elif not anchored:
            reason = "Passage mentions the subject but shares too few terms."
        else:
            reason = "Passage mentions the claim's subject."
        return Relevance(anchored, anchor, matched, coverage, reason)

    anchored = coverage >= MIN_FALLBACK_COVERAGE
    reason = (
        "Claim has no named entity; passage shares enough content words."
        if anchored
        else "Claim has no named entity; passage shares too few content words."
    )
    return Relevance(anchored, anchor, anchored, coverage, reason)


# --------------------------------------------------------------------------
# Decision logic (pure, deterministic)
# --------------------------------------------------------------------------

@dataclass(frozen=True)
class ScoredPassage:
    passage: Any  # needs .source .page .text .retrieval_score
    nli: Any  # needs .label .score .verdict .explanation
    relevance: Relevance


@dataclass(frozen=True)
class ClaimDecision:
    verdict: str
    evidence: list[ScoredPassage]
    primary: ScoredPassage | None
    explanation: str
    uncertainty_reasons: list[str] = field(default_factory=list)
    conflicting_signals: bool = False
    has_relevant_evidence: bool = False


def _by_nli(items: Sequence[ScoredPassage]) -> list[ScoredPassage]:
    return sorted(
        items,
        key=lambda s: (-s.nli.score, -s.passage.retrieval_score),
    )


def _by_retrieval(items: Sequence[ScoredPassage]) -> list[ScoredPassage]:
    return sorted(items, key=lambda s: -s.passage.retrieval_score)


def decide_claim(scored: Sequence[ScoredPassage]) -> ClaimDecision:
    relevant = [s for s in scored if s.relevance.anchored]
    off_subject = [s for s in scored if not s.relevance.anchored]
    off_subject_contradictions = [
        s for s in off_subject if s.nli.verdict == "CONTRADICTED"
    ]

    if not relevant:
        reasons = [
            "No retrieved passage mentions the claim's subject, so no "
            "passage could directly support or contradict it.",
            "The uploaded documents may not contain the information needed "
            "to assess this claim.",
        ]
        evidence: list[ScoredPassage] = []
        explanation = (
            "No retrieved passage was about the same subject as the claim."
        )

        if off_subject_contradictions:
            evidence = _by_retrieval(off_subject_contradictions)[:1]
            reasons.append(
                f"{len(off_subject_contradictions)} retrieved passage(s) "
                "that do not mention the claim's subject were labelled "
                "'contradiction' by the NLI model. Such labels are often "
                "model artefacts, so they were not treated as a verdict. If "
                "the claim relies on exclusivity (e.g. only one 'smallest'), "
                "review the shown passage manually."
            )
            explanation = (
                "Only passages about a different subject were labelled as "
                "contradicting the claim; the system abstained instead of "
                "treating that as a factual contradiction."
            )

        return ClaimDecision(
            verdict="INSUFFICIENT EVIDENCE",
            evidence=evidence,
            primary=None,
            explanation=explanation,
            uncertainty_reasons=reasons,
            conflicting_signals=False,
            has_relevant_evidence=False,
        )

    supported = [s for s in relevant if s.nli.verdict == "SUPPORTED"]
    contradicted = [s for s in relevant if s.nli.verdict == "CONTRADICTED"]

    if supported and contradicted:
        best_support = _by_nli(supported)[0]
        best_contra = _by_nli(contradicted)[0]
        pair = [best_support, best_contra]
        primary = _by_retrieval(pair)[0]
        return ClaimDecision(
            verdict="INSUFFICIENT EVIDENCE",
            evidence=pair,
            primary=primary,
            explanation=(
                "Relevant passages about the claim's subject produced "
                "conflicting support and contradiction signals. The system "
                "abstained rather than selecting one side as conclusive."
            ),
            uncertainty_reasons=[
                "Relevant passages gave conflicting NLI verdicts."
            ],
            conflicting_signals=True,
            has_relevant_evidence=True,
        )

    if supported:
        ranked = _by_nli(supported)[:MAX_EVIDENCE_ITEMS]
        return ClaimDecision(
            verdict="SUPPORTED",
            evidence=ranked,
            primary=ranked[0],
            explanation=ranked[0].nli.explanation,
            has_relevant_evidence=True,
        )

    if contradicted:
        ranked = _by_nli(contradicted)[:MAX_EVIDENCE_ITEMS]
        return ClaimDecision(
            verdict="CONTRADICTED",
            evidence=ranked,
            primary=ranked[0],
            explanation=ranked[0].nli.explanation,
            has_relevant_evidence=True,
        )

    top = _by_retrieval(relevant)[0]
    return ClaimDecision(
        verdict="INSUFFICIENT EVIDENCE",
        evidence=[top],
        primary=top,
        explanation=top.nli.explanation,
        uncertainty_reasons=[
            "The available passages did not provide a decisive "
            "support or contradiction signal."
        ],
        has_relevant_evidence=True,
    )


# --------------------------------------------------------------------------
# Orchestration for one claim
# --------------------------------------------------------------------------

def _to_evidence_item(scored: ScoredPassage) -> EvidenceItem:
    return EvidenceItem(
        text=scored.passage.text,
        source=scored.passage.source,
        page=scored.passage.page,
        retrieval_score=scored.passage.retrieval_score,
    )


def build_verified_claim(
    claim: str,
    passages: Sequence[Any],
    *,
    classifier: Callable[[str, str], Any],
    confidence_builder: Callable[..., Any],
    localizer: Callable[[str, str], list],
    min_retrieval_score: float = 0.05,
) -> VerifiedClaim:
    """
    Verify one claim against retrieved passages.

    `classifier(claim, passage_text)` must return an object with
    label/score/verdict/explanation (e.g. verifier.NLIResult).
    """
    candidates = [
        p for p in passages if p.retrieval_score >= min_retrieval_score
    ]

    if not candidates:
        return VerifiedClaim(
            claim=claim,
            verdict="INSUFFICIENT EVIDENCE",
            evidence=[],
            explanation=(
                "No sufficiently relevant passage was retrieved "
                "from the uploaded documents."
            ),
            uncertainty_reasons=[
                "No retrieved passage passed the relevance threshold.",
                "The uploaded documents may not contain the information "
                "needed to assess this claim.",
            ],
            confidence_status="NOT_AVAILABLE",
        )

    scored: list[ScoredPassage] = []

    for passage in candidates:
        try:
            result = classifier(claim, passage.text)
        except Exception as exc:
            logger.exception("NLI inference failed for a claim.")
            raise VerificationModelError(
                "The evidence verification model failed."
            ) from exc

        relevance = assess_relevance(claim, passage.text)
        scored.append(ScoredPassage(passage, result, relevance))

        logger.info(
            "CLAIM: %s | RETRIEVAL: %.3f | ON_SUBJECT: %s | NLI: %s %.4f "
            "| PAIR_VERDICT: %s | SOURCE: %s p.%s | EVIDENCE: %s",
            claim,
            passage.retrieval_score,
            relevance.anchored,
            result.label,
            result.score,
            result.verdict,
            passage.source,
            passage.page,
            passage.text,
        )

    decision = decide_claim(scored)
    evidence = [_to_evidence_item(item) for item in decision.evidence]

    if decision.primary is None:
        return VerifiedClaim(
            claim=claim,
            verdict=decision.verdict,
            evidence=evidence,
            explanation=decision.explanation,
            uncertainty_reasons=decision.uncertainty_reasons,
            confidence_status="NOT_AVAILABLE",
        )

    primary = decision.primary
    confidence = confidence_builder(
        primary.nli.score,
        has_relevant_evidence=decision.has_relevant_evidence,
        conflicting_signals=decision.conflicting_signals,
    )

    localized_issues = []
    if decision.verdict == "CONTRADICTED":
        localized_issues = localizer(claim, primary.passage.text)

    return VerifiedClaim(
        claim=claim,
        verdict=decision.verdict,
        evidence=evidence,
        nli_label=primary.nli.label,
        nli_score=confidence.raw_score,
        confidence_status=confidence.confidence_status,
        explanation=decision.explanation,
        localized_issues=localized_issues,
        uncertainty_reasons=decision.uncertainty_reasons,
    )