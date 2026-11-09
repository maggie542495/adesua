/**
 * Shared by the article editor (which previews the URL as you type the title)
 * and the save action (which is the one that actually decides it), so the two
 * can never disagree. It lives outside the `"use server"` module because every
 * export of one of those has to be an async server function.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    // Strip combining marks (accents, tildes) rather than listing the range.
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
