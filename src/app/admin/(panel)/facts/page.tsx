import type { Metadata } from "next";
import { Suspense } from "react";
import { listAbsences, listFacts, listSkills } from "@/server/data/facts";
import FactBank from "./FactBank";

export const metadata: Metadata = { title: "Bilgi Bankası" };

export default function FactsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">Bilgi Bankası</h1>
      <p className="mt-2 max-w-2xl text-mist">
        Yapay zekâ sadece burada <strong className="text-ink">onayladığın</strong> bilgileri kullanabilir. &quot;Bende
        yok&quot; listesindekileri asla CV&apos;ye ekleyemez.
      </p>
      <Suspense fallback={<p className="mt-8 text-mist">Yükleniyor…</p>}>
        <FactBankLoader />
      </Suspense>
    </main>
  );
}

async function FactBankLoader() {
  // Each data function calls requireOwner()
  const [facts, absences, skills] = await Promise.all([listFacts(), listAbsences(), listSkills()]);
  return <FactBank facts={facts} absences={absences} skills={skills} />;
}
