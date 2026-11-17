/**
 * The contact details the public site shows, in the shape both the server
 * (which reads them from `site_settings`) and the client (which receives them
 * through a provider) need. Kept free of `server-only` so a client component
 * can import the type without pulling the database layer into the bundle.
 */
export interface ContactDetails {
  email: string;
  phone: string;
  /** `tel:` form — digits and a leading plus only. */
  phoneHref: string;
  location: string;
  linkedin: string;
}

/** "+234 806 640 1688" → "+2348066401688". */
export function phoneToHref(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? digits : `+${digits}`;
}
