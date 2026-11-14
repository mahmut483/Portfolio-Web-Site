import { z } from "zod";

// Shared by the admin client components and the server (Server Actions validate every input with
// these). No personal data lives in this file; the content itself is stored in Firestore.

const id = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/);
const text = (max: number) => z.string().trim().max(max);
// "YYYY-MM", or just "YYYY" when the month isn't known (never invent a month)
export const yearMonth = z.string().regex(/^\d{4}(-(0[1-9]|1[0-2]))?$/, "Tarih YYYY-AA ya da YYYY biçiminde olmalı");

// ── Master CV ────────────────────────────────────────────────────────────────

export const bulletSchema = z.object({
  id,
  text: text(400),
  // Fact bank entries this bullet is based on (used by the AI rules in later phases)
  factIds: z.array(id).max(10),
});

// Links in the CV/PDF must be absolute http(s) URLs: a scheme-less "linkedin.com/in/x" would
// become a relative link into this site. Missing schemes get https:// added; anything else fails.
export const httpUrl = (max: number) =>
  text(max)
    .transform((v) => (v && !/^[a-z][a-z0-9+.-]*:/i.test(v) ? `https://${v}` : v))
    .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "Bağlantı http:// ya da https:// ile başlamalı");

export const linkSchema = z.object({ label: text(40), url: httpUrl(200) });

export const profileSchema = z.object({
  name: text(80),
  headline: text(120),
  location: text(80),
  email: text(120),
  phone: text(40),
  links: z.array(linkSchema).max(6),
});

export const experienceSchema = z.object({
  id,
  title: text(100),
  company: text(100),
  location: text(80),
  start: yearMonth,
  end: yearMonth.nullable(), // null = present
  bullets: z.array(bulletSchema).max(12),
});

export const projectSchema = z.object({
  id,
  name: text(100),
  context: text(120), // e.g. "Personal project", "Case study for Brew Games"
  start: yearMonth.nullable(),
  end: yearMonth.nullable(),
  link: httpUrl(200),
  bullets: z.array(bulletSchema).max(10),
});

export const skillGroupSchema = z.object({
  id,
  label: text(60),
  items: z.array(text(60)).max(40),
});

export const educationSchema = z.object({
  id,
  school: text(120),
  degree: text(120),
  start: yearMonth.nullable(),
  end: yearMonth.nullable(),
  details: text(160), // e.g. "GPA: 3.46 / 4.00"
});

export const languageSchema = z.object({ id, name: text(40), level: text(60) });

export const cvContentSchema = z.object({
  profile: profileSchema,
  summary: text(1200),
  experience: z.array(experienceSchema).max(15),
  projects: z.array(projectSchema).max(15),
  skills: z.array(skillGroupSchema).max(10),
  education: z.array(educationSchema).max(6),
  languages: z.array(languageSchema).max(8),
});

export type Bullet = z.infer<typeof bulletSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Project = z.infer<typeof projectSchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Language = z.infer<typeof languageSchema>;
export type CvContent = z.infer<typeof cvContentSchema>;

export type MasterCv = { content: CvContent; updatedAt: string };

// ── Fact bank ────────────────────────────────────────────────────────────────

// How much of the work was his. The AI may only use strong verbs (led, owned...) for solo/lead.
export const OWNERSHIP = ["solo", "lead", "core", "contributor", "assisted"] as const;
export const OWNERSHIP_LABEL: Record<(typeof OWNERSHIP)[number], string> = {
  solo: "Tek başıma",
  lead: "Liderlik ettim",
  core: "Ekibin asıl üyesi",
  contributor: "Katkıda bulundum",
  assisted: "Yardımcı oldum",
};

// What state the work reached. Scope words (prototype, jam...) must never be dropped by the AI.
export const FACT_STATUS = [
  "shipped",
  "live",
  "prototype",
  "jam",
  "coursework",
  "employment",
  "internship",
  "freelance",
  "case_study",
  "personal",
  "other",
] as const;
export const FACT_STATUS_LABEL: Record<(typeof FACT_STATUS)[number], string> = {
  shipped: "Yayınlandı",
  live: "Canlıda",
  prototype: "Prototip",
  jam: "Game jam",
  coursework: "Okul projesi",
  employment: "İş",
  internship: "Staj",
  freelance: "Serbest iş",
  case_study: "Case çalışması",
  personal: "Kişisel proje",
  other: "Diğer",
};

export const FACT_KIND = ["role", "project", "education", "skill", "achievement", "other"] as const;
export const FACT_KIND_LABEL: Record<(typeof FACT_KIND)[number], string> = {
  role: "İş / staj",
  project: "Proje",
  education: "Eğitim",
  skill: "Beceri",
  achievement: "Başarı",
  other: "Diğer",
};

export const metricSchema = z.object({
  value: text(20), // "12", "1.2M"
  unit: text(20), // "%", "installs"
  label: text(80), // "CTR on Meta ads"
  source: text(120), // where the number can be checked
});

export const factInputSchema = z.object({
  // One claim, in his own words, in English. This is the only text the AI may build on.
  statement: z.string().trim().min(10, "En az 10 karakter").max(400),
  kind: z.enum(FACT_KIND),
  context: text(120), // employer or project name
  start: yearMonth.nullable(),
  end: yearMonth.nullable(),
  ownership: z.enum(OWNERSHIP).nullable(),
  status: z.enum(FACT_STATUS).nullable(),
  tools: z.array(text(60)).max(20),
  metrics: z.array(metricSchema).max(5),
  qualifiers: z.array(text(40)).max(10), // "AI-assisted", "illustrations not mine"...
  evidenceUrl: httpUrl(300),
});

export type FactInput = z.infer<typeof factInputSchema>;
export type Fact = FactInput & {
  id: string;
  confirmed: boolean;
  confirmedAt: string | null;
  origin: "cv" | "site" | "manual";
  sourceText: string; // the original line it was drafted from
  createdAt: string;
  updatedAt: string;
};

// "Bende yok": things he does not have. The AI is blocked from ever claiming these.
export const absenceInputSchema = z.object({
  text: z.string().trim().min(1).max(120),
  note: text(200),
});
export type Absence = z.infer<typeof absenceInputSchema> & { id: string; createdAt: string };

// ── Skill dictionary ─────────────────────────────────────────────────────────

export const SKILL_CATEGORY = ["hard", "tool", "domain", "soft", "language"] as const;
export const SKILL_CATEGORY_LABEL: Record<(typeof SKILL_CATEGORY)[number], string> = {
  hard: "Teknik beceri",
  tool: "Araç",
  domain: "Alan bilgisi",
  soft: "Kişisel beceri",
  language: "Dil",
};
export const PROFICIENCY = ["basic", "working", "strong"] as const;
export const PROFICIENCY_LABEL: Record<(typeof PROFICIENCY)[number], string> = {
  basic: "Temel",
  working: "İş görür",
  strong: "Güçlü",
};

export const skillInputSchema = z.object({
  name: z.string().trim().min(1).max(60), // spelling used on the CV, e.g. "PixiJS"
  aliases: z.array(text(60)).max(20), // other spellings job posts use, e.g. "Pixi.js", "pixi"
  category: z.enum(SKILL_CATEGORY),
  proficiency: z.enum(PROFICIENCY).nullable(),
});
export type SkillInput = z.infer<typeof skillInputSchema>;
export type Skill = SkillInput & { id: string; updatedAt: string };

export type ActionResult = { ok: true } | { ok: false; error: string };
