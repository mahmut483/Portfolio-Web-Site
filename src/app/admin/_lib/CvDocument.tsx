import type { CvContent } from "./schema";
import { formatRange } from "./format";

// The ATS-friendly CV layout, shared by the editor preview and the print page.
// Rules (from Greenhouse/Workday parsing docs): one column, standard section headings, contact
// details as plain body text (not a header/footer), no photo, icons or tables, "Mon YYYY" dates,
// and ligatures off so text extracts letter by letter. No hooks: works in server and client trees.

// [font-family:inherit]: globals.css gives h1-h3 the site's display font; the CV uses one typeface
const H2 = "[font-family:inherit] mt-[11pt] mb-[4pt] border-b border-black/70 pb-[2pt] text-[10.5pt] font-bold uppercase tracking-[0.06em]";

function Bullets({ items }: { items: { id: string; text: string }[] }) {
  const visible = items.filter((b) => b.text.trim());
  if (!visible.length) return null;
  return (
    <ul className="mt-[2pt] list-disc space-y-[1.5pt] pl-[14pt]">
      {visible.map((b) => (
        <li key={b.id}>{b.text}</li>
      ))}
    </ul>
  );
}

function linkText(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

// Only absolute http(s) URLs become links; anything else prints as plain text
function LinkOrText({ url, label }: { url: string; label?: string }) {
  const text = url ? linkText(url) : (label ?? "");
  return /^https?:\/\/\S+$/i.test(url) ? <a href={url}>{text}</a> : <>{text}</>;
}

export default function CvDocument({ cv }: { cv: CvContent }) {
  const { profile } = cv;
  const contact = [profile.location, profile.email, profile.phone].filter(Boolean);
  const links = profile.links.filter((l) => l.url.trim() || l.label.trim());

  return (
    // lang="en": the admin panel is lang="tr", and Turkish casing would print "EXPERİENCE"
    <article
      lang="en"
      className="cv-document bg-white px-[16mm] py-[14mm] text-[10pt] leading-[1.38] text-black print:p-0"
      style={{ fontFamily: "var(--font-inter), Arial, sans-serif", fontVariantLigatures: "none" }}
    >
      <header>
        <h1 className="[font-family:inherit] text-[19pt] font-bold leading-tight">{profile.name}</h1>
        {profile.headline ? <p className="mt-[1pt] text-[11pt] font-semibold">{profile.headline}</p> : null}
        {contact.length || links.length ? (
          <p className="mt-[3pt]">
            {contact.join(" | ")}
            {links.map((l, i) => (
              <span key={i}>
                {contact.length || i > 0 ? " | " : ""}
                <LinkOrText url={l.url} label={l.label} />
              </span>
            ))}
          </p>
        ) : null}
      </header>

      {cv.summary.trim() ? (
        <section>
          <h2 className={H2}>Summary</h2>
          <p>{cv.summary}</p>
        </section>
      ) : null}

      {cv.experience.length ? (
        <section>
          <h2 className={H2}>Experience</h2>
          {cv.experience.map((e) => (
            <div key={e.id} className="mt-[5pt] break-inside-avoid">
              <p>
                <strong>{e.title}</strong>
                {e.company ? ` | ${e.company}` : ""}
                {e.location ? ` | ${e.location}` : ""}
                {` | ${formatRange(e.start, e.end)}`}
              </p>
              <Bullets items={e.bullets} />
            </div>
          ))}
        </section>
      ) : null}

      {cv.projects.length ? (
        <section>
          <h2 className={H2}>Projects</h2>
          {cv.projects.map((p) => {
            const range = formatRange(p.start, p.end, false);
            return (
              <div key={p.id} className="mt-[5pt] break-inside-avoid">
                <p>
                  <strong>{p.name}</strong>
                  {p.context ? ` | ${p.context}` : ""}
                  {range ? ` | ${range}` : ""}
                  {p.link ? (
                    <>
                      {" | "}
                      <LinkOrText url={p.link} />
                    </>
                  ) : null}
                </p>
                <Bullets items={p.bullets} />
              </div>
            );
          })}
        </section>
      ) : null}

      {cv.skills.some((g) => g.items.length) ? (
        <section>
          <h2 className={H2}>Skills</h2>
          {cv.skills
            .filter((g) => g.items.length)
            .map((g) => (
              <p key={g.id} className="mt-[1.5pt]">
                <strong>{g.label}:</strong> {g.items.join(", ")}
              </p>
            ))}
        </section>
      ) : null}

      {cv.education.length ? (
        <section>
          <h2 className={H2}>Education</h2>
          {cv.education.map((ed) => {
            const range = formatRange(ed.start, ed.end, false);
            return (
              <div key={ed.id} className="mt-[4pt] break-inside-avoid">
                <p>
                  <strong>{ed.degree}</strong>
                  {ed.school ? ` | ${ed.school}` : ""}
                  {range ? ` | ${range}` : ""}
                </p>
                {ed.details ? <p>{ed.details}</p> : null}
              </div>
            );
          })}
        </section>
      ) : null}

      {cv.languages.length ? (
        <section>
          <h2 className={H2}>Languages</h2>
          <p>{cv.languages.map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join(", ")}</p>
        </section>
      ) : null}
    </article>
  );
}
