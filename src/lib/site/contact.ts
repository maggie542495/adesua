import "server-only";

import { siteConfig } from "@/config/site";
import { getPublicSiteSettings } from "@/repositories/page-repository";
import { phoneToHref, type ContactDetails } from "@/lib/site/contact-shared";

/**
 * Contact details as the public site should show them.
 *
 * The admin dashboard writes `contact_email`, `contact_phone`,
 * `contact_location` and `social_linkedin` into `site_settings`; anything she
 * has not filled in falls back to the values in `siteConfig`, so the site is
 * never left with a blank line where a way to reach her should be.
 */
export async function getContactDetails(): Promise<ContactDetails> {
  const settings = await getPublicSiteSettings();

  const email = pick(settings.contact_email, siteConfig.links.email);
  const phone = pick(settings.contact_phone, siteConfig.phone);
  const location = pick(settings.contact_location, siteConfig.location);
  const linkedin = pick(settings.social_linkedin, siteConfig.links.linkedin);

  return {
    email,
    phone,
    phoneHref: phoneToHref(phone),
    location,
    linkedin,
  };
}

function pick(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}
