import type { ExperienceBank } from "./types";

// Seeded from Rohit's current CV. This is the starting state of the bank;
// it can be edited in the UI and persisted to storage. Bullet pools
// intentionally hold more than fit on one page.
export const SEED_BANK: ExperienceBank = {
  header: {
    name: "ROHIT NAIR",
    location: "Dubai, UAE",
    visaNote: "Valid Work Visa",
    phone: "+971 551854500",
    email: "rohitbnair10@gmail.com",
    linkedinLabel: "linkedin.com/in/rohit-nair-5a92ab162",
    linkedinUrl: "https://linkedin.com/in/rohit-nair-5a92ab162",
  },
  summaryTemplates: [
    {
      id: "sum-growth",
      label: "Growth (default)",
      text: "Growth-focused Product Manager with 4+ years driving user acquisition, lifecycle engagement, and monetization for fintech, marketplace, and consumer apps at 100M+ user scale. IIT Kharagpur graduate.",
    },
    {
      id: "sum-monetization",
      label: "Monetization-leaning",
      text: "Product Manager with 4+ years owning monetization and revenue growth — subscriptions, wallet/payments, and ARPU/LTV — across fintech and consumer apps at 100M+ user scale. IIT Kharagpur graduate.",
    },
    {
      id: "sum-ai",
      label: "AI/builder-leaning",
      text: "Product Manager and builder with 4+ years shipping AI-led growth features — predictive workflows, autonomous agents, and lifecycle automation — for consumer and fintech apps at 100M+ user scale. IIT Kharagpur graduate.",
    },
  ],
  roles: [
    {
      id: "role-trudoc",
      company: "TruDoc Healthcare",
      title: "Product Manager – Growth & Monetization",
      location: "Dubai",
      dates: "Aug 2025 – Present",
      bullets: [
        {
          id: "trudoc-1",
          text: "Own growth & revenue across 4 verticals serving 1.5M mass-market UAE users; grew revenue 15% QoQ via engagement campaigns, wallet/payment optimization, and AI-led features.",
          tags: ["growth", "monetization"],
        },
        {
          id: "trudoc-2",
          text: "Ran lifecycle & reactivation off 50+ user interviews and cohort analysis; built an AI refill-prediction workflow + re-engagement flows that lifted retention to 30% (vs 12% industry avg).",
          tags: ["growth", "ai", "lifecycle"],
        },
        {
          id: "trudoc-3",
          text: "Launched a subscription monetization model (Sulinda Wellness, KSA expansion) end-to-end across product, ops, finance in 3 months; now AED 50k/month new ARPU.",
          tags: ["monetization"],
        },
        {
          id: "trudoc-4",
          text: "Instrumented CleverTap event tracking and push-notification campaigns for activation, engagement, reactivation.",
          tags: ["analytics", "lifecycle"],
        },
        {
          id: "trudoc-5",
          text: "Built a WhatsApp Chronic Refill Agent handling 50%+ of bookings autonomously, plus a Slack health-concierge agent deployed in a major UAE tech company.",
          tags: ["ai", "builder"],
        },
      ],
    },
    {
      id: "role-winzo",
      company: "WinZO Games",
      title: "Product Manager – Strategy & Growth",
      location: "India",
      dates: "Mar 2024 – Jul 2025",
      bullets: [
        {
          id: "winzo-1",
          text: "Owned growth roadmap for a 100M+ user, $150M GMV platform across Brazil and India; ran 100+ A/B tests lifting signups 20% (5M→6M monthly), payment success 30%, retention 25%.",
          tags: ["growth", "experimentation"],
        },
        {
          id: "winzo-2",
          text: "Drove acquisition & reactivation for global markets — top 3 pain points from 2,000+ reviews (RICE), secured eng via C-suite pitch, moved store rating 4.1→4.4, drove 80% of overseas traffic.",
          tags: ["growth", "acquisition"],
        },
      ],
    },
    {
      id: "role-cars24",
      company: "CARS24",
      title: "Associate Product Manager",
      location: "India",
      dates: "Jan 2022 – Mar 2024",
      bullets: [
        {
          id: "cars24-1",
          text: "Launched a 0→1 two-sided marketplace; 30+ interviews, found activation bottleneck, redesigned onboarding 10%→50% activation, scaled to 1,000 trips/month at 4.7/5 CSAT.",
          tags: ["marketplace", "0to1", "activation"],
        },
        {
          id: "cars24-2",
          text: "Built payments & allocation systems balancing supply/demand — 87% acceptance, 50% productivity uplift, checkout 95%→98%, 20% traffic growth via CRM integrations.",
          tags: ["payments", "marketplace"],
        },
      ],
    },
  ],
  skills: [
    {
      group: "Growth",
      items: [
        "User Acquisition",
        "Reactivation",
        "Lifecycle/CRM Campaigns",
        "ARPU & LTV Growth",
        "Churn Reduction",
        "A/B Testing",
      ],
    },
    {
      group: "Analytics & Tools",
      items: [
        "Cohort Analysis",
        "Funnel Optimization",
        "SQL",
        "Excel",
        "PowerPoint",
        "CleverTap",
        "Figma",
        "Jira",
        "RICE/WSJF",
      ],
    },
    {
      group: "Strengths",
      items: [
        "Cross-functional Leadership",
        "Stakeholder Management",
        "Executive Communication",
        "GCC Fintech Market Knowledge",
      ],
    },
    {
      group: "AI",
      items: [
        "AI Agents (WhatsApp/Slack)",
        "Predictive Workflows",
        "Prompt Engineering",
        "AI Product Strategy",
      ],
    },
  ],
  sideProjects: [
    {
      id: "proj-prompttune",
      name: "PromptTune",
      description:
        "React/Next.js AI prompt-optimization tool with guardrails; 1,000+ users.",
    },
    {
      id: "proj-matchiq",
      name: "MatchIQ",
      description:
        "Chrome extension layering AI property recommendations onto Property Finder; 30+ organic installs in 2 days.",
    },
  ],
  education: [
    {
      institution: "IIT Kharagpur",
      degree: "Dual Degree (B.Tech + M.Tech), Mining Engineering",
      detail: "Minor: Economics | CGPA 8.33/10 (Top 5%)",
      dates: "Aug 2017 – Apr 2022",
    },
  ],
};
