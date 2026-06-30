import type { ExperienceBank, CVDocument, CoverLetter } from "./types";

// Phase 1: no AI. We deterministically resolve the bank into a concrete
// one-page CV (and a sample cover letter) purely to prove the format and the
// one-page auto-fit. Phase 2's tailoring engine will replace this with a
// JD-driven selection that returns the same `CVDocument` / `CoverLetter` shapes.

export function composeDefaultCV(bank: ExperienceBank): CVDocument {
  const summary = bank.summaryTemplates[0]?.text ?? "";
  return {
    header: bank.header,
    summary,
    roles: bank.roles.map((r) => ({
      company: r.company,
      title: r.title,
      location: r.location,
      dates: r.dates,
      bullets: r.bullets.map((b) => b.text),
    })),
    skills: bank.skills.map((s) => ({ group: s.group, items: s.items })),
    sideProjects: bank.sideProjects.map((p) => ({ name: p.name, description: p.description })),
    education: bank.education,
  };
}

export function composeSampleCover(bank: ExperienceBank): CoverLetter {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return {
    header: bank.header,
    date: today,
    recipient: "Hiring Manager",
    companyName: "[Company]",
    roleTitle: "[Role — sample cover letter]",
    greeting: "Dear Hiring Manager,",
    paragraphs: [
      "I am writing to express my interest in the Product Manager role on your growth team. Over the last four years I have driven user acquisition, lifecycle engagement, and monetization for fintech, marketplace, and consumer apps operating at 100M+ user scale — and I am drawn to the chance to do the same for your product.",
      "At TruDoc I own growth and revenue across four verticals serving 1.5M UAE users, where I grew revenue 15% QoQ and lifted retention to 30% (vs a 12% industry average) by pairing rigorous cohort analysis with AI-led lifecycle features. Earlier, at WinZO, I owned the growth roadmap for a 100M+ user, $150M GMV platform, running 100+ A/B tests that lifted signups 20% and payment success 30% across Brazil and India.",
      "What consistently sets my work apart is a metrics-first, experiment-driven approach combined with the ability to ship — including building AI agents that now handle the majority of certain user journeys autonomously. I would bring that same bias for measurable impact to your team.",
      "I would welcome the chance to discuss how my background maps to your goals. Thank you for your time and consideration.",
    ],
    signoff: "Sincerely,",
    signatureName: bank.header.name,
  };
}
