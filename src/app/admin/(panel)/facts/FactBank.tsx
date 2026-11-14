"use client";

import { useId, useRef, useState } from "react";
import { buttonPrimary } from "@/app/lib/ui";
import { formatRange } from "../../_lib/format";
import { lintText } from "../../_lib/lint";
import {
  FACT_KIND_LABEL,
  FACT_STATUS_LABEL,
  OWNERSHIP_LABEL,
  absenceInputSchema,
  type Absence,
  type Fact,
  type Skill,
} from "../../_lib/schema";
import { addAbsenceAction, deleteFactAction, removeAbsenceAction, setFactConfirmedAction } from "./actions";
import FactForm, {
  LintList,
  chipClass,
  errorClass,
  hintClass,
  inputClass,
  labelClass,
  smallButton,
  smallDanger,
  smallPrimary,
  useServerAction,
  type Announce,
} from "./FactForm";
import SkillDictionary from "./SkillDictionary";

type TabKey = "facts" | "absences" | "skills";

const TABS: { key: TabKey; label: string }[] = [
  { key: "facts", label: "Bilgiler" },
  { key: "absences", label: "Bende yok" },
  { key: "skills", label: "Beceri sözlüğü" },
];

const ORIGIN_LABEL: Record<Fact["origin"], string> = { cv: "CV'den", site: "Siteden", manual: "Elle" };

export default function FactBank({ facts, absences, skills }: { facts: Fact[]; absences: Absence[]; skills: Skill[] }) {
  const [tab, setTab] = useState<TabKey>("facts");
  const [status, setStatus] = useState("");
  const uid = useId();
  const counts: Record<TabKey, number> = { facts: facts.length, absences: absences.length, skills: skills.length };

  // Arrow keys / Home / End move between tabs (WAI-ARIA tabs pattern, automatic activation)
  const onTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    setTab(TABS[next].key);
    e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <div lang="tr" className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div
          role="tablist"
          aria-label="Bilgi Bankası bölümleri"
          className="inline-flex flex-wrap gap-1 rounded-full border border-line bg-panel p-1"
        >
          {TABS.map((t, i) => {
            const selected = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                id={`${uid}-${t.key}-tab`}
                aria-selected={selected}
                aria-controls={`${uid}-${t.key}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTab(t.key)}
                onKeyDown={(e) => onTabKeyDown(e, i)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  selected ? "bg-ink text-night" : "text-mist hover:bg-raised hover:text-ink"
                }`}
              >
                {t.label} <span className="tabular-nums">({counts[t.key]})</span>
              </button>
            );
          })}
        </div>
        <p role="status" aria-live="polite" className="min-h-5 text-sm text-mist">
          {status}
        </p>
      </div>

      {TABS.map((t) => (
        <div
          key={t.key}
          role="tabpanel"
          id={`${uid}-${t.key}-panel`}
          aria-labelledby={`${uid}-${t.key}-tab`}
          hidden={tab !== t.key}
          tabIndex={0}
          className="mt-8 rounded-2xl"
        >
          {t.key === "facts" ? (
            <FactsPanel facts={facts} skills={skills} announce={setStatus} />
          ) : t.key === "absences" ? (
            <AbsencesPanel absences={absences} announce={setStatus} />
          ) : (
            <SkillDictionary skills={skills} announce={setStatus} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Bilgiler ────────────────────────────────────────────────────────────────────────────────────

function FactsPanel({ facts, skills, announce }: { facts: Fact[]; skills: Skill[]; announce: Announce }) {
  const [adding, setAdding] = useState(false);
  const addButton = useRef<HTMLButtonElement>(null);
  const pending = facts.filter((f) => !f.confirmed);
  const confirmed = facts.filter((f) => f.confirmed);

  const closeAdd = () => {
    setAdding(false);
    addButton.current?.focus();
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-mist">
          Her bilgi tek bir iddia. Onaylamadan önce cümleyi kendi kelimelerinle düzelt, “Rolüm” ve “Durum”u seç.
        </p>
        <button
          ref={addButton}
          type="button"
          aria-expanded={adding}
          onClick={() => setAdding(true)}
          className={buttonPrimary}
        >
          Yeni bilgi ekle
        </button>
      </div>

      {adding ? (
        <FactForm
          skills={skills}
          onCancel={closeAdd}
          onDone={(message) => {
            closeAdd();
            announce(message);
          }}
        />
      ) : null}

      {facts.length === 0 ? (
        <p className="text-sm text-mist">
          Henüz bilgi yok. CV&apos;den çıkarılan taslaklar ve elle eklediklerin burada görünür.
        </p>
      ) : (
        <>
          <FactGroup
            title="Onay bekleyen"
            facts={pending}
            empty="Onay bekleyen bilgi yok."
            skills={skills}
            announce={announce}
          />
          <FactGroup
            title="Onaylı"
            facts={confirmed}
            empty="Henüz onaylı bilgi yok."
            skills={skills}
            announce={announce}
          />
        </>
      )}
    </div>
  );
}

function FactGroup({
  title,
  facts,
  empty,
  skills,
  announce,
}: {
  title: string;
  facts: Fact[];
  empty: string;
  skills: Skill[];
  announce: Announce;
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="font-display text-xl font-semibold">
        {title} <span className="font-normal text-mist tabular-nums">({facts.length})</span>
      </h2>
      {facts.length === 0 ? (
        <p className="mt-3 text-sm text-mist">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {facts.map((fact) => (
            <li key={fact.id}>
              <FactCard fact={fact} skills={skills} announce={announce} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const badgeClass = "rounded-full border border-line-strong px-2.5 py-0.5 text-xs text-mist";

function NotSelected() {
  return <span className="text-amber-200">Seçilmedi</span>;
}

function FactCard({ fact, skills, announce }: { fact: Fact; skills: Skill[]; announce: Announce }) {
  const [editing, setEditing] = useState(false);
  const { pending, error, setError, run } = useServerAction();
  const refocusEdit = useRef(false);
  const uid = useId();

  const close = () => {
    refocusEdit.current = true;
    setEditing(false);
  };

  if (editing) {
    return (
      <FactForm
        fact={fact}
        skills={skills}
        onCancel={close}
        onDone={(message) => {
          close();
          announce(message);
        }}
      />
    );
  }

  const toggleConfirm = () =>
    run(
      () => setFactConfirmedAction(fact.id, !fact.confirmed),
      () => announce(fact.confirmed ? `${fact.id} onayı kaldırıldı.` : `${fact.id} onaylandı.`),
    );

  const remove = () => {
    if (!window.confirm(`${fact.id} silinsin mi? Bu geri alınamaz.`)) return;
    run(
      () => deleteFactAction(fact.id),
      () => announce(`${fact.id} silindi.`),
    );
  };

  const issues = lintText(fact.statement);
  const range = formatRange(fact.start, fact.end, false);
  const evidenceIsLink = /^https?:\/\/\S+$/i.test(fact.evidenceUrl);

  return (
    <article aria-labelledby={`${uid}-id`} className="rounded-2xl border border-line bg-panel p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          id={`${uid}-id`}
          className="rounded-md border border-line-strong bg-night px-1.5 py-0.5 font-mono text-xs text-ink"
        >
          {fact.id}
        </span>
        <span className={badgeClass}>{FACT_KIND_LABEL[fact.kind]}</span>
        <span className={badgeClass}>{ORIGIN_LABEL[fact.origin]}</span>
        {fact.confirmed ? (
          <span className="rounded-full border border-emerald-300/40 px-2.5 py-0.5 text-xs text-emerald-200">
            Onaylı
          </span>
        ) : null}
      </div>

      <p lang="en" className="mt-3 break-words text-base leading-relaxed text-ink">
        {fact.statement}
      </p>
      <LintList issues={issues} className="mt-2" />

      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div className="flex min-w-0 gap-2">
          <dt className="shrink-0 text-mist">Bağlam</dt>
          <dd lang="en" className="min-w-0 break-words">
            {fact.context || "—"}
          </dd>
        </div>
        <div className="flex min-w-0 gap-2">
          <dt className="shrink-0 text-mist">Tarih</dt>
          <dd lang="en" className="min-w-0">
            {range || "—"}
          </dd>
        </div>
        <div className="flex min-w-0 gap-2">
          <dt className="shrink-0 text-mist">Rolüm</dt>
          <dd className="min-w-0">{fact.ownership ? OWNERSHIP_LABEL[fact.ownership] : <NotSelected />}</dd>
        </div>
        <div className="flex min-w-0 gap-2">
          <dt className="shrink-0 text-mist">Durum</dt>
          <dd className="min-w-0">{fact.status ? FACT_STATUS_LABEL[fact.status] : <NotSelected />}</dd>
        </div>

        {fact.tools.length > 0 ? (
          <div className="flex min-w-0 flex-wrap items-baseline gap-2 sm:col-span-2">
            <dt className="shrink-0 text-mist">Araçlar</dt>
            <dd className="min-w-0">
              <ul lang="en" className="flex flex-wrap gap-1.5">
                {fact.tools.map((tool) => (
                  <li key={tool} className={chipClass}>
                    {tool}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}

        {fact.qualifiers.length > 0 ? (
          <div className="flex min-w-0 flex-wrap items-baseline gap-2 sm:col-span-2">
            <dt className="shrink-0 text-mist">Kapsam notları</dt>
            <dd className="min-w-0">
              <ul lang="en" className="flex flex-wrap gap-1.5">
                {fact.qualifiers.map((q) => (
                  <li key={q} className={`${chipClass} border-dashed`}>
                    {q}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}

        {fact.metrics.length > 0 ? (
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-mist">Ölçümler</dt>
            <dd className="mt-1">
              <ul className="space-y-1">
                {fact.metrics.map((m, i) => (
                  <li key={i} className="break-words">
                    <span lang="en">
                      {m.value}
                      {m.unit ? ` ${m.unit}` : ""} – {m.label}
                    </span>{" "}
                    {m.source ? (
                      <span className="text-mist">(kaynak: {m.source})</span>
                    ) : (
                      <span className="text-amber-200">(kaynak yazılmadı)</span>
                    )}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}

        {fact.evidenceUrl ? (
          <div className="flex min-w-0 gap-2 sm:col-span-2">
            <dt className="shrink-0 text-mist">Kanıt</dt>
            <dd className="min-w-0 break-all">
              {evidenceIsLink ? (
                <a
                  href={fact.evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-line-strong underline-offset-4 hover:decoration-ink"
                >
                  {fact.evidenceUrl}
                </a>
              ) : (
                fact.evidenceUrl
              )}
            </dd>
          </div>
        ) : null}
      </dl>

      {fact.origin !== "manual" && fact.sourceText ? (
        <details className="mt-4 rounded-xl border border-line bg-night/60 px-4 py-3 text-sm">
          <summary className="cursor-pointer text-mist hover:text-ink">Kaynak metin</summary>
          <p className="mt-2 whitespace-pre-wrap break-words text-ink/90">{fact.sourceText}</p>
        </details>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggleConfirm}
          disabled={pending}
          aria-label={`${fact.confirmed ? "Onayı kaldır" : "Onayla"} (${fact.id})`}
          className={fact.confirmed ? smallButton : smallPrimary}
        >
          {fact.confirmed ? "Onayı kaldır" : "Onayla"}
        </button>
        <button
          type="button"
          ref={(el) => {
            if (el && refocusEdit.current) {
              refocusEdit.current = false;
              el.focus();
            }
          }}
          onClick={() => {
            setError(null);
            setEditing(true);
          }}
          disabled={pending}
          aria-label={`Düzenle (${fact.id})`}
          className={smallButton}
        >
          Düzenle
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          aria-label={`Sil (${fact.id})`}
          className={smallDanger}
        >
          Sil
        </button>
        {pending ? <span className="text-sm text-mist">Kaydediliyor…</span> : null}
      </div>
      {error ? (
        <p role="alert" className={`mt-3 ${errorClass}`}>
          {error}
        </p>
      ) : null}
    </article>
  );
}

// ── Bende yok ───────────────────────────────────────────────────────────────────────────────────

function AbsencesPanel({ absences, announce }: { absences: Absence[]; announce: Announce }) {
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const { pending, error, setError, run } = useServerAction();
  const textRef = useRef<HTMLInputElement>(null);
  const uid = useId();

  const add = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const input = { text: text.trim().replace(/\s+/g, " "), note: note.trim() };
    if (!input.text) {
      setError("Listeye eklenecek şeyi yaz.");
      textRef.current?.focus();
      return;
    }
    if (absences.some((a) => a.text.toLowerCase() === input.text.toLowerCase())) {
      setError("Bu zaten listede.");
      return;
    }
    const parsed = absenceInputSchema.safeParse(input);
    if (!parsed.success) {
      setError("Metin en fazla 120, not en fazla 200 karakter olabilir.");
      return;
    }
    run(
      () => addAbsenceAction(parsed.data),
      () => {
        setText("");
        setNote("");
        textRef.current?.focus();
        announce(`"${parsed.data.text}" listeye eklendi.`);
      },
    );
  };

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm text-mist">
        {"Bu listedekileri yapay zekâ asla CV'ne ekleyemez; ilanlarda eksik olarak gösterilir."}
      </p>

      <form
        onSubmit={add}
        noValidate
        aria-label="Bende yok listesine ekle"
        className="rounded-2xl border border-line bg-panel p-5"
      >
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start">
          <div>
            <label htmlFor={`${uid}-text`} className={labelClass}>
              Bende olmayan
            </label>
            <input
              id={`${uid}-text`}
              ref={textRef}
              maxLength={120}
              autoComplete="off"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ör: Unreal Engine, C++ ile üretim tecrübesi, Takım liderliği"
              aria-describedby={`${uid}-text-hint`}
              className={inputClass}
            />
            <p id={`${uid}-text-hint`} className={hintClass}>
              Her seferinde tek bir şey ekle.
            </p>
          </div>
          <div>
            <label htmlFor={`${uid}-note`} className={labelClass}>
              Not <span className="font-normal text-mist">(isteğe bağlı)</span>
            </label>
            <input
              id={`${uid}-note`}
              maxLength={200}
              autoComplete="off"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ör: Sadece eğitim videolarından biliyorum"
              className={inputClass}
            />
          </div>
          <button type="submit" disabled={pending} className={`${buttonPrimary} disabled:opacity-60 sm:mt-7`}>
            {pending ? "Ekleniyor…" : "Ekle"}
          </button>
        </div>
        {error ? (
          <p role="alert" className={`mt-4 ${errorClass}`}>
            {error}
          </p>
        ) : null}
      </form>

      {absences.length === 0 ? (
        <p className="text-sm text-mist">Liste boş.</p>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-panel">
          {absences.map((absence) => (
            <AbsenceItem key={absence.id} absence={absence} announce={announce} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AbsenceItem({ absence, announce }: { absence: Absence; announce: Announce }) {
  const { pending, error, run } = useServerAction();

  const remove = () => {
    if (!window.confirm(`"${absence.text}" listeden kaldırılsın mı?`)) return;
    run(
      () => removeAbsenceAction(absence.id),
      () => announce(`"${absence.text}" listeden kaldırıldı.`),
    );
  };

  return (
    <li className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="break-words text-ink">{absence.text}</p>
        {absence.note ? <p className="mt-0.5 break-words text-sm text-mist">{absence.note}</p> : null}
        {error ? (
          <p role="alert" className={`mt-1 ${errorClass}`}>
            {error}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        aria-label={`Kaldır (${absence.text})`}
        className={smallDanger}
      >
        {pending ? "Kaldırılıyor…" : "Kaldır"}
      </button>
    </li>
  );
}
