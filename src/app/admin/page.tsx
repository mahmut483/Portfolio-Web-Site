import { Suspense } from "react";
import { requireOwner } from "@/server/auth";
import { signOutAction } from "./actions";

// Only static chrome renders outside Suspense (it ends up in the prerendered shell, visible to anyone).
// Everything owner-specific sits in <Dashboard>, after requireOwner().
export default function AdminHomePage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-8 sm:py-14">
      <Suspense fallback={<p className="text-mist">Yükleniyor…</p>}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

const sections = [
  { title: "Bilgi Bankası", note: "Onayladığın bilgiler, \"bende yok\" listesi, beceri sözlüğü" },
  { title: "Ana CV", note: "Yapılandırılmış CV, düzenleme ve PDF" },
  { title: "İlanlar", note: "İlan analizi, eksikler raporu, öneriler" },
  { title: "CV'ler", note: "İlana özel CV geçmişi ve sabit CV listesi" },
];

async function Dashboard() {
  await requireOwner();

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">Yönetim Paneli</h1>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-full border border-line-strong px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-raised"
          >
            Çıkış yap
          </button>
        </form>
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <li key={s.title} className="rounded-2xl border border-line bg-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-display text-xl font-semibold">{s.title}</span>
              <span className="rounded-full border border-line-strong px-2.5 py-0.5 text-xs text-mist">Yakında</span>
            </div>
            <p className="mt-2 text-sm text-mist">{s.note}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
