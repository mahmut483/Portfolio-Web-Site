import Link from "next/link";
import { Suspense } from "react";
import { getMasterCv } from "@/server/data/cv";
import { factBankStats } from "@/server/data/facts";

// Only static chrome renders outside Suspense (it ends up in the prerendered shell, visible to anyone).
// Everything owner-specific is loaded inside <Dashboard>, whose data functions call requireOwner().
export default function AdminHomePage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-8 sm:py-14">
      <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">Yönetim Paneli</h1>
      <Suspense fallback={<p className="mt-10 text-mist">Yükleniyor…</p>}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

const card = "block rounded-2xl border border-line bg-panel p-5 transition-colors hover:border-line-strong";

async function Dashboard() {
  const [stats, master] = await Promise.all([factBankStats(), getMasterCv()]);

  return (
    <ul className="mt-10 grid gap-4 sm:grid-cols-2">
      <li>
        <Link href="/admin/facts" className={card}>
          <span className="font-display text-xl font-semibold">Bilgi Bankası</span>
          <p className="mt-2 text-sm text-mist">
            {stats.confirmed} onaylı, {stats.pending} onay bekleyen bilgi · {stats.absences} &quot;bende yok&quot; ·{" "}
            {stats.skills} beceri
          </p>
          {stats.pending > 0 ? (
            <p className="mt-3 text-sm text-ink">Onay bekleyen bilgiler yapay zekâ önerilerinde kullanılamaz.</p>
          ) : null}
        </Link>
      </li>
      <li>
        <Link href="/admin/cv" className={card}>
          <span className="font-display text-xl font-semibold">Ana CV</span>
          <p className="mt-2 text-sm text-mist">
            {master ? `Son kayıt: ${new Date(master.updatedAt).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "medium", timeStyle: "short" })}` : "Henüz kayıtlı değil"}
          </p>
        </Link>
      </li>
      {[
        { title: "İlanlar", note: "İlan analizi, eksikler raporu, öneriler" },
        { title: "CV'ler", note: "İlana özel CV geçmişi ve sabit CV listesi" },
      ].map((s) => (
        <li key={s.title} className="rounded-2xl border border-line p-5 opacity-70">
          <div className="flex items-center justify-between gap-3">
            <span className="font-display text-xl font-semibold">{s.title}</span>
            <span className="rounded-full border border-line-strong px-2.5 py-0.5 text-xs text-mist">Aşama 3–4</span>
          </div>
          <p className="mt-2 text-sm text-mist">{s.note}</p>
        </li>
      ))}
    </ul>
  );
}
