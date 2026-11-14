"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { buttonPrimary, buttonSecondary } from "@/app/lib/ui";
import CvDocument from "../../_lib/CvDocument";
import { isEndBeforeStart } from "../../_lib/format";
import { cvContentSchema, type ActionResult, type CvContent } from "../../_lib/schema";
import { saveMasterCvAction } from "./actions";
import type { FactOption } from "./Fields";
import {
  EducationSection,
  ExperienceSection,
  LanguagesSection,
  ProfileSection,
  ProjectsSection,
  SkillsSection,
  SummarySection,
} from "./Sections";

const EMPTY_CV: CvContent = {
  profile: { name: "", headline: "", location: "", email: "", phone: "", links: [] },
  summary: "",
  experience: [],
  projects: [],
  skills: [],
  education: [],
  languages: [],
};

// Same rule as schema.yearMonth: YYYY-MM, or YYYY when the month isn't known
const YEAR_MONTH = /^\d{4}(-(0[1-9]|1[0-2]))?$/;

// Friendly checks for what the form itself can get wrong (dates, the comma-separated skills).
// Everything is validated again by the Server Action with cvContentSchema.
function findProblem(cv: CvContent): string | null {
  for (let i = 0; i < cv.experience.length; i++) {
    const e = cv.experience[i];
    const where = `Deneyim ${i + 1}${e.title ? ` (${e.title})` : ""}`;
    if (!YEAR_MONTH.test(e.start)) return `${where}: başlangıç tarihini gir.`;
    if (e.end !== null && !YEAR_MONTH.test(e.end)) {
      return `${where}: bitiş tarihini gir ya da "Devam ediyor" kutusunu işaretle.`;
    }
    if (e.end !== null && isEndBeforeStart(e.start, e.end)) return `${where}: bitiş tarihi başlangıçtan önce olamaz.`;
  }
  const ranged = [
    ...cv.projects.map((p, i) => ({ where: `Proje ${i + 1}`, start: p.start, end: p.end })),
    ...cv.education.map((ed, i) => ({ where: `Eğitim ${i + 1}`, start: ed.start, end: ed.end })),
  ];
  for (const { where, start, end } of ranged) {
    if ((start && !YEAR_MONTH.test(start)) || (end && !YEAR_MONTH.test(end))) {
      return `${where}: tarih YYYY-AA ya da YYYY biçiminde olmalı.`;
    }
    if (start && end && isEndBeforeStart(start, end)) return `${where}: bitiş tarihi başlangıçtan önce olamaz.`;
  }
  const urls = [
    ...cv.profile.links.map((l, i) => ({ where: `Profil bağlantısı ${i + 1}`, url: l.url })),
    ...cv.projects.map((p, i) => ({ where: `Proje ${i + 1} bağlantısı`, url: p.link })),
  ];
  for (const { where, url } of urls) {
    // Scheme-less "linkedin.com/in/x" gets https:// on save; other schemes are refused
    if (url && /^[a-z][a-z0-9+.-]*:/i.test(url) && !/^https?:\/\/\S+$/i.test(url)) {
      return `${where}: http:// ya da https:// ile başlamalı.`;
    }
  }
  for (const group of cv.skills) {
    const name = group.label || "adsız grup";
    if (group.items.length > 40) return `Beceriler (${name}): en fazla 40 öğe olabilir.`;
    const long = group.items.find((item) => item.length > 60);
    if (long) return `Beceriler (${name}): "${long.slice(0, 30)}…" 60 karakterden uzun.`;
  }
  return null;
}

// Client-only rendering without an effect: the server snapshot is false, the client's true.
const noopSubscribe = () => () => {};

function SavedTime({ iso }: { iso: string }) {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  let text = iso; // the server shows the raw ISO; the browser shows its own local time
  if (isClient) {
    const date = new Date(iso);
    if (!Number.isNaN(date.getTime())) {
      text = date.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
    }
  }
  return <time dateTime={iso}>{text}</time>;
}

// Unsaved drafts are mirrored into sessionStorage (this tab only), so an expired session, a reload
// or a page that Next dropped from its keep-alive cache doesn't lose them. A draft is only offered
// back when it was based on the CV version that's loaded now.
const DRAFT_KEY = "admin-cv-draft";

function readDraftRaw(): string | null {
  try {
    return window.sessionStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
}

function writeDraft(base: string, draft: string | null) {
  try {
    if (draft === null) window.sessionStorage.removeItem(DRAFT_KEY);
    else window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ base, draft }));
  } catch {
    // storage unavailable (private mode, quota): the draft just isn't backed up
  }
}

function parseDraft(raw: string | null): { base: string; draft: CvContent; draftJson: string } | null {
  if (!raw) return null;
  try {
    const { base, draft } = JSON.parse(raw) as { base: string; draft: string };
    const parsed = cvContentSchema.safeParse(JSON.parse(draft));
    return parsed.success ? { base, draft: parsed.data, draftJson: draft } : null;
  } catch {
    return null;
  }
}

// Same normalisation the server applies, so the editor state matches what gets stored
function withHttps(url: string) {
  const u = url.trim();
  return u && !/^[a-z][a-z0-9+.-]*:/i.test(u) ? `https://${u}` : u;
}

function isRedirectError(err: unknown): boolean {
  const digest = (err as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

export default function CvEditor({
  initial,
  updatedAt,
  facts,
}: {
  initial: CvContent | null;
  updatedAt: string | null;
  facts: FactOption[];
}) {
  const [cv, setCv] = useState<CvContent>(() => initial ?? EMPTY_CV);
  // What the server last accepted, as JSON. Different from the current state = unsaved changes.
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initial ?? EMPTY_CV));
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const currentJson = useMemo(() => JSON.stringify(cv), [cv]);
  const dirty = currentJson !== savedJson;

  // The preview may lag a frame behind typing; the form stays responsive.
  const deferredCv = useDeferredValue(cv);
  const preview = useMemo(() => <CvDocument cv={deferredCv} />, [deferredCv]);

  // Back up the draft while there are unsaved changes; clear it once everything is saved
  useEffect(() => {
    writeDraft(savedJson, dirty ? currentJson : null);
  }, [dirty, currentJson, savedJson]);

  const storedRaw = useSyncExternalStore(noopSubscribe, readDraftRaw, () => null);
  const stored = useMemo(() => parseDraft(storedRaw), [storedRaw]);
  const [draftDismissed, setDraftDismissed] = useState(false);
  const restorable =
    !draftDismissed && stored && stored.base === savedJson && stored.draftJson !== savedJson && stored.draftJson !== currentJson
      ? stored
      : null;

  // Warn before closing or reloading the tab with unsaved changes (the sessionStorage copy above
  // also survives a reload of this tab, but not closing it).
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = ""; // older Safari needs this
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const setField =
    <K extends keyof CvContent>(key: K) =>
    (value: CvContent[K]) =>
      setCv((prev) => ({ ...prev, [key]: value }));

  const save = () => {
    const problem = findProblem(cv);
    if (problem) {
      setError(problem);
      setJustSaved(false);
      return;
    }
    setError(null);
    const snapshot: CvContent = {
      ...cv,
      profile: { ...cv.profile, links: cv.profile.links.map((l) => ({ ...l, url: withHttps(l.url) })) },
      projects: cv.projects.map((p) => ({ ...p, link: withHttps(p.link) })),
    };
    const snapshotJson = JSON.stringify(snapshot);
    if (snapshotJson !== currentJson) setCv(snapshot);
    writeDraft(savedJson, snapshotJson); // in case the session has expired and we get sent to login
    startTransition(async () => {
      let result: ActionResult | undefined;
      try {
        result = await saveMasterCvAction(snapshot);
      } catch (err) {
        // Expired session: Next navigates to /admin/login by itself. The draft is in sessionStorage
        // and is offered back after signing in again.
        if (isRedirectError(err)) return;
        setError("Kaydedilemedi. Bağlantını kontrol edip tekrar dene.");
        setJustSaved(false);
        return;
      }
      if (!result) return;
      if (result.ok) {
        setSavedJson(snapshotJson);
        setJustSaved(true);
      } else {
        setError(result.error);
        setJustSaved(false);
      }
    });
  };

  const status = pending
    ? "Kaydediliyor…"
    : dirty
      ? "Kaydedilmemiş değişiklik var"
      : justSaved
        ? "Kaydedildi"
        : updatedAt
          ? "Tüm değişiklikler kayıtlı"
          : "Henüz kaydedilmedi";

  return (
    <div className="mt-6">
      {/* Top bar */}
      <div className="sticky top-3 z-20 rounded-2xl border border-line bg-panel/95 px-4 py-3 shadow-[0_12px_40px_-16px_rgb(0_0_0/0.8)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p aria-live="polite" className="flex items-center gap-2 text-sm font-semibold">
              <span
                aria-hidden="true"
                className={`size-2 shrink-0 rounded-full ${dirty ? "bg-amber-300" : "bg-emerald-400"}`}
              />
              {status}
            </p>
            <p className="mt-0.5 text-xs text-mist">
              {updatedAt ? (
                <>
                  Son kayıt: <SavedTime iso={updatedAt} />
                </>
              ) : (
                "Henüz kayıt yok"
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/cv/print"
              className={buttonSecondary}
              onClick={(event) => {
                if (
                  dirty &&
                  !window.confirm(
                    "Kaydedilmemiş değişiklikler yazdırılan CV'de görünmez. Önce kaydetmen iyi olur. Yine de devam edilsin mi?",
                  )
                ) {
                  event.preventDefault();
                }
              }}
            >
              Yazdır / PDF
            </Link>
            <button type="button" onClick={save} disabled={pending} className={`${buttonPrimary} disabled:opacity-60`}>
              {pending ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </div>
        {error ? (
          <p role="alert" className="mt-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}
        {restorable ? (
          <div role="status" className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-sm">
            <span>Bu sekmede kaydedilmemiş bir taslağın var.</span>
            <button
              type="button"
              className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-night"
              onClick={() => {
                setCv(restorable.draft);
                setDraftDismissed(true);
              }}
            >
              Taslağı geri yükle
            </button>
            <button
              type="button"
              className="rounded-full border border-line-strong px-3 py-1 text-xs font-semibold"
              onClick={() => {
                writeDraft(savedJson, null);
                setDraftDismissed(true);
              }}
            >
              Sil
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-8">
        {/* Form */}
        <div className="space-y-4">
          <p className="text-sm text-mist">
            CV içeriğini İngilizce yaz. Sarı uyarılar kaydetmeni engellemez; metni güçlendirmek için ipucudur.
          </p>
          <ProfileSection profile={cv.profile} onChange={setField("profile")} />
          <SummarySection summary={cv.summary} onChange={setField("summary")} />
          <ExperienceSection items={cv.experience} onChange={setField("experience")} facts={facts} />
          <ProjectsSection items={cv.projects} onChange={setField("projects")} facts={facts} />
          <SkillsSection items={cv.skills} onChange={setField("skills")} />
          <EducationSection items={cv.education} onChange={setField("education")} />
          <LanguagesSection items={cv.languages} onChange={setField("languages")} />
        </div>

        {/* Live preview: an A4-wide sheet, scaled down with CSS zoom (zoom also shrinks the layout box) */}
        <aside aria-labelledby="cv-preview-heading" className="mt-10 lg:sticky lg:top-28 lg:mt-0">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id="cv-preview-heading" className="text-lg font-semibold">
              Önizleme
            </h2>
            <p className="text-xs text-mist">Kaydedilmemiş hâli</p>
          </div>
          <div className="overflow-auto rounded-2xl border border-line bg-panel p-3 lg:max-h-[calc(100dvh-10rem)]">
            <div className="mx-auto w-[210mm] overflow-hidden rounded-md bg-white shadow-[0_20px_60px_-20px_rgb(0_0_0/0.7)] [zoom:0.4] sm:[zoom:0.68] md:[zoom:0.84] lg:[zoom:0.55] xl:[zoom:0.62]">
              {preview}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
