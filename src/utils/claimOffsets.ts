import type { VerifiedClaim } from '../types/audit';

export type TextSegment = 
  | { type: 'text'; content: string; key: string }
  | { type: 'claim'; claim: VerifiedClaim; key: string };

/**
 * Validates, repairs, and sorts claim character offsets against the original text.
 * Prevents word-collision errors by sequential tracking and protects against overlapping spans.
 */
export function validateAndAlignClaims(
  originalText: string, 
  rawClaims: VerifiedClaim[]
): VerifiedClaim[] {
  if (!originalText || !rawClaims || rawClaims.length === 0) {
    return [];
  }

  const alignedClaims: VerifiedClaim[] = [];
  let searchCursor = 0;

  for (let i = 0; i < rawClaims.length; i++) {
    const claim = rawClaims[i];
    let start = claim.startOffset;
    let end = claim.endOffset;
    const targetText = claim.text.trim();

    if (!targetText) continue;

    // Check if provided offsets are exact
    let isOffsetValid = 
      start >= 0 && 
      end <= originalText.length && 
      start < end &&
      originalText.slice(start, end).trim() === targetText;

    // If offset is invalid or missing, locate exact span sequentially
    if (!isOffsetValid) {
      // 1. Try finding from searchCursor onwards (avoids colliding with duplicate words)
      let foundIndex = originalText.indexOf(targetText, searchCursor);

      // 2. If not found after searchCursor, fallback to searching from beginning
      if (foundIndex === -1) {
        foundIndex = originalText.indexOf(targetText);
      }

      // 3. Fallback: Normalized whitespace search if literal match fails
      if (foundIndex === -1) {
        const normalizedTarget = targetText.replace(/\s+/g, ' ');
        const normalizedSource = originalText.replace(/\s+/g, ' ');
        const normIndex = normalizedSource.indexOf(normalizedTarget);
        if (normIndex !== -1) {
          // Re-map back if possible or search for first and last 20 characters
          const prefix = targetText.slice(0, Math.min(25, targetText.length));
          foundIndex = originalText.indexOf(prefix, searchCursor);
          if (foundIndex === -1) {
            foundIndex = originalText.indexOf(prefix);
          }
        }
      }

      if (foundIndex !== -1) {
        start = foundIndex;
        end = foundIndex + targetText.length;
        isOffsetValid = true;
      }
    }

    if (isOffsetValid) {
      alignedClaims.push({
        ...claim,
        startOffset: start,
        endOffset: end,
      });
      searchCursor = end;
    }
  }

  // Sort strictly by startOffset
  alignedClaims.sort((a, b) => a.startOffset - b.startOffset);

  // De-overlap: if claim B overlaps with claim A, resolve safely
  const resolvedClaims: VerifiedClaim[] = [];
  let lastEnd = 0;

  for (const claim of alignedClaims) {
    if (claim.startOffset >= lastEnd) {
      resolvedClaims.push(claim);
      lastEnd = claim.endOffset;
    } else if (claim.endOffset > lastEnd) {
      // Partial overlap: trim start of overlapping claim
      resolvedClaims.push({
        ...claim,
        startOffset: lastEnd,
      });
      lastEnd = claim.endOffset;
    }
    // Completely covered claims are omitted to prevent nested or duplicate text rendering
  }

  return resolvedClaims;
}

/**
 * Splits original text into renderable React segments (plain text vs. verified claims)
 * Preserves 100% of punctuation, spaces, and line breaks verbatim.
 */
export function buildTextSegments(
  originalText: string, 
  alignedClaims: VerifiedClaim[]
): TextSegment[] {
  if (!originalText) return [];
  if (!alignedClaims || alignedClaims.length === 0) {
    return [{ type: 'text', content: originalText, key: 'text-full' }];
  }

  const segments: TextSegment[] = [];
  let cursor = 0;

  for (let i = 0; i < alignedClaims.length; i++) {
    const claim = alignedClaims[i];

    // Text before the claim
    if (claim.startOffset > cursor) {
      segments.push({
        type: 'text',
        content: originalText.slice(cursor, claim.startOffset),
        key: `text-before-${i}-${cursor}`,
      });
    }

    // The claim itself (slice directly from original text to preserve exact casing & punctuation)
    segments.push({
      type: 'claim',
      claim: {
        ...claim,
        text: originalText.slice(claim.startOffset, claim.endOffset),
      },
      key: `claim-${claim.id || i}-${claim.startOffset}`,
    });

    cursor = claim.endOffset;
  }

  // Remaining text after last claim
  if (cursor < originalText.length) {
    segments.push({
      type: 'text',
      content: originalText.slice(cursor),
      key: `text-end-${cursor}`,
    });
  }

  return segments;
}
