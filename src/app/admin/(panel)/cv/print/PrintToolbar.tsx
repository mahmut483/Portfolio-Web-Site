"use client";

// Browser print -> "Save as PDF" gives a real text PDF (selectable, ATS-readable).
// Waits for web fonts first so Turkish characters (latin-ext subset loads on demand) are in place.
export default function PrintToolbar({ fileName }: { fileName: string }) {
  const print = async () => {
    await document.fonts.ready;
    const previous = document.title;
    document.title = fileName; // Chrome uses the title as the suggested PDF file name
    window.print();
    document.title = previous;
  };

  return (
    <div className="mb-6 rounded-2xl border border-line bg-panel p-5 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold">PDF olarak kaydet</p>
          <p className="mt-1 text-sm text-mist">
            Açılan pencerede Hedef: <strong className="text-ink">PDF olarak kaydet</strong>, Kenar boşlukları:{" "}
            <strong className="text-ink">Varsayılan</strong>, <strong className="text-ink">Üstbilgi ve altbilgi</strong>{" "}
            kapalı olsun.
          </p>
        </div>
        <button
          type="button"
          onClick={print}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-night transition-colors hover:bg-white"
        >
          Yazdır / PDF al
        </button>
      </div>
    </div>
  );
}
