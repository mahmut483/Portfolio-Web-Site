"use client";

import { useEffect, useRef, useState } from "react";
import { buttonPrimary, buttonSecondary } from "@/app/lib/ui";
import {
  PROFICIENCY,
  PROFICIENCY_LABEL,
  SKILL_CATEGORY,
  SKILL_CATEGORY_LABEL,
  skillInputSchema,
  type Skill,
  type SkillInput,
} from "../../_lib/schema";
import { removeSkillAction, upsertSkillAction } from "./actions";
import {
  Field,
  chipClass,
  errorClass,
  inputClass,
  smallButton,
  smallDanger,
  splitList,
  useServerAction,
  type Announce,
} from "./FactForm";

// Columns on wide screens: name, aliases, category, proficiency, actions
const rowGrid = "md:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_8.5rem_6rem_auto] md:gap-x-4";

export default function SkillDictionary({ skills, announce }: { skills: Skill[]; announce: Announce }) {
  const [adding, setAdding] = useState(false);
  const addButton = useRef<HTMLButtonElement>(null);

  const closeAdd = () => {
    setAdding(false);
    addButton.current?.focus();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-mist">İlanlardaki farklı yazımları (ör. Unity3D) aynı beceriye bağlar.</p>
        <button
          ref={addButton}
          type="button"
          aria-expanded={adding}
          onClick={() => setAdding(true)}
          className={buttonPrimary}
        >
          Yeni beceri ekle
        </button>
      </div>

      {adding ? (
        <SkillForm
          skills={skills}
          onCancel={closeAdd}
          onDone={(message) => {
            closeAdd();
            announce(message);
          }}
        />
      ) : null}

      {skills.length === 0 ? (
        <p className="text-sm text-mist">Sözlük boş.</p>
      ) : (
        <div className="rounded-2xl border border-line bg-panel">
          <div
            aria-hidden="true"
            className={`hidden border-b border-line px-4 py-2.5 text-xs font-semibold text-mist md:grid ${rowGrid}`}
          >
            <span>Beceri</span>
            <span>Diğer yazımlar</span>
            <span>Tür</span>
            <span>Seviye</span>
            <span />
          </div>
          <ul className="divide-y divide-line">
            {skills.map((skill) => (
              <SkillRow key={skill.id} skill={skill} skills={skills} announce={announce} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SkillRow({ skill, skills, announce }: { skill: Skill; skills: Skill[]; announce: Announce }) {
  const [editing, setEditing] = useState(false);
  const { pending, error, setError, run } = useServerAction();
  const refocusEdit = useRef(false);

  const close = () => {
    refocusEdit.current = true;
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="p-4">
        <SkillForm
          skill={skill}
          skills={skills}
          onCancel={close}
          onDone={(message) => {
            close();
            announce(message);
          }}
        />
      </li>
    );
  }

  const remove = () => {
    if (!window.confirm(`"${skill.name}" sözlükten silinsin mi? Bu geri alınamaz.`)) return;
    run(
      () => removeSkillAction(skill.id),
      () => announce(`"${skill.name}" sözlükten silindi.`),
    );
  };

  return (
    <li className="px-4 py-3">
      <div className={`grid gap-y-1.5 md:items-center ${rowGrid}`}>
        <p lang="en" className="break-words font-semibold text-ink">
          {skill.name}
        </p>
        <div className="min-w-0 text-sm">
          <span className="text-mist md:sr-only">Diğer yazımlar: </span>
          {skill.aliases.length > 0 ? (
            <ul lang="en" className="inline-flex flex-wrap gap-1.5 align-middle">
              {skill.aliases.map((alias) => (
                <li key={alias} className={chipClass}>
                  {alias}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-mist">—</span>
          )}
        </div>
        <p className="text-sm text-ink">
          <span className="text-mist md:sr-only">Tür: </span>
          {SKILL_CATEGORY_LABEL[skill.category]}
        </p>
        <p className="text-sm text-ink">
          <span className="text-mist md:sr-only">Seviye: </span>
          {skill.proficiency ? PROFICIENCY_LABEL[skill.proficiency] : "—"}
        </p>
        <div className="mt-1 flex flex-wrap gap-2 md:mt-0 md:justify-end">
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
            aria-label={`Düzenle (${skill.name})`}
            className={smallButton}
          >
            Düzenle
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label={`Sil (${skill.name})`}
            className={smallDanger}
          >
            {pending ? "Siliniyor…" : "Sil"}
          </button>
        </div>
      </div>
      {error ? (
        <p role="alert" className={`mt-2 ${errorClass}`}>
          {error}
        </p>
      ) : null}
    </li>
  );
}

type Category = SkillInput["category"];
type Proficiency = NonNullable<SkillInput["proficiency"]>;
type SkillDraft = { name: string; aliases: string; category: Category; proficiency: Proficiency | "" };

// Mirrors skillId() in src/server/data/facts.ts: a new skill whose name maps to an existing id
// would silently overwrite that skill, so the form stops it first.
function skillSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/#/g, "sharp")
    .replace(/\+/g, "plus")
    .replace(/\./g, "dot")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function checkSkill(input: SkillInput, skills: Skill[], current?: Skill): string | null {
  if (!input.name) return "Beceri adı boş olamaz.";
  if (input.name.length > 60) return "Beceri adı en fazla 60 karakter olabilir.";
  if (input.aliases.length > 20) return "En fazla 20 farklı yazım ekleyebilirsin.";
  const longAlias = input.aliases.find((a) => a.length > 60);
  if (longAlias) return `Bir yazım en fazla 60 karakter olabilir: "${longAlias.slice(0, 40)}…"`;

  // One spelling may point to only one skill
  const others = skills.filter((s) => s.id !== current?.id);
  const ownerOf = (spelling: string) =>
    others.find((s) => [s.name, ...s.aliases].some((x) => x.toLowerCase() === spelling.toLowerCase()));
  for (const spelling of [input.name, ...input.aliases]) {
    const owner = ownerOf(spelling);
    if (owner) return `"${spelling}" zaten "${owner.name}" becerisinde kayıtlı.`;
  }

  if (!current) {
    const id = skillSlug(input.name);
    if (!id) return "Beceri adı en az bir harf ya da rakam içermeli.";
    const sameId = skills.find((s) => s.id === id);
    if (sameId) return `Bu ad "${sameId.name}" ile aynı kayda denk geliyor; onun yerine "${sameId.name}" becerisini düzenle.`;
  }

  if (!skillInputSchema.safeParse(input).success) return "Bilgiler geçersiz; alanları kontrol et.";
  return null;
}

function pick<T extends string>(list: readonly T[], value: string): T | "" {
  return (list as readonly string[]).includes(value) ? (value as T) : "";
}

function SkillForm({
  skill,
  skills,
  onCancel,
  onDone,
}: {
  skill?: Skill;
  skills: Skill[];
  onCancel: () => void;
  onDone: (message: string) => void;
}) {
  const [draft, setDraft] = useState<SkillDraft>(() => ({
    name: skill?.name ?? "",
    aliases: skill ? skill.aliases.join(", ") : "",
    category: skill?.category ?? "tool",
    proficiency: skill?.proficiency ?? "",
  }));
  const { pending, error, setError, run } = useServerAction();
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const set = <K extends keyof SkillDraft>(key: K, value: SkillDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const name = draft.name.trim().replace(/\s+/g, " ");
    const input: SkillInput = {
      name,
      // The name itself is not an alias
      aliases: splitList(draft.aliases).filter((a) => a.toLowerCase() !== name.toLowerCase()),
      category: draft.category,
      proficiency: draft.proficiency || null,
    };
    const problem = checkSkill(input, skills, skill);
    if (problem) {
      setError(problem);
      return;
    }
    run(
      () => (skill ? upsertSkillAction(input, skill.id) : upsertSkillAction(input)),
      () => onDone(skill ? `"${name}" kaydedildi.` : `"${name}" sözlüğe eklendi.`),
    );
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-label={skill ? `${skill.name} düzenleniyor` : "Yeni beceri"}
      className="rounded-2xl border border-line-strong bg-panel p-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Beceri" hint="CV'de görünen yazım. Ör: PixiJS">
          {(p) => (
            <input
              {...p}
              ref={nameRef}
              lang="en"
              maxLength={60}
              autoComplete="off"
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
            />
          )}
        </Field>

        <Field label="Diğer yazımlar" hint="Virgülle ayır. Ör: Pixi.js, pixi">
          {(p) => (
            <input
              {...p}
              lang="en"
              autoComplete="off"
              value={draft.aliases}
              onChange={(e) => set("aliases", e.target.value)}
              className={inputClass}
            />
          )}
        </Field>

        <Field label="Tür">
          {(p) => (
            <select
              {...p}
              value={draft.category}
              onChange={(e) => set("category", pick(SKILL_CATEGORY, e.target.value) || draft.category)}
              className={inputClass}
            >
              {SKILL_CATEGORY.map((c) => (
                <option key={c} value={c}>
                  {SKILL_CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Seviye">
          {(p) => (
            <select
              {...p}
              value={draft.proficiency}
              onChange={(e) => set("proficiency", pick(PROFICIENCY, e.target.value))}
              className={inputClass}
            >
              <option value="">Belirtilmedi</option>
              {PROFICIENCY.map((level) => (
                <option key={level} value={level}>
                  {PROFICIENCY_LABEL[level]}
                </option>
              ))}
            </select>
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
        <button type="button" onClick={onCancel} disabled={pending} className={`${buttonSecondary} disabled:opacity-60`}>
          İptal
        </button>
      </div>
    </form>
  );
}
