import Link from "next/link";
import PreviewVideo from "./components/PreviewVideo";
import { ArrowUpRight } from "./components/icons";
import JsonLd from "./components/JsonLd";
import { profilePageJsonLd } from "./lib/seo";
import { site, work } from "./lib/site";
import { container } from "./lib/ui";

export default function Home() {
  return (
    <main className={container}>
      <JsonLd data={profilePageJsonLd()} />
      <section className="pb-12 pt-28 sm:pb-16 sm:pt-36">
        <h1 className="text-center sm:text-left font-display text-[clamp(3.25rem,8.4vw,6.75rem)] font-semibold leading-[0.9] tracking-[-0.035em]">
          Mahmut <br className="lg:hidden" />
          Karaarslan
        </h1>
      </section>

      <section aria-labelledby="work-heading" className="pb-16 sm:pb-20">
        <h2 id="work-heading" className="text-center sm:text-left mb-6 font-display text-2xl font-semibold tracking-[-0.02em]">
          My Works
        </h2>

        <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 lg:grid-cols-4">
          {work.map((item) => (
            <li key={item.slug}>
              <Link href={`/${item.slug}`} className="group block rounded-[1.25rem] focus-visible:outline-offset-4">
                <div className="relative aspect-[9/16] overflow-hidden rounded-[1.25rem] bg-panel ring-1 ring-line transition-shadow duration-300 group-hover:ring-line-strong">
                  <PreviewVideo
                    src={item.preview}
                    poster={item.poster}
                    sizes="(min-width: 1280px) 296px, (min-width: 1024px) 23vw, 48vw"
                  />
                </div>
                <div className="mt-3.5 flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold leading-tight tracking-[-0.01em] sm:text-xl">
                    {item.title}
                  </h3>
                  <span className="hidden size-8 shrink-0 place-items-center rounded-full border border-line-strong text-mist transition-colors duration-300 group-hover:border-ink group-hover:bg-ink group-hover:text-night sm:grid">
                    <ArrowUpRight />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Short intro under the work grid */}
      <section className="pb-20 text-center sm:pb-28">
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-mist sm:text-xl">
          <span className="font-medium text-ink">{site.role}.</span> {site.intro}
        </p>
      </section>
    </main>
  );
}
