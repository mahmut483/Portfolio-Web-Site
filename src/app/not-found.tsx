import Link from "next/link";
import { buttonPrimary, container } from "./lib/ui";

export default function NotFound() {
  return (
    <main className={`${container} flex flex-1 flex-col items-start justify-center pb-24 pt-36`}>
      <h1 className="font-display text-5xl font-semibold tracking-[-0.045em] sm:text-6xl">Page not found</h1>
      <p className="mt-4 max-w-md text-lg text-mist">The address may be mistyped, or the page has moved.</p>
      <Link href="/" className={`${buttonPrimary} mt-8`}>
        Go to home
      </Link>
    </main>
  );
}
