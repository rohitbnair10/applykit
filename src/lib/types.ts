// ---------------------------------------------------------------------------
// ApplyKit data model
//
// The "experience bank" is the single source of truth about Rohit. It holds
// MORE content than fits on one page (e.g. a pool of bullet variants per role);
// the tailoring engine (Phase 2) selects/reframes a subset. The document
// generator (Phase 1) consumes a *resolved* `CVDocument` / `CoverLetter`, i.e.
// the concrete one-page selection.
// ---------------------------------------------------------------------------

export interface Header {
  name: string;
  location: string; // e.g. "Dubai, UAE"
  visaNote?: string; // e.g. "Valid Work Visa"
  phone: string;
  email: string;
  linkedinLabel: string; // display text, e.g. "linkedin.com/in/rohit-nair-5a92ab162"
  linkedinUrl: string; // full href
}

export interface BulletVariant {
  id: string;
  text: string;
  // Optional tags so the engine can prefer variants for certain JD framings,
  // e.g. ["ai", "builder"] or ["growth"]. Free-form.
  tags?: string[];
}

export interface Role {
  id: string;
  company: string;
  title: string;
  location: string;
  dates: string; // e.g. "Aug 2025 – Present"
  // A pool of bullet variants — more than fit on one page on purpose.
  bullets: BulletVariant[];
}

export type SkillGroupName = "Growth" | "Analytics & Tools" | "Strengths" | "AI";

export interface SkillGroup {
  group: SkillGroupName;
  items: string[];
}

export interface SideProject {
  id: string;
  name: string;
  description: string;
}

export interface Education {
  institution: string;
  degree: string;
  detail?: string; // minor, CGPA, honors
  dates: string;
}

export interface SummaryTemplate {
  id: string;
  label: string; // human label so I can pick in the UI
  text: string;
}

export interface ExperienceBank {
  header: Header;
  summaryTemplates: SummaryTemplate[];
  roles: Role[];
  skills: SkillGroup[];
  sideProjects: SideProject[];
  education: Education[];
}

// ---------------------------------------------------------------------------
// Resolved documents — what the generator actually renders.
// ---------------------------------------------------------------------------

export interface CVRole {
  company: string;
  title: string;
  location: string;
  dates: string;
  bullets: string[]; // already-selected, final text
}

export interface CVSkillGroup {
  group: string;
  items: string[];
}

export interface CVDocument {
  header: Header;
  summary: string;
  roles: CVRole[];
  skills: CVSkillGroup[];
  sideProjects: { name: string; description: string }[];
  education: Education[];
}

export interface CoverLetter {
  header: Header;
  date: string; // e.g. "30 June 2026"
  recipient?: string; // e.g. "Hiring Manager, Acme"
  companyName?: string;
  roleTitle?: string;
  // The body as discrete paragraphs (greeting handled separately).
  greeting: string; // e.g. "Dear Hiring Manager,"
  paragraphs: string[];
  signoff: string; // e.g. "Sincerely,"
  signatureName: string;
}

// ---------------------------------------------------------------------------
// Phase 2 — tailoring engine output.
// ---------------------------------------------------------------------------

// The critical "recruiter's-eye" assessment the model returns alongside docs.
export interface RecruiterNote {
  summary: string; // 1-2 sentence verdict on shortlist-fit
  gaps: string[]; // missing skills/experience the JD asks for
  framingMismatches: string[]; // where my framing doesn't mirror the JD
  seniorityFlags: string[]; // e.g. "JD wants 8-10 yrs; I have 4+"
}

// The raw structured JSON we ask the model to return. Header, side projects,
// and education are taken from the bank, not the model.
export interface TailorModelOutput {
  summary: string;
  cvRoles: {
    company: string;
    title: string;
    location: string;
    dates: string;
    bullets: string[];
  }[];
  skills: { group: string; items: string[] }[];
  coverLetter: {
    greeting: string;
    paragraphs: string[];
    signoff: string;
  };
  recruiterNote: RecruiterNote;
}

// What the tailor endpoint returns to the client and stores in history.
export interface TailorResult {
  cv: CVDocument;
  cover: CoverLetter;
  recruiterNote: RecruiterNote;
  model: "sonnet" | "opus";
  usage: { inputTokens: number; outputTokens: number };
  costUSD: number;
  costAED: number;
}
