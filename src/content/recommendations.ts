/**
 * Recommendations received on LinkedIn.
 *
 * Every entry is quoted verbatim from Adesua's LinkedIn profile. Nothing here
 * is written, paraphrased or invented for the site — if a recommendation is
 * edited there, copy it again from the source. Quotes that LinkedIn truncates
 * behind "… more" end at the last complete sentence.
 *
 * Source: https://www.linkedin.com/in/adesua-margaret-oriaifo-423633182
 */

export interface Recommendation {
  /** Their name exactly as it appears on LinkedIn. */
  author: string;
  /** Their professional headline. */
  role: string;
  /** How they know Adesua, as LinkedIn states it. */
  relationship: string;
  /** When it was given, ISO date. */
  date: string;
  quote: string;
}

export const recommendationsSource =
  "https://www.linkedin.com/in/adesua-margaret-oriaifo-423633182/details/recommendations/";

export const recommendations: readonly Recommendation[] = [
  {
    author: "Adesuwa Aihanuwa",
    role: "Customer Experience Professional & Banking Operations",
    relationship: "Reported to Adesua directly",
    date: "2025-06-02",
    quote:
      "Adesua is best described as calm, composed, and highly intelligent. She demonstrates strong leadership qualities characterized by inclusiveness and collaboration, rather than an autocratic approach. She encourages input from others, actively listens to suggestions, and fosters a supportive environment. Adesua is approachable, dependable, and always willing to offer help and guidance, making her a valuable team member and leader.",
  },
  {
    author: "Idris Salami",
    role: "Customer Experience Expert",
    relationship: "Reported to Adesua directly",
    date: "2025-05-30",
    quote:
      "I've had the pleasure of working with many professionals in our line of work as a customer experience expert, but Adesua, who happens to be my Unit Head, is someone whom I will always remember fondly. She is a good listener, and she consistently gave 100 percent effort to the team and played a significant role in ensuring that we completed assignments on time. Watching her adapt to our ever-changing business landscape was an inspiration! Her overcoming challenges with a smile made her stand out as a cut above the rest!",
  },
  {
    author: "Olayinka Aderibigbe",
    role: "Digital Resolution Officer & Client Support Specialist",
    relationship: "Reported to Adesua directly",
    date: "2025-05-29",
    quote:
      "I've had the privilege of working under the leadership of Adesua Oriaifo, and I can confidently say she is one of the most exceptional leaders I've encountered. As our Unit Head, Adesua consistently demonstrated clarity, empathy, and a results-driven approach that made a lasting impact on both our team and our work culture. She has an incredible ability to balance strategic thinking with day-to-day execution.",
  },
  {
    author: "Lateef Hassan",
    role: "Customer Experience",
    relationship: "Worked on the same team",
    date: "2025-05-29",
    quote:
      "Adesua Oriaifo is an exceptional leader who has elevated our team to new heights. Her strategic vision, expertise, and passion for delivering outstanding customer experiences have been truly invaluable. As a visionary leader, Adesua embodies a customer-centric approach that I've had the privilege to learn from. Her strategic problem-solving skills and ability to empower team members have fostered a culture of excellence, yielding consistent delivery of exceptional results.",
  },
  {
    author: "Ayilara Funmilayo",
    role: "Customer Experience",
    relationship: "Reported to Adesua directly",
    date: "2025-05-28",
    quote:
      "I currently work under the leadership of Miss Adesua Oriaifo and I can confidently say that she's an exceptional leader. Her ability to build strong relationship with us and communicate effectively has been instrumental in driving our team's success. She's a leader who leads by example and I highly recommend her for any future opportunities.",
  },
  {
    author: "Amarachi Okonkwo, ACIB",
    role: "Customer Experience Business Partner",
    relationship: "Worked on the same team at Access Bank",
    date: "2024-07-30",
    quote:
      "Adesua has an exceptional ability to understand and navigate complex challenges. Her in-depth knowledge and expertise in Customer Experience were evident in every project she undertook. She has a remarkable knack for breaking down intricate problems and providing clear, actionable solutions, which was invaluable to our team's workflow and overall productivity.",
  },
  {
    author: "Blessing Okakwu, ACA",
    role: "Chartered Accountant & Data Analyst",
    relationship: "Worked on the same team",
    date: "2024-07-29",
    quote:
      "As the Head of Customer Success at Sterling Bank, she has consistently demonstrated her ability to understand customer needs and drive strategies that significantly enhanced customer satisfaction and loyalty. She possesses an exceptional ability to lead and inspire her team while fostering a collaborative environment where every team member feels valued and motivated to contribute their best.",
  },
  {
    author: "Ifeoma Olisa-Nwokedi",
    role: "Head, Corporate Solutions and Services",
    relationship: "Worked on the same team",
    date: "2024-06-10",
    quote: "One of the most experienced CX personnel I know.",
  },
  {
    author: "Valerie Emuobonuvie",
    role: "Senior Estimator, Electric Power & Utilities",
    relationship: "Worked on the same team at Access Bank",
    date: "2024-03-26",
    quote:
      "Adesua is an exceptional professional who consistently goes above and beyond to ensure the highest level of service delivery and customer satisfaction. One of Adesua's key strengths is her willingness to assist and her proactive approach to identifying and addressing customer pain points. She was also largely responsible for conducting regular staff trainings to address patterns of user frustrations, resulting in the branch being recognized as Outstanding in the region.",
  },
  {
    author: "Uwabhagbe Amarachi O., ACIB, CISI",
    role: "Financial Operations & Operational Risk",
    relationship: "Worked on the same team",
    date: "2024-03-20",
    quote:
      "Adesua is one colleague whose ability to combine professionalism and customer support is amazing. While we worked together, Ade displayed these qualities including teamwork. She is also an extremely organized individual with a great sense of humour and I would by all means recommend her as a valuable asset to any organisation.",
  },
  {
    author: "Victor Jacob",
    role: "Digital Services, Platforms & Products",
    relationship: "Worked across teams at Access Bank",
    date: "2024-03-17",
    quote:
      "Adesua played a crucial role within our team, focusing on delivering and supporting our corporate platform. Her deep understanding of our product and unwavering dedication to ensuring top-tier service for our clients were truly commendable. Adesua's collaborative spirit and meticulous attention to detail significantly contributed to enhancing our product's usability and elevating customer satisfaction levels.",
  },
  {
    author: "Oriowo Kaka",
    role: "Customer Experience Management & User Research",
    relationship: "Worked on the same team for three years",
    date: "2024-02-01",
    quote:
      "Adesua is a well rounded customer experience professional who embodies the phrase 'attention to detail'. During the three years we worked together at Access Bank, I witnessed her effectively resolve customer complaints while maintaining the highest level of professionalism in managing customer relationships. She oversaw the user experience of the bank's corporate digital channel and regularly gathered user feedback to monitor user experience and derive actionable customer insights.",
  },
  {
    author: "Oladoyin Makinde Babalola, CXAC",
    role: "Customer Experience Specialist & Service Design",
    relationship: "Worked on the same team at Access Bank",
    date: "2024-01-31",
    quote:
      "Adesua possesses a unique blend of professionalism, empathy, and attention to detail that greatly contributes to her success in the customer experience field. She consistently demonstrated an unwavering commitment to exceeding customer expectations and resolving inquiries with efficiency and effectiveness.",
  },
  {
    author: "Jonathan Osagie",
    role: "Tech Entrepreneur, AI & Data Analytics",
    relationship: "Worked on the same team",
    date: "2021-08-11",
    quote: "Adesua is an astute data analyst. She's got skills & has an eye for trends!",
  },
];

/**
 * The subset used in the short quote bands (homepage rotator, /about).
 *
 * Selected for range rather than length: two are from people who reported to
 * her, one from a peer on customer outcomes, one on delivery, one on her
 * platform work, and one short line that lands on its own. Edit this list to
 * change what the bands show — the full set always lives on /references.
 */
const featuredAuthors = [
  "Lateef Hassan",
  "Adesuwa Aihanuwa",
  "Amarachi Okonkwo, ACIB",
  "Blessing Okakwu, ACA",
  "Oladoyin Makinde Babalola, CXAC",
  "Ifeoma Olisa-Nwokedi",
  "Victor Jacob",
] as const;

export const featuredRecommendations: readonly Recommendation[] = featuredAuthors
  .map((author) => recommendations.find((recommendation) => recommendation.author === author))
  .filter((recommendation): recommendation is Recommendation => Boolean(recommendation));

/** "2 June 2025" — rendered on the server, so the format is fixed. */
export function formatRecommendationDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
