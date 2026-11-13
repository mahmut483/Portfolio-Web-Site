import type { Metadata } from "next";
import Image from "next/image";
import { Download } from "../components/icons";
import { pages, site } from "../lib/site";
import { pageMetadata } from "../lib/seo";
import { buttonPrimary, container } from "../lib/ui";

export const metadata: Metadata = pageMetadata({ path: "/cv", ...pages.cv });

export default function CvPage() {
  return (
    <main className={`${container} flex-1 pb-24 pt-24 sm:pb-32 sm:pt-28 flex flex-col items-center`}>
      <div className="w-full max-w-3xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em]">CV</h1>
          <a href={site.cv.pdf} download className={buttonPrimary}>
            <Download />
            Download PDF
          </a>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-[0_30px_80px_-30px_rgb(0_0_0/0.75)] ring-1 ring-line">
          <Image
            src={site.cv.image}
            width={site.cv.width}
            height={site.cv.height}
            alt={`${site.name}'s CV, one page`}
            sizes="(min-width: 1024px) 768px, 100vw"
            quality={90}
            loading="eager"
            fetchPriority="high"
            className="h-auto w-full"
          />
        </div>
      </div>
    </main>
  );
}
