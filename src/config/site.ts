export const siteConfig = {
  name: "Adesua Oriaifo",
  tagline: "Transform. Transcend. Become.",
  role: "Head, Customer Success · Customer Experience Specialist (CXS™)",
  disciplines: "Customer Journey · Coaching · Facilitation",
  description:
    "Customer Experience & Client Success Leader, Coach, and Facilitator. Meaningful growth, without losing yourself.",
  philosophy: "A life lived with purpose. An impact made with intention.",
  principles: "Better People | Better Experiences | A Brighter Future",
  signature: "Lead with Care.",
  promise: "Meaningful growth, without losing yourself.",
  purpose: "Purpose drives everything.",
  outlook: "More Confidence. Greater Impact. Brighter Futures.",
  location: "Nigeria",
  locationLong: "Based in Nigeria, working globally.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://adesua.com",
  ogImage: "/brand/portrait-black-blazer.jpg",
  phone: "+234 806 640 1688",
  phoneHref: "+2348066401688",
  links: {
    email: "contact@adesuaoriaifo.com",
    linkedin: "https://www.linkedin.com/in/adesua-margaret-oriaifo-423633182",
  },
  /**
   * Homepage metrics band.
   *
   * Every figure is quoted from Adesua's own professional record (Access Bank
   * and Sterling Bank roles on her LinkedIn profile) — CSAT 86% and NPS +28 as
   * at June 2022, 55% faster resolution after the payment-flow redesign, and
   * "over seven years" in customer experience. Nothing here is estimated.
   * The band hides itself entirely if the list is empty.
   */
  metrics: [
    {
      value: "7+",
      label: "Years in customer experience",
      detail: "Customer success, corporate banking, quality management",
    },
    {
      value: "86%",
      label: "Customer satisfaction",
      detail: "Corporate banking platform, June 2022",
    },
    {
      value: "+28",
      label: "NPS points",
      detail: "Loyalty rating, June 2021 to June 2022",
    },
    {
      value: "55%",
      label: "Faster resolution",
      detail: "After redesigning the payment flow",
    },
  ] as const,

  values: [
    {
      title: "Integrity",
      summary: "Doing the right thing, especially when it costs something.",
    },
    {
      title: "Excellence",
      summary: "High standards, held with warmth rather than perfectionism.",
    },
    {
      title: "Honour & human dignity",
      summary: "Every person treated as worthy, in every room, every time.",
    },
    {
      title: "Faith",
      summary: "A grounded centre that keeps the work steady and honest.",
    },
    {
      title: "Measurable transformation",
      summary: "Growth you can point to, not just feel.",
    },
  ],
  /** Enquiry types offered by the contact form and by Zee. */
  enquiryTypes: [
    { value: "coaching", label: "Coaching" },
    { value: "consulting", label: "Consulting" },
    { value: "speaking", label: "Speaking" },
    { value: "writing", label: "Writing" },
    { value: "other", label: "Something else" },
  ],
} as const;

export const pathways = {
  personalGrowth: {
    slug: "personal-growth",
    title: "Personal Growth",
    summary:
      "Coaching, identity, purpose, intentional living, productivity, confidence, and accountability.",
  },
  professionalImpact: {
    slug: "professional-impact",
    title: "Professional Impact",
    summary:
      "Customer experience, client success, leadership, learning & development, facilitation, and organisation development.",
  },
} as const;

export const collectives = {
  collective: {
    title: "The Intentional Collective",
    summary:
      "Personal development, identity, purpose, productivity, intentional living and community.",
  },
  impactCollective: {
    title: "The Intentional Impact Collective",
    summary:
      "Leadership, learning & development, customer experience, customer success and organisational transformation.",
  },
} as const;

export const insightCategories = [
  { slug: "life-in-colour", name: "Life In Colour" },
  { slug: "personal-growth", name: "Personal Growth" },
  { slug: "professional-impact", name: "Professional Impact" },
  { slug: "leadership", name: "Leadership" },
  { slug: "customer-experience", name: "Customer Experience" },
  { slug: "purpose-intentionality", name: "Purpose & Intentionality" },
  { slug: "facilitation-l-d", name: "Facilitation & L&D" },
  { slug: "reflections", name: "Reflections" },
] as const;
