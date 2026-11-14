import type { Metadata } from "next";
import LoginButton from "./LoginButton";

export const metadata: Metadata = {
  title: "Giriş",
};

export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-semibold tracking-[-0.03em]">Yönetim Paneli</h1>
      <p className="mt-3 mb-10 max-w-sm text-mist">Bu alan sadece site sahibine açık.</p>
      <LoginButton />
    </main>
  );
}
