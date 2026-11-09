import { notFound } from "next/navigation";

import {
  button,
  detailRows,
  paragraphs,
  renderEmail,
} from "@/lib/email/template";

/** Dev-only: renders the email shell for a visual check. */
export default function EmailPreview() {
  if (process.env.NODE_ENV === "production") notFound();


  const html = renderEmail({
    preheader: "New enquiry",
    title: "Adaeze would like to talk",
    body: `
      ${detailRows([
        ["Name", "Adaeze Nwosu"],
        ["Email", "adaeze@example.com"],
        ["Phone", "+234 801 234 5678"],
        ["Enquiry type", "Coaching"],
        ["Pathway", "One-to-one coaching"],
        ["Came via", "contact-form"],
      ])}
      <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#710b49;">Message</p>
      ${paragraphs(
        "Good morning Adesua,\n\nI lead a customer success team of fourteen and we are heading into a restructure. I would like support holding the team steady through it, and coaching for myself as I step into a bigger role.\n\nWould you have space for a conversation this month?",
      )}
      ${button("https://adesua.com/admin/enquiries", "Open in the studio")}
    `,
    footnote:
      "Reply directly to this email to answer Adaeze. Everything here is held in confidence.",
  });

  return (
    <iframe
      title="Email preview"
      srcDoc={html}
      style={{ width: "100%", minHeight: "1400px", border: 0, background: "#f2f1ef" }}
    />
  );
}
