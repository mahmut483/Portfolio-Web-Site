import Link from "next/link";
import { ChevronLeft } from "./icons";
import { getWork, type WorkSlug } from "../lib/site";

export default function WorkHeader({ slug }: { slug: WorkSlug }) {
  const item = getWork(slug);
  return (
    <div className="mb-8 sm:mb-12 flex flex-col items-center sm:items-start text-center sm:text-left">
      <Link
        href="/"
        className="inline-flex items-center gap-1 rounded-full border border-line-strong py-1.5 pl-2 pr-3.5 text-sm font-medium text-mist transition-colors hover:bg-raised hover:text-ink"
      >
        <ChevronLeft />
        All works
      </Link>
      <h1 className="mt-6 font-display text-5xl font-semibold tracking-[-0.035em] sm:text-6xl">{item.title}</h1>
    </div>
  );
}
