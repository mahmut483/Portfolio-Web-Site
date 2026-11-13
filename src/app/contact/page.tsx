import type { Metadata } from "next";
import CopyableField from "../components/CopyableField";
import { ArrowUpRight } from "../components/icons";
import { site } from "../lib/site";
import { container } from "../lib/ui";

export const metadata: Metadata = {
  title: "Contact",
};

const row = "grid min-h-16 grid-cols-[5rem_minmax(0,1fr)] items-center gap-4 py-3 sm:grid-cols-[9rem_minmax(0,1fr)]";

export default function ContactPage() {
  return (
    <main className={`${container} flex-1 pb-24 pt-28 sm:pb-32 sm:pt-36`}>
      <h1 className="text-center sm:text-left font-display text-6xl font-semibold tracking-[-0.035em] sm:text-7xl">
        Contact
      </h1>

      <div className="mt-12 grid gap-12 sm:mt-16 lg:grid-cols-2 lg:gap-16">
        <section aria-labelledby="details-heading">
          <h2 id="details-heading" className="text-center sm:text-left font-display text-2xl font-semibold tracking-[-0.02em]">
            Details
          </h2>
          <dl className="mt-4 divide-y divide-line border-y border-line">
            <CopyableField label="Email" value={site.email} rowClass={row} />
            <CopyableField label="Phone" value={site.phone} rowClass={row} />
            <div className={row}>
              <dt className="text-mist">Location</dt>
              <dd>{site.location}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="social-heading">
          <h2 id="social-heading" className="text-center sm:text-left font-display text-2xl font-semibold tracking-[-0.02em]">
            Social
          </h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {site.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener" className={`group ${row}`}>
                  <span className="text-mist">{s.label}</span>
                  <span className="flex min-w-0 items-center justify-between gap-3">
                    <span className="truncate">{s.display}</span>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line-strong text-mist transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-night">
                      <ArrowUpRight />
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
