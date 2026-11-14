"use client";

import { useDeferredValue, useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { buttonPrimary, buttonSecondary } from "@/app/lib/ui";
import { isEndBeforeStart, newId } from "../../_lib/format";
import { lintText, type LintIssue } from "../../_lib/lint";
import {
  FACT_KIND,
  FACT_KIND_LABEL,
  FACT_STATUS,
  FACT_STATUS_LABEL,
  OWNERSHIP,
  OWNERSHIP_LABEL,
  factInputSchema,
  yearMonth,
  type ActionResult,
  type Fact,
  type FactInput,
  type Skill,
} from "../../_lib/schema";
import { createFactAction, updateFactAction } from "./actions";

// ── Shared bits for the fact bank screens (FactBank, SkillDictionary) ───────────────────────────

export const inputClass =
  "w-full rounded-xl border border-line-strong bg-night px-3 py-2 text-sm text-ink placeholder:text-mist/60 focus:border-ink/50";
export const labelClass = "mb-1.5 block text-sm font-semibold text-ink";
export const hintClass = "mt-1.5 text-xs text-mist";
export const errorClass = "text-sm text-red-300";
export const chipClass = "rounded-full border border-line-strong px-2.5 py-0.5 text-xs text-ink";

const smallBase =
  "inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";
export const smallButton = `${smallBase} border border-line-strong text-ink hover:border-ink/40 hover:bg-raised`;
export const smallPrimary = `${smallBase} bg-ink text-night hover:bg-white`;
export const smallDanger = `${smallBase} border border-red-300/30 text-red-200 hover:border-red-300/60 hover:bg-red-950/40`;

export type Announce = (message: string) => void;

// "Unity, C# ,unity" -> ["Unity", "C#"] (trimmed, empty and repeated items dropped)
export function splitList(value: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of value.split(",")) {
    const item = raw.trim().replace(/\s+/g, " ");
    const key = item.toLowerCase();
    if (item && !seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

const FAILED = "İşlem tamamlanamadı. Bağlantını kontrol edip tekrar dene.";

function isRedirect(e: unknown): boolean {
  const digest = (e as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

// Runs a Server Action in a transition and keeps its error text. The server validates again;
// a session that ran out redirects to the login page (no error shown for that).
export function useServerAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (call: () => Promise<ActionResult>, onOk?: () => void) => {
    setError(null);
    startTransition(async () => {
      let result: ActionResult | undefined;
      try {
        result = await call();
      } catch (e) {
        if (!isRedirect(e)) startTransition(() => setError(FAILED));
        return;
      }
      // Updates after an await need their own transition so they commit together with the
      // refreshed server props (no flash of the old data).
      startTransition(() => {
        if (!result) return;
        if (result.ok) onOk?.();
        else setError(result.error);
      });
    });
  };

  return { pending, error, setError, run };
}

type FieldProps = { id: string; "aria-describedby"?: string };

// Label + control + hint, wired together with ids
export function Field({
  label,
  hint,
  footer,
  className,
  children,
}: {
  label: string;
  hint?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: (props: FieldProps) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children({ id, "aria-describedby": hint ? hintId : undefined })}
      {hint ? (
        <p id={hintId} className={hintClass}>
          {hint}
        </p>
      ) : null}
      {footer}
    </div>
  );
}

export function LintList({ issues, id, className = "" }: { issues: LintIssue[]; id?: string; className?: string }) {
  if (issues.length === 0) return null;
  return (
    <ul id={id} aria-label="Yazım uyarıları" className={`space-y-1 text-sm text-amber-200 ${className}`}>
      {issues.map((issue) => (
        <li key={issue.code} className="flex gap-2">
          <span aria-hidden="true" className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-amber-300" />
          <span>{issue.message}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Fact form ───────────────────────────────────────────────────────────────────────────────────

type Ownership = NonNullable<FactInput["ownership"]>;
type Status = NonNullable<FactInput["status"]>;
type Metric = FactInput["metrics"][number];
type MetricRow = Metric & { key: string };

type Draft = {
  statement: string;
  kind: FactInput["kind"];
  context: string;
  start: string;
  end: string;
  ownership: Ownership | "";
  status: Status | "";
  tools: string;
  qualifiers: string;
  metrics: MetricRow[];
  evidenceUrl: string;
};

const MAX_METRICS = 5;

function toDraft(fact?: Fact): Draft {
  return {
    statement: fact?.statement ?? "",
    kind: fact?.kind ?? "project",
    context: fact?.context ?? "",
    start: fact?.start ?? "",
    end: fact?.end ?? "",
    ownership: fact?.ownership ?? "",
    status: fact?.status ?? "",
    tools: fact ? fact.tools.join(", ") : "",
    qualifiers: fact ? fact.qualifiers.join(", ") : "",
    // Stable keys for existing rows; new rows get newId() in the click handler
    metrics: (fact?.metrics ?? []).map((m, i) => ({ ...m, key: `m${i}` })),
    evidenceUrl: fact?.evidenceUrl ?? "",
  };
}

const isEmptyMetric = (m: Metric) => !m.value.trim() && !m.unit.trim() && !m.label.trim() && !m.source.trim();

function toInput(d: Draft): FactInput {
  return {
    statement: d.statement.trim(),
    kind: d.kind,
    context: d.context.trim(),
    start: d.start.trim() || null,
    end: d.end.trim() || null,
    ownership: d.ownership || null,
    status: d.status || null,
    tools: splitList(d.tools),
    qualifiers: splitList(d.qualifiers),
    metrics: d.metrics
      .filter((m) => !isEmptyMetric(m))
      .map((m) => ({ value: m.value.trim(), unit: m.unit.trim(), label: m.label.trim(), source: m.source.trim() })),
    evidenceUrl: d.evidenceUrl.trim(),
  };
}

const FIELD_LABEL: Record<string, string> = {
  statement: "Cümle",
  kind: "Tür",
  context: "Bağlam",
  start: "Başlangıç",
  end: "Bitiş",
  ownership: "Rolüm",
  status: "Durum",
  tools: "Araçlar",
  metrics: "Ölçümler",
  qualifiers: "Kapsam notları",
  evidenceUrl: "Kanıt bağlantısı",
};

// Client-side checks with Turkish messages. The Server Action validates the same input again.
function check(draft: Draft, input: FactInput, confirmed: boolean): string | null {
  if (input.statement.length < 10) return "Cümle en az 10 karakter olmalı.";
  if (input.statement.length > 400) return "Cümle en fazla 400 karakter olabilir.";
  if (input.start && !yearMonth.safeParse(input.start).success) return "Başlangıç YYYY-AA ya da YYYY biçiminde olmalı (ör. 2024-09 ya da 2024).";
  if (input.end && !yearMonth.safeParse(input.end).success) return "Bitiş YYYY-AA ya da YYYY biçiminde olmalı (ör. 2025-02 ya da 2025).";
  if (input.start && input.end && isEndBeforeStart(input.start, input.end)) return "Bitiş, başlangıçtan önce olamaz.";
  if (confirmed && (!input.ownership || !input.status)) {
    return "Onaylı bir bilgide \"Rolüm\" ve \"Durum\" boş bırakılamaz. Boşaltmak için önce onayı kaldır.";
  }
  if (input.tools.length > 20) return "En fazla 20 araç yazabilirsin.";
  const longTool = input.tools.find((t) => t.length > 60);
  if (longTool) return `Araç adı en fazla 60 karakter olabilir: "${longTool.slice(0, 40)}…"`;
  if (input.qualifiers.length > 10) return "En fazla 10 kapsam notu yazabilirsin.";
  const longQualifier = input.qualifiers.find((q) => q.length > 40);
  if (longQualifier) return `Kapsam notu en fazla 40 karakter olabilir: "${longQualifier}"`;
  const badRow = draft.metrics.findIndex((m) => !isEmptyMetric(m) && (!m.value.trim() || !m.label.trim()));
  if (badRow >= 0) return `Ölçüm ${badRow + 1}: değer ve "ne ölçüyor" alanları gerekli.`;
  if (input.evidenceUrl && !/^https?:\/\/\S+$/i.test(input.evidenceUrl)) {
    return "Kanıt bağlantısı http:// ya da https:// ile başlamalı.";
  }
  const parsed = factInputSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = FIELD_LABEL[String(issue?.path[0])] ?? "Alan";
    return `${field}: ${issue?.message ?? "geçersiz değer"}`;
  }
  return null;
}

function pick<T extends string>(list: readonly T[], value: string): T | "" {
  return (list as readonly string[]).includes(value) ? (value as T) : "";
}

// Datalist options for a comma-separated input: each option is "<what is typed so far>, <skill>",
// so the browser keeps suggesting after every comma.
function toolSuggestions(value: string, skills: Skill[]): string[] {
  const cut = value.lastIndexOf(",");
  const head = cut >= 0 ? value.slice(0, cut + 1) : "";
  const tail = cut >= 0 ? value.slice(cut + 1) : value;
  const sep = cut < 0 ? "" : tail.length === 0 ? " " : (tail.match(/^\s*/)?.[0] ?? "");
  const used = new Set(splitList(head).map((t) => t.toLowerCase()));
  return skills.filter((s) => !used.has(s.name.toLowerCase())).map((s) => `${head}${sep}${s.name}`);
}

export default function FactForm({
  fact,
  skills,
  onCancel,
  onDone,
}: {
  fact?: Fact;
  skills: Skill[];
  onCancel: () => void;
  onDone: (message: string) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(fact));
  const [baseline] = useState(() => JSON.stringify(toInput(toDraft(fact))));
  const { pending, error, setError, run } = useServerAction();
  const statementRef = useRef<HTMLTextAreaElement>(null);
  const focusMetric = useRef<string | null>(null);
  const focusAddMetric = useRef(false);
  const uid = useId();

  const statement = useDeferredValue(draft.statement);
  const issues = lintText(statement);

  useEffect(() => {
    statementRef.current?.focus();
  }, []);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const setMetric = (key: string, field: keyof Metric, value: string) =>
    setDraft((d) => ({ ...d, metrics: d.metrics.map((m) => (m.key === key ? { ...m, [field]: value } : m)) }));

  const addMetric = () => {
    const key = newId("n");
    focusMetric.current = key;
    setDraft((d) =>
      d.metrics.length >= MAX_METRICS
        ? d
        : { ...d, metrics: [...d.metrics, { key, value: "", unit: "", label: "", source: "" }] },
    );
  };

  const removeMetric = (key: string) => {
    focusAddMetric.current = true;
    setDraft((d) => ({ ...d, metrics: d.metrics.filter((m) => m.key !== key) }));
  };

  const knownSpellings = new Set(skills.flatMap((s) => [s.name, ...s.aliases]).map((s) => s.toLowerCase()));
  const unknownTools =
    skills.length > 0 ? splitList(draft.tools).filter((t) => !knownSpellings.has(t.toLowerCase())) : [];
  const toolOptions = toolSuggestions(draft.tools, skills);

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const input = toInput(draft);
    const problem = check(draft, input, fact?.confirmed ?? false);
    if (problem) {
      setError(problem);
      return;
    }
    run(
      () => (fact ? updateFactAction(fact.id, input) : createFactAction(input)),
      () => onDone(fact ? `${fact.id} kaydedildi.` : "Yeni bilgi eklendi; onay bekleyenler arasında."),
    );
  };

  const cancel = () => {
    const dirty = JSON.stringify(toInput(draft)) !== baseline;
    if (dirty && !window.confirm("Kaydedilmemiş değişiklikler silinecek. Kapatılsın mı?")) return;
    onCancel();
  };

  const statementDescribedBy = [`${uid}-statement-hint`, issues.length ? `${uid}-lint` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-labelledby={`${uid}-title`}
      className="rounded-2xl border border-line-strong bg-panel p-5 sm:p-6"
    >
      {/* The new-fact form sits next to the h2 groups; the edit form sits inside a group */}
      {fact ? (
        <h3 id={`${uid}-title`} className="font-display text-lg font-semibold">
          {fact.id} düzenleniyor
        </h3>
      ) : (
        <h2 id={`${uid}-title`} className="font-display text-lg font-semibold">
          Yeni bilgi
        </h2>
      )}

      <div className="mt-5">
        <label htmlFor={`${uid}-statement`} className={labelClass}>
          Cümle
        </label>
        <textarea
          id={`${uid}-statement`}
          ref={statementRef}
          lang="en"
          rows={3}
          maxLength={400}
          value={draft.statement}
          onChange={(e) => set("statement", e.target.value)}
          aria-describedby={statementDescribedBy}
          placeholder="Built the level editor for a Unity puzzle prototype."
          className={`${inputClass} resize-y leading-relaxed`}
        />
        <div className="mt-1.5 flex justify-between gap-4 text-xs text-mist">
          <p id={`${uid}-statement-hint`}>Kendi cümlen, İngilizce, tek bir iddia.</p>
          <p aria-hidden="true" className="shrink-0 tabular-nums">
            {draft.statement.trim().length}/400
          </p>
        </div>
        <LintList id={`${uid}-lint`} issues={issues} className="mt-2" />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Tür">
          {(p) => (
            <select
              {...p}
              value={draft.kind}
              onChange={(e) => set("kind", pick(FACT_KIND, e.target.value) || draft.kind)}
              className={inputClass}
            >
              {FACT_KIND.map((k) => (
                <option key={k} value={k}>
                  {FACT_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Bağlam" hint="İşveren ya da proje adı.">
          {(p) => (
            <input
              {...p}
              lang="en"
              maxLength={120}
              value={draft.context}
              onChange={(e) => set("context", e.target.value)}
              placeholder="Brew Games"
              className={inputClass}
            />
          )}
        </Field>

        <Field label="Başlangıç" hint="YYYY-AA ya da sadece yıl (YYYY). Bilmiyorsan boş bırak; ay uydurma.">
          {(p) => (
            <input
              {...p}
              type="text"
              inputMode="numeric"
              maxLength={7}
              pattern="[0-9]{4}(-(0[1-9]|1[0-2]))?"
              value={draft.start}
              onChange={(e) => set("start", e.target.value.trim())}
              placeholder="2024-09 ya da 2024"
              className={inputClass}
            />
          )}
        </Field>

        <Field label="Bitiş" hint="Devam ediyorsa ya da tek bir tarihse boş bırak.">
          {(p) => (
            <input
              {...p}
              type="text"
              inputMode="numeric"
              maxLength={7}
              pattern="[0-9]{4}(-(0[1-9]|1[0-2]))?"
              value={draft.end}
              onChange={(e) => set("end", e.target.value.trim())}
              placeholder="2024-09 ya da 2024"
              className={inputClass}
            />
          )}
        </Field>

        <Field
          label="Rolüm"
          hint="Onaylamak için gerekli. Led, Owned gibi güçlü fiiller sadece “Tek başıma” ve “Liderlik ettim” için kullanılır."
        >
          {(p) => (
            <select
              {...p}
              value={draft.ownership}
              onChange={(e) => set("ownership", pick(OWNERSHIP, e.target.value))}
              className={inputClass}
            >
              <option value="">Seçilmedi</option>
              {OWNERSHIP.map((o) => (
                <option key={o} value={o}>
                  {OWNERSHIP_LABEL[o]}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Durum" hint="Onaylamak için gerekli. Prototip, jam gibi kapsam bilgisi CV'de korunur.">
          {(p) => (
            <select
              {...p}
              value={draft.status}
              onChange={(e) => set("status", pick(FACT_STATUS, e.target.value))}
              className={inputClass}
            >
              <option value="">Seçilmedi</option>
              {FACT_STATUS.map((s) => (
                <option key={s} value={s}>
                  {FACT_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field
          label="Araçlar"
          hint="Virgülle ayır. Ör: Unity, C#, Photoshop"
          className="sm:col-span-2"
          footer={
            unknownTools.length > 0 ? (
              <p className="mt-1 text-xs text-amber-200">Beceri sözlüğünde yok: {unknownTools.join(", ")}</p>
            ) : null
          }
        >
          {(p) => (
            <>
              <input
                {...p}
                lang="en"
                list={`${uid}-tools`}
                autoComplete="off"
                value={draft.tools}
                onChange={(e) => set("tools", e.target.value)}
                className={inputClass}
              />
              <datalist id={`${uid}-tools`}>
                {toolOptions.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </>
          )}
        </Field>

        <Field
          label="Kapsam notları"
          hint="Virgülle ayır, İngilizce. Ör: AI-assisted, illustrations not mine"
          className="sm:col-span-2"
        >
          {(p) => (
            <input
              {...p}
              lang="en"
              autoComplete="off"
              value={draft.qualifiers}
              onChange={(e) => set("qualifiers", e.target.value)}
              className={inputClass}
            />
          )}
        </Field>

        <fieldset className="sm:col-span-2">
          <legend className={labelClass}>Ölçümler</legend>
          <p className="text-xs text-mist">
            Sadece doğrulayabildiğin sayılar. Kaynak: sayının nereden kontrol edilebileceği.
          </p>
          {draft.metrics.length > 0 ? (
            <ol className="mt-3 space-y-3">
              {draft.metrics.map((m, i) => (
                <li key={m.key} className="rounded-xl border border-line p-3">
                  <fieldset>
                    <legend className="sr-only">Ölçüm {i + 1}</legend>
                    <div className="grid gap-3 sm:grid-cols-[5.5rem_6.5rem_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                      <label className="block">
                        <span className="mb-1 block text-xs text-mist">Değer</span>
                        <input
                          ref={(el) => {
                            if (el && focusMetric.current === m.key) {
                              focusMetric.current = null;
                              el.focus();
                            }
                          }}
                          maxLength={20}
                          inputMode="decimal"
                          value={m.value}
                          onChange={(e) => setMetric(m.key, "value", e.target.value)}
                          placeholder="12"
                          className={inputClass}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs text-mist">Birim</span>
                        <input
                          lang="en"
                          maxLength={20}
                          value={m.unit}
                          onChange={(e) => setMetric(m.key, "unit", e.target.value)}
                          placeholder="%"
                          className={inputClass}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs text-mist">Ne ölçüyor</span>
                        <input
                          lang="en"
                          maxLength={80}
                          value={m.label}
                          onChange={(e) => setMetric(m.key, "label", e.target.value)}
                          placeholder="CTR on Meta ads"
                          className={inputClass}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs text-mist">Kaynak</span>
                        <input
                          maxLength={120}
                          value={m.source}
                          onChange={(e) => setMetric(m.key, "source", e.target.value)}
                          placeholder="Meta Ads Manager raporu"
                          className={inputClass}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeMetric(m.key)}
                        aria-label={`Kaldır (ölçüm ${i + 1})`}
                        className={`${smallDanger} justify-self-start`}
                      >
                        Kaldır
                      </button>
                    </div>
                  </fieldset>
                </li>
              ))}
            </ol>
          ) : null}
          {draft.metrics.length < MAX_METRICS ? (
            <button
              type="button"
              ref={(el) => {
                if (el && focusAddMetric.current) {
                  focusAddMetric.current = false;
                  el.focus();
                }
              }}
              onClick={addMetric}
              className={`${smallButton} mt-3`}
            >
              Ölçüm ekle
            </button>
          ) : (
            <p className="mt-3 text-xs text-mist">En fazla {MAX_METRICS} ölçüm eklenebilir.</p>
          )}
        </fieldset>

        <Field label="Kanıt bağlantısı" hint="İsteğe bağlı. Mağaza sayfası, video, repo..." className="sm:col-span-2">
          {(p) => (
            <input
              {...p}
              type="url"
              inputMode="url"
              maxLength={300}
              value={draft.evidenceUrl}
              onChange={(e) => set("evidenceUrl", e.target.value)}
              placeholder="https://"
              className={inputClass}
            />
          )}
        </Field>
      </div>

      {error ? (
        <p role="alert" className={`mt-5 ${errorClass}`}>
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={`${buttonPrimary} disabled:opacity-60`}>
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </button>
        <button type="button" onClick={cancel} disabled={pending} className={`${buttonSecondary} disabled:opacity-60`}>
          İptal
        </button>
      </div>
    </form>
  );
}
