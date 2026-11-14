import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getMasterCv } from "@/server/data/cv";
import CvDocument from "../../../_lib/CvDocument";
import PrintToolbar from "./PrintToolbar";

export const metadata: Metadata = { title: "CV yazdır" };

// A4 page for Chrome's "Save as PDF". Only static chrome is outside Suspense.
export default function CvPrintPage() {
  return (
    <main className="mx-auto w-full max-w-[230mm] flex-1 px-4 py-8 print:max-w-none print:p-0">
      <style>{`
        @page { size: A4; margin: 14mm 16mm; }
        @media print {
          html, body { background: #fff !important; }
          .cv-document { padding: 0 !important; }
        }
      `}</style>
      <Suspense fallback={<p className="text-mist">Yükleniyor…</p>}>
        <PrintableCv />
      </Suspense>
    </main>
  );
}

async function PrintableCv() {
  const master = await getMasterCv(); // calls requireOwner()
  if (!master) {
    return (
      <p className="text-mist">
        Henüz kayıtlı bir Ana CV yok.{" "}
        <Link href="/admin/cv" className="text-ink underline">
          Ana CV
        </Link>{" "}
        sayfasından oluşturup kaydet.
      </p>
    );
  }
  const fileName = `${master.content.profile.name || "CV"} CV`.replace(/\s+/g, "_");
  return (
    <>
      <PrintToolbar fileName={fileName} />
      <div className="shadow-[0_20px_60px_-20px_rgb(0_0_0/0.7)] print:shadow-none">
        <CvDocument cv={master.content} />
      </div>
    </>
  );
}
