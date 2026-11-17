"use client";

import { createContext, useContext } from "react";

import { siteConfig } from "@/config/site";
import { phoneToHref, type ContactDetails } from "@/lib/site/contact-shared";

/**
 * Contact details are read from `site_settings` on the server (so Adesua can
 * change them from the dashboard) and handed to the client tree here. The
 * fallback keeps a component usable outside the provider — a story, a test, a
 * page rendered on its own — without a blank line where her email should be.
 */
const fallback: ContactDetails = {
  email: siteConfig.links.email,
  phone: siteConfig.phone,
  phoneHref: siteConfig.phoneHref || phoneToHref(siteConfig.phone),
  location: siteConfig.location,
  linkedin: siteConfig.links.linkedin,
};

const ContactContext = createContext<ContactDetails>(fallback);

export function ContactProvider({
  value,
  children,
}: {
  value: ContactDetails;
  children: React.ReactNode;
}) {
  return <ContactContext.Provider value={value}>{children}</ContactContext.Provider>;
}

export function useContact(): ContactDetails {
  return useContext(ContactContext);
}
