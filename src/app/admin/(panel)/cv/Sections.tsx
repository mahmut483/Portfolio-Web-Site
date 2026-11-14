import { useState } from "react";
import { newId } from "../../_lib/format";
import type { CvContent, Education, Experience, Language, Project, SkillGroup } from "../../_lib/schema";
import BulletList from "./BulletList";
import {
  AddButton,
  Empty,
  ItemCard,
  ItemControls,
  LintedTextArea,
  MonthField,
  Note,
  Section,
  TextField,
  confirmRemove,
  moveItem,
  removeAt,
  replaceAt,
  type FactOption,
} from "./Fields";

// Limits mirror cvContentSchema; the server checks them again.

type Profile = CvContent["profile"];
type ListProps<T> = { items: T[]; onChange: (next: T[]) => void };

const orNull = (value: string) => value || null;

// ── Profile ──────────────────────────────────────────────────────────────────

export function ProfileSection({ profile, onChange }: { profile: Profile; onChange: (next: Profile) => void }) {
  const set = (patch: Partial<Profile>) => onChange({ ...profile, ...patch });
  const { links } = profile;

  return (
    <Section title="Profil" en="Header">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Ad soyad" value={profile.name} onChange={(name) => set({ name })} maxLength={80} autoComplete="name" />
        <TextField
          label="Başlık"
          value={profile.headline}
          onChange={(headline) => set({ headline })}
          maxLength={120}
          placeholder="Game Artist"
        />
        <TextField
          label="Konum"
          value={profile.location}
          onChange={(location) => set({ location })}
          maxLength={80}
          placeholder="Istanbul, Türkiye"
        />
        <TextField
          label="E-posta"
          type="email"
          value={profile.email}
          onChange={(email) => set({ email })}
          maxLength={120}
          autoComplete="email"
        />
        <TextField
          label="Telefon"
          type="tel"
          value={profile.phone}
          onChange={(phone) => set({ phone })}
          maxLength={40}
          autoComplete="tel"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-mist">Bağlantılar</h3>
        <p className="text-xs text-mist">CV&apos;de adres yazılır; etiket sadece adres boşsa görünür.</p>
        {links.length ? (
          <ul className="space-y-3">
            {links.map((link, i) => (
              <li key={i} className="flex flex-wrap items-end gap-2 sm:flex-nowrap">
                <TextField
                  className="w-full sm:w-40 sm:shrink-0"
                  label={
                    <>
                      Etiket<span className="sr-only"> ({i + 1}. bağlantı)</span>
                    </>
                  }
                  value={link.label}
                  onChange={(label) => set({ links: replaceAt(links, i, { ...link, label }) })}
                  maxLength={40}
                  placeholder="Portfolio"
                />
                <TextField
                  className="min-w-0 flex-1"
                  type="url"
                  label={
                    <>
                      Adres<span className="sr-only"> ({i + 1}. bağlantı)</span>
                    </>
                  }
                  value={link.url}
                  onChange={(url) => set({ links: replaceAt(links, i, { ...link, url }) })}
                  maxLength={200}
                  placeholder="https://"
                />
                <div className="pb-1.5">
                  <ItemControls
                    index={i}
                    count={links.length}
                    name={`${i + 1}. bağlantıyı`}
                    onMove={(delta) => set({ links: moveItem(links, i, delta) })}
                    onRemove={() => {
                      if (confirmRemove("Bu bağlantı silinsin mi?", Boolean(link.label || link.url))) {
                        set({ links: removeAt(links, i) });
                      }
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        <AddButton onClick={() => set({ links: [...links, { label: "", url: "" }] })} count={links.length} max={6}>
          Bağlantı ekle
        </AddButton>
      </div>
    </Section>
  );
}

// ── Summary ──────────────────────────────────────────────────────────────────

export function SummarySection({ summary, onChange }: { summary: string; onChange: (next: string) => void }) {
  return (
    <Section title="Özet" en="Summary">
      <LintedTextArea label="Özet metni" value={summary} onChange={onChange} maxChars={600} maxLength={1200} rows={5} />
      <Note>Yapay zekâ bu bölümü yeniden yazamaz; sadece kanıtlı bir terim ekleyebilir.</Note>
    </Section>
  );
}

// ── Experience ───────────────────────────────────────────────────────────────

export function ExperienceSection({ items, onChange, facts }: ListProps<Experience> & { facts: FactOption[] }) {
  const add = () =>
    onChange([
      ...items,
      { id: newId("e_"), title: "", company: "", location: "", start: "", end: null, bullets: [] },
    ]);

  return (
    <Section title="Deneyim" en="Experience" meta={`${items.length} rol`}>
      {items.length ? (
        <ol className="space-y-4">
          {items.map((item, i) => (
            <ExperienceItem
              key={item.id}
              item={item}
              index={i}
              count={items.length}
              facts={facts}
              onChange={(next) => onChange(replaceAt(items, i, next))}
              onMove={(delta) => onChange(moveItem(items, i, delta))}
              onRemove={() => {
                const hasContent = Boolean(item.title || item.company || item.bullets.length);
                if (confirmRemove("Bu deneyim ve maddeleri silinsin mi?", hasContent)) onChange(removeAt(items, i));
              }}
            />
          ))}
        </ol>
      ) : (
        <Empty>Henüz deneyim yok.</Empty>
      )}
      <AddButton onClick={add} count={items.length} max={15}>
        Deneyim ekle
      </AddButton>
    </Section>
  );
}

type ItemProps<T> = {
  item: T;
  index: number;
  count: number;
  onChange: (next: T) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
};

function ExperienceItem({ item, index, count, facts, onChange, onMove, onRemove }: ItemProps<Experience> & { facts: FactOption[] }) {
  const set = (patch: Partial<Experience>) => onChange({ ...item, ...patch });
  const ongoing = item.end === null;
  const owner = `Deneyim ${index + 1}`;

  return (
    <ItemCard
      heading={
        <>
          {index + 1}. {item.title || "Yeni rol"}
          {item.company ? <span className="font-normal text-mist"> · {item.company}</span> : null}
        </>
      }
      controls={<ItemControls index={index} count={count} name={`${index + 1}. deneyimi`} onMove={onMove} onRemove={onRemove} />}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Unvan" value={item.title} onChange={(title) => set({ title })} maxLength={100} />
        <TextField label="Şirket" value={item.company} onChange={(company) => set({ company })} maxLength={100} />
        <TextField
          className="sm:col-span-2"
          label="Konum"
          value={item.location}
          onChange={(location) => set({ location })}
          maxLength={80}
          placeholder="Istanbul, Türkiye ya da Remote"
        />
        <MonthField label="Başlangıç" required value={item.start} onChange={(start) => set({ start })} />
        <div>
          <MonthField label="Bitiş" value={item.end} disabled={ongoing} onChange={(end) => set({ end })} />
          <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs text-mist">
            <input
              type="checkbox"
              checked={ongoing}
              onChange={(e) => set({ end: e.target.checked ? null : "" })}
              className="accent-ink"
            />
            Devam ediyor
          </label>
        </div>
      </div>
      <BulletList
        bullets={item.bullets}
        onChange={(bullets) => set({ bullets })}
        max={12}
        facts={facts}
        owner={owner}
      />
    </ItemCard>
  );
}

// ── Projects ─────────────────────────────────────────────────────────────────

export function ProjectsSection({ items, onChange, facts }: ListProps<Project> & { facts: FactOption[] }) {
  const add = () =>
    onChange([...items, { id: newId("p_"), name: "", context: "", start: null, end: null, link: "", bullets: [] }]);

  return (
    <Section title="Projeler" en="Projects" meta={`${items.length} proje`}>
      {items.length ? (
        <ol className="space-y-4">
          {items.map((item, i) => (
            <ProjectItem
              key={item.id}
              item={item}
              index={i}
              count={items.length}
              facts={facts}
              onChange={(next) => onChange(replaceAt(items, i, next))}
              onMove={(delta) => onChange(moveItem(items, i, delta))}
              onRemove={() => {
                const hasContent = Boolean(item.name || item.context || item.bullets.length);
                if (confirmRemove("Bu proje ve maddeleri silinsin mi?", hasContent)) onChange(removeAt(items, i));
              }}
            />
          ))}
        </ol>
      ) : (
        <Empty>Henüz proje yok.</Empty>
      )}
      <AddButton onClick={add} count={items.length} max={15}>
        Proje ekle
      </AddButton>
    </Section>
  );
}

function ProjectItem({ item, index, count, facts, onChange, onMove, onRemove }: ItemProps<Project> & { facts: FactOption[] }) {
  const set = (patch: Partial<Project>) => onChange({ ...item, ...patch });

  return (
    <ItemCard
      heading={
        <>
          {index + 1}. {item.name || "Yeni proje"}
          {item.context ? <span className="font-normal text-mist"> · {item.context}</span> : null}
        </>
      }
      controls={<ItemControls index={index} count={count} name={`${index + 1}. projeyi`} onMove={onMove} onRemove={onRemove} />}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Proje adı" value={item.name} onChange={(name) => set({ name })} maxLength={100} />
        <TextField
          label="Bağlam"
          value={item.context}
          onChange={(context) => set({ context })}
          maxLength={120}
          placeholder="Personal project"
        />
        <MonthField label="Başlangıç" value={item.start} onChange={(v) => set({ start: orNull(v) })} />
        <MonthField label="Bitiş" value={item.end} onChange={(v) => set({ end: orNull(v) })} />
        <TextField
          className="sm:col-span-2"
          type="url"
          label="Bağlantı"
          value={item.link}
          onChange={(link) => set({ link })}
          maxLength={200}
          placeholder="https://"
        />
      </div>
      <BulletList
        bullets={item.bullets}
        onChange={(bullets) => set({ bullets })}
        max={10}
        facts={facts}
        owner={`Proje ${index + 1}`}
      />
    </ItemCard>
  );
}

// ── Skills ───────────────────────────────────────────────────────────────────

export function SkillsSection({ items, onChange }: ListProps<SkillGroup>) {
  const add = () => onChange([...items, { id: newId("s_"), label: "", items: [] }]);

  return (
    <Section title="Beceriler" en="Skills" meta={`${items.length} grup`}>
      {items.length ? (
        <ol className="space-y-4">
          {items.map((item, i) => (
            <SkillGroupItem
              key={item.id}
              item={item}
              index={i}
              count={items.length}
              onChange={(next) => onChange(replaceAt(items, i, next))}
              onMove={(delta) => onChange(moveItem(items, i, delta))}
              onRemove={() => {
                const hasContent = Boolean(item.label || item.items.length);
                if (confirmRemove("Bu beceri grubu silinsin mi?", hasContent)) onChange(removeAt(items, i));
              }}
            />
          ))}
        </ol>
      ) : (
        <Empty>Henüz beceri grubu yok.</Empty>
      )}
      <AddButton onClick={add} count={items.length} max={10}>
        Grup ekle
      </AddButton>
    </Section>
  );
}

const splitItems = (text: string) =>
  text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

function SkillGroupItem({ item, index, count, onChange, onMove, onRemove }: ItemProps<SkillGroup>) {
  // The typed text is kept as is (so commas and spaces can be typed); the array is derived from it.
  const [draft, setDraft] = useState(() => item.items.join(", "));

  return (
    <ItemCard
      heading={
        <>
          {index + 1}. {item.label || "Yeni grup"}
        </>
      }
      controls={<ItemControls index={index} count={count} name={`${index + 1}. grubu`} onMove={onMove} onRemove={onRemove} />}
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
        <TextField
          label="Grup adı"
          value={item.label}
          onChange={(label) => onChange({ ...item, label })}
          maxLength={60}
          placeholder="Tools"
        />
        <TextField
          label="Öğeler (virgülle ayır)"
          value={draft}
          onChange={(text) => {
            setDraft(text);
            onChange({ ...item, items: splitItems(text) });
          }}
          maxLength={2400}
          placeholder="Unity, Spine, After Effects"
        />
      </div>
      <p className="mt-2 text-xs text-mist">{item.items.length} öğe</p>
    </ItemCard>
  );
}

// ── Education ────────────────────────────────────────────────────────────────

export function EducationSection({ items, onChange }: ListProps<Education>) {
  const add = () =>
    onChange([...items, { id: newId("ed_"), school: "", degree: "", start: null, end: null, details: "" }]);

  return (
    <Section title="Eğitim" en="Education" meta={`${items.length} kayıt`}>
      {items.length ? (
        <ol className="space-y-4">
          {items.map((item, i) => (
            <EducationItem
              key={item.id}
              item={item}
              index={i}
              count={items.length}
              onChange={(next) => onChange(replaceAt(items, i, next))}
              onMove={(delta) => onChange(moveItem(items, i, delta))}
              onRemove={() => {
                const hasContent = Boolean(item.school || item.degree || item.details);
                if (confirmRemove("Bu eğitim kaydı silinsin mi?", hasContent)) onChange(removeAt(items, i));
              }}
            />
          ))}
        </ol>
      ) : (
        <Empty>Henüz eğitim kaydı yok.</Empty>
      )}
      <AddButton onClick={add} count={items.length} max={6}>
        Eğitim ekle
      </AddButton>
    </Section>
  );
}

function EducationItem({ item, index, count, onChange, onMove, onRemove }: ItemProps<Education>) {
  const set = (patch: Partial<Education>) => onChange({ ...item, ...patch });

  return (
    <ItemCard
      heading={
        <>
          {index + 1}. {item.degree || item.school || "Yeni eğitim"}
        </>
      }
      controls={<ItemControls index={index} count={count} name={`${index + 1}. eğitimi`} onMove={onMove} onRemove={onRemove} />}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Okul" value={item.school} onChange={(school) => set({ school })} maxLength={120} />
        <TextField label="Bölüm / derece" value={item.degree} onChange={(degree) => set({ degree })} maxLength={120} />
        <MonthField label="Başlangıç" value={item.start} onChange={(v) => set({ start: orNull(v) })} />
        <MonthField label="Bitiş" value={item.end} onChange={(v) => set({ end: orNull(v) })} />
        <TextField
          className="sm:col-span-2"
          label="Detay"
          value={item.details}
          onChange={(details) => set({ details })}
          maxLength={160}
          placeholder="GPA: 3.46 / 4.00"
        />
      </div>
    </ItemCard>
  );
}

// ── Languages ────────────────────────────────────────────────────────────────

export function LanguagesSection({ items, onChange }: ListProps<Language>) {
  const add = () => onChange([...items, { id: newId("l_"), name: "", level: "" }]);

  return (
    <Section title="Diller" en="Languages" meta={`${items.length} dil`}>
      <Note>Dil seviyeni yapay zekâ asla değiştiremez.</Note>
      {items.length ? (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={item.id} className="flex flex-wrap items-end gap-2 sm:flex-nowrap">
              <TextField
                className="min-w-0 flex-1"
                label={
                  <>
                    Dil<span className="sr-only"> ({i + 1})</span>
                  </>
                }
                value={item.name}
                onChange={(name) => onChange(replaceAt(items, i, { ...item, name }))}
                maxLength={40}
                placeholder="Turkish"
              />
              <TextField
                className="min-w-0 flex-1"
                label={
                  <>
                    Seviye<span className="sr-only"> ({i + 1}. dil)</span>
                  </>
                }
                value={item.level}
                onChange={(level) => onChange(replaceAt(items, i, { ...item, level }))}
                maxLength={60}
                placeholder="Native"
              />
              <div className="pb-1.5">
                <ItemControls
                  index={i}
                  count={items.length}
                  name={`${i + 1}. dili`}
                  onMove={(delta) => onChange(moveItem(items, i, delta))}
                  onRemove={() => {
                    if (confirmRemove("Bu dil silinsin mi?", Boolean(item.name || item.level))) {
                      onChange(removeAt(items, i));
                    }
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Henüz dil yok.</Empty>
      )}
      <AddButton onClick={add} count={items.length} max={8}>
        Dil ekle
      </AddButton>
    </Section>
  );
}
