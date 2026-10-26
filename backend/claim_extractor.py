import re


ABBREVIATIONS = {
    "e.g.", "i.e.", "etc.", "vs.", "mr.", "mrs.", "ms.",
    "dr.", "prof.", "fig.", "no.", "approx."
}

INTRODUCTORY_LABELS = {
    "facts",
    "summary",
    "key points",
    "conclusion",
    "overview",
    "examples",
    "findings",
}


# Abbreviations that are only abbreviations when followed by a number
# ("No. 5", "Fig. 3"); otherwise "no." / "fig." usually ends a sentence.
_NUMBERED_ABBREVIATIONS = {"no.", "fig."}

_GENERAL_ALTERNATION = "|".join(
    re.escape(item)
    for item in sorted(
        ABBREVIATIONS - _NUMBERED_ABBREVIATIONS, key=len, reverse=True
    )
)
_NUMBERED_ALTERNATION = "|".join(
    re.escape(item) for item in sorted(_NUMBERED_ABBREVIATIONS)
)

# Word-boundary matching: "items." and "systems." must NOT match "ms.", and
# "volcano." must NOT match "no.".
_ABBREVIATION_RE = re.compile(
    rf"(?<![A-Za-z0-9])(?:{_GENERAL_ALTERNATION})"
    rf"|(?<![A-Za-z0-9])(?:{_NUMBERED_ALTERNATION})(?=\s*\d)",
    re.IGNORECASE,
)

_PLACEHOLDER_RE = re.compile(r"\x00(\d+)\x00")


def _split_sentences(text: str) -> list[str]:
    """Split text at likely sentence boundaries, protecting common abbreviations.

    Original capitalisation of protected abbreviations is preserved.
    """
    stash: list[str] = []

    def _protect(match: re.Match) -> str:
        stash.append(match.group(0))
        return f"\x00{len(stash) - 1}\x00"

    protected = _ABBREVIATION_RE.sub(_protect, text)
    parts = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9"\'])', protected)

    return [
        _PLACEHOLDER_RE.sub(lambda m: stash[int(m.group(1))], part).strip()
        for part in parts
    ]


def extract_claims(answer: str) -> list[str]:
    """
    Extract candidate factual claims from an AI-generated answer.

    Supports basic prose, Markdown headings, numbered lists and bullet lists.
    Removes duplicate sentences while preserving their displayed wording.

    This is a heuristic sentence splitter, not a semantic claim detector.
    """
    if not answer or not answer.strip():
        return []

    text = answer.replace("\r\n", "\n").replace("\r", "\n")
    claims: list[str] = []
    seen: set[str] = set()

    for raw_line in text.split("\n"):
        line = raw_line.strip()

        if not line:
            continue

        line = re.sub(r"^#{1,6}\s+", "", line).strip()

        if line.rstrip(":").strip().casefold() in INTRODUCTORY_LABELS:
            continue

        line = re.sub(r"^(?:[-*+]\s+|\d+[.)]\s+)", "", line).strip()

        if not line:
            continue

        for candidate in _split_sentences(line):
            claim = candidate.strip().strip()

            if not claim or not re.search(r"[A-Za-z0-9]", claim):
                continue

            key = re.sub(r"\s+", " ", claim).casefold()

            if key not in seen:
                seen.add(key)
                claims.append(claim)

    return claims
