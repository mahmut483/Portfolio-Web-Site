// Deterministic CV text checks. In the editor they are warnings on the owner's own text; in later
// phases the same rules block AI suggestions (code, not prompts, is the guarantee against fluff).
//
// Sources for the lists: CareerBuilder/Harris 2014 survey of disliked resume terms, LinkedIn's
// overused-buzzword lists, Jobscan's negative keywords, Harvard career services ("no pronouns,
// specific not general, not flowery") and Kobak et al. 2025 (vocabulary that spiked with LLM use).

export type LintCode =
  | "buzzword"
  | "ai_vocabulary"
  | "duty_phrase"
  | "intensifier"
  | "first_person"
  | "dash"
  | "too_long"
  | "adverbs"
  | "exclamation";

export type LintIssue = {
  code: LintCode;
  message: string; // Turkish, shown in the admin UI
  match?: string;
};

// Empty self-descriptions: they describe the writer without evidence
const BUZZWORDS = [
  "results-driven", "results-oriented", "detail-oriented", "self-starter", "self-motivated",
  "highly motivated", "go-getter", "team player", "hard-working", "hardworking", "passionate",
  "enthusiastic", "dedicated", "proactive", "think outside the box", "out-of-the-box",
  "best of breed", "proven track record", "track record of", "strong work ethic", "fast learner",
  "quick learner", "excellent communication skills", "people person", "go-to person", "rockstar",
  "ninja", "guru", "wizard", "visionary", "seasoned", "extensive experience",
];

// Words that became far more frequent with LLM-written text; recruiters read them as AI-written
const AI_VOCABULARY = [
  "delve", "delves", "delved", "tapestry", "testament", "showcase", "showcased", "showcasing",
  "underscore", "underscores", "pivotal", "meticulous", "meticulously", "intricate", "realm",
  "embark", "embarked", "journey", "foster", "fostered", "fostering", "harness", "harnessed",
  "seamless", "seamlessly", "cutting-edge", "state-of-the-art", "innovative", "revolutionize",
  "revolutionized", "transformative", "unlock", "unlocked", "elevate", "elevated", "empower",
  "empowered", "spearhead", "spearheaded", "multifaceted", "holistic", "synergy", "synergies",
  "paradigm", "ever-evolving", "fast-paced", "in today's", "a wide range of", "myriad", "plethora",
  "comprehensive", "crucial", "vital", "notably", "moreover", "furthermore", "additionally",
  "leverage", "leveraged", "leveraging", "utilize", "utilized", "utilizing", "robust",
];

// Describes duties instead of what was done
const DUTY_PHRASES = ["responsible for", "duties included", "tasked with", "various tasks"];

// Claims of size without a number behind them
const INTENSIFIERS = [
  "significantly", "dramatically", "greatly", "substantially", "massively", "extremely",
  "incredibly", "vastly", "best-in-class", "world-class", "industry-leading", "top-notch",
  "unparalleled", "unprecedented", "successfully", "effectively", "efficiently",
];

// Game/tech terms that contain a listed word but are legitimate
const ALLOWLIST = [
  "dynamic batching", "dynamic difficulty", "dynamic lighting", "robust networking",
  "dedicated server", "dedicated servers", "player journey", "user journey", "unlock system",
  "unlock flow", "unlocks", "level unlock",
];

// Sentence-case pronouns too ("We built..."), but not "I/O" or the all-caps "US"
const FIRST_PERSON = /\b(I(?![/.-]\w)|[Mm]e|[Mm]y|[Mm]ine|[Ww]e|[Oo]ur|[Oo]urs|[Uu]s)\b/;
// -ly words that are not adverbs (or are harmless ones)
const LY_ADVERB_OK = new Set([
  "daily", "weekly", "monthly", "yearly", "only", "early", "family", "apply", "supply", "reply",
  "fly", "friendly", "costly", "likely", "lovely", "lonely", "holy", "jelly", "belly", "rally",
  "ally", "italy", "assembly", "poly", "curly", "silly", "ugly", "july", "anomaly", "butterfly",
]);

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findPhrase(text: string, phrases: string[]): string | undefined {
  const lower = text.toLowerCase();
  for (const phrase of phrases) {
    const re = new RegExp(`(^|[^a-z])${escape(phrase)}([^a-z]|$)`, "i");
    if (re.test(lower) && !ALLOWLIST.some((ok) => ok.includes(phrase) && lower.includes(ok))) {
      return phrase;
    }
  }
  return undefined;
}

export type LintOptions = { maxChars?: number };

export function lintText(text: string, opts: LintOptions = {}): LintIssue[] {
  const issues: LintIssue[] = [];
  const t = text.trim();
  if (!t) return issues;

  const buzz = findPhrase(t, BUZZWORDS);
  if (buzz) issues.push({ code: "buzzword", match: buzz, message: `"${buzz}" kanıtsız bir övgü; yerine ne yaptığını yaz.` });

  const ai = findPhrase(t, AI_VOCABULARY);
  if (ai) issues.push({ code: "ai_vocabulary", match: ai, message: `"${ai}" yapay zekâ metni gibi okunuyor; daha sade bir kelime kullan.` });

  const duty = findPhrase(t, DUTY_PHRASES);
  if (duty) issues.push({ code: "duty_phrase", match: duty, message: `"${duty}" görevi anlatıyor; bir eylem fiiliyle başla (Built, Created, Edited...).` });

  const intensifier = findPhrase(t, INTENSIFIERS);
  if (intensifier) issues.push({ code: "intensifier", match: intensifier, message: `"${intensifier}" arkasında bir sayı yoksa abartı gibi duruyor.` });

  const fp = t.match(FIRST_PERSON);
  if (fp) issues.push({ code: "first_person", match: fp[0], message: `CV'de birinci şahıs ("${fp[0]}") kullanılmaz.` });

  if (/[—―]/.test(t) || /\s[‒–-]\s/.test(t)) {
    issues.push({ code: "dash", message: "Uzun tire ya da boşluklu tire cümle bağlamak için kullanılmış; virgül ya da nokta kullan." });
  }

  if (t.includes("!")) issues.push({ code: "exclamation", message: "CV'de ünlem işareti kullanılmaz." });

  const max = opts.maxChars ?? 200;
  if (t.length > max) issues.push({ code: "too_long", message: `${t.length} karakter; ${max} karakterin altında tut.` });

  // Standalone -ly words; compounds ("low-poly", "user-friendly") and known non-adverbs ("July") skipped
  const adverbs = (t.match(/(?<![\w-])[A-Za-z][a-z]*ly(?![\w-])/g) ?? []).filter(
    (w) => !LY_ADVERB_OK.has(w.toLowerCase()),
  );
  if (adverbs.length > 1) issues.push({ code: "adverbs", match: adverbs.join(", "), message: `Fazla zarf (${adverbs.join(", ")}); en fazla bir tane.` });

  return issues;
}
