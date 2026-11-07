export const siteConfig = {
  name: "Adesua Oriaifo",
  tagline: "Transform. Transcend. Become.",
  role: "Customer Experience & Client Success Leader",
  disciplines: "Coach · Facilitator · Purpose-Driven",
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
  links: {
    email: "adesua.oriaifo@gmail.com",
    linkedin: "https://www.linkedin.com/in/adesuaoriaifo",
  },
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
