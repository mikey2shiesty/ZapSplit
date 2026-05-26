/**
 * Returns avatar initials from a person's display name.
 *
 *   "Michael Cheneka" → "MC"
 *   "Tyler"           → "T"
 *   "vicky"           → "V"
 *   "" or undefined   → "?"
 *
 * Multi-word names use first + last word initials; single-word names use
 * a single uppercase letter. Email fallback is the caller's responsibility.
 */
export function getInitials(name?: string | null): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}
