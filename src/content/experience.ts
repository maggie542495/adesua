/**
 * Professional history, education and certifications.
 *
 * Every role, date, figure and bullet below is transcribed from Adesua's own
 * LinkedIn profile export. Nothing is paraphrased into a claim she did not
 * make, and no metric is rounded or estimated — if the profile changes, copy
 * it again from the source rather than editing from memory.
 *
 * Source: https://www.linkedin.com/in/adesua-margaret-oriaifo-423633182
 */

export interface Role {
  title: string;
  company: string;
  /** Human-readable period, exactly as the profile states it. */
  period: string;
  location: string;
  /** One-line framing of the remit. */
  summary: string;
  highlights: readonly string[];
  /** Optional award or recognition attached to the role. */
  recognition?: string;
}

export interface Employer {
  company: string;
  /** Total tenure at the employer, as the profile states it. */
  tenure: string;
  roles: readonly Role[];
}

export const experience: readonly Employer[] = [
  {
    company: "Sterling Bank",
    tenure: "July 2023 — Present",
    roles: [
      {
        title: "Head, Customer Success",
        company: "Sterling Bank",
        period: "July 2023 — Present",
        location: "Nigeria",
        summary:
          "Leads customer success for the corporate segment — process documentation, journey design and the operating rhythm of the support team.",
        highlights: [
          "Created documentation for all key processes for internal alignment and strengthened team effectiveness; led customer engagements based on data insights that produced a 6% increase in revenue.",
          "Designed and implemented a defined customer journey for corporate customers, plus an engagement framework addressing gaps around inactive, dormant and unfunded accounts.",
          "Implemented systems to improve the productivity and capacity of the customer support team across the corporate customer lifecycle, and proactively deployed a 24/7 email team that improved turnaround on complaints and enquiries.",
          "Ran regular communication training for customer-facing staff and developed pre-approved messaging templates for notifications and holding responses.",
          "Introduced monthly one-to-one check-ins and performance reviews, and set minimum daily and monthly targets that materially improved team productivity.",
        ],
        recognition: "Awarded “Most Improved Team”, 2023",
      },
    ],
  },
  {
    company: "Access Bank Plc",
    tenure: "6 years 10 months",
    roles: [
      {
        title: "Customer Journey Manager, Corporate Banking",
        company: "Access Bank Plc",
        period: "August 2020 — July 2023",
        location: "Lagos State, Nigeria",
        summary:
          "Owned the end-to-end corporate customer journey, working across functions to design and implement solutions that improved experience, loyalty and retention.",
        highlights: [
          "Delivered a 33% improvement in customer satisfaction, exceeding the 85% CSAT target on the corporate banking platform — from 53% in December 2020, to 83% in December 2021, to 86% in June 2022.",
          "Championed the customer feedback channel and redesigned the payment processing flow, improving issue resolution time by 55% and lifting the Customer Effort score from 79% in December 2021 to 83% in June 2022.",
          "Tracked customer experience metrics and implemented solutions that improved Net Promoter Score by 28 points — from 9 in June 2021, to 28 in December 2021, to 37 in June 2022.",
          "Facilitated customer service and relationship management training for the Sales and Marketing teams.",
        ],
      },
      {
        title: "Customer Experience Analyst, Total Quality Management",
        company: "Access Bank Plc",
        period: "September 2018 — August 2020",
        location: "Lagos, Nigeria",
        summary:
          "Turned voice-of-customer research and service quality assessment into process improvements across the corporate segment.",
        highlights: [
          "Conducted voice-of-customer satisfaction surveys, service quality assessments and user experience reviews that identified pain points and led to significant process improvements.",
          "Championed initiatives that improved the bank's corporate segment ranking in the annual KPMG Banking Industry Customer Experience Survey — from 9th in 2018 to 5th in 2019.",
          "Supervised the launch of the monthly Corporate Customer Newsletter, providing proactive communication on products, services, market trends and policy updates.",
          "Planned and executed the maiden virtual Corporate Customer Forum, addressing key pain points during the initial COVID-19 lockdown.",
          "Developed a Rates Guide covering all bank charges, resolving recurring complaints about unclear charges.",
        ],
      },
      {
        title: "Customer Support and Operations Officer",
        company: "Access Bank Plc",
        period: "October 2016 — September 2018",
        location: "Nigeria",
        summary:
          "Frontline service delivery and branch operations, with a focus on first-contact resolution and staff capability.",
        highlights: [
          "Ensured first-contact resolution across requests, enquiries and complaints — resolving a minimum of 120 customer tickets daily within SLA.",
          "Compiled team and customer reports and balanced all general ledgers daily, contributing to a “Satisfactory” rating in the biannual bank-wide audit.",
          "Identified patterns in user frustration and ran weekly staff training on those areas, leading to the branch being recognised as outstanding in the region.",
          "Onboarded customers onto the mobile application, driving a 70% increase in sign-up rate.",
        ],
      },
    ],
  },
];

export interface Education {
  institution: string;
  qualification: string;
  period: string;
}

export const education: readonly Education[] = [
  {
    institution: "University of the People",
    qualification: "Master of Business Administration (MBA)",
    period: "2019 — 2021",
  },
  {
    institution: "Access Bank School of Banking Excellence",
    qualification: "Banking Excellence Programme",
    period: "2018 — 2019",
  },
  {
    institution: "Obafemi Awolowo University",
    qualification: "Bachelor's degree, Microbiology",
    period: "2010 — 2015",
  },
];

export const certifications: readonly string[] = [
  "Customer Experience Specialist (CXS)",
  "ACIB",
  "Coaching Masteries Practitioner",
  "Product Management",
  "Certified Contact Center Manager (CCCM)®",
];

export const languages: readonly { language: string; level: string }[] = [
  { language: "English", level: "Native or bilingual" },
  { language: "French", level: "Elementary" },
];

export const topSkills: readonly string[] = [
  "Strategy Implementation",
  "Presentations",
  "Key Metrics",
];
