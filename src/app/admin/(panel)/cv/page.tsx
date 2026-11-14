import type { Metadata } from "next";
import { Suspense } from "react";
import { getMasterCv } from "@/server/data/cv";
import { listFacts } from "@/server/data/facts";
import CvEditor from "./CvEditor";

export const metadata: Metadata = { title: "Ana CV" };

export default function CvPage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">Ana CV</h1>
      <p className="mt-2 max-w-2xl text-mist">
        Tüm ilana özel CV&apos;ler bu CV&apos;den türetilir. Unvan, şirket, tarih, eğitim ve dil seviyesini yapay zekâ
        hiçbir zaman değiştiremez.
      </p>
      <Suspense fallback={<p className="mt-8 text-mist">Yükleniyor…</p>}>
        <CvEditorLoader />
      </Suspense>
    </main>
  );
}

async function CvEditorLoader() {
  // Both data functions call requireOwner()
  const [master, facts] = await Promise.all([getMasterCv(), listFacts()]);
  const factOptions = facts.map((f) => ({ id: f.id, statement: f.statement, context: f.context, confirmed: f.confirmed }));
  return <CvEditor initial={master?.content ?? null} updatedAt={master?.updatedAt ?? null} facts={factOptions} />;
}
