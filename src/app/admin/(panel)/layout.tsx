import AdminNav from "./AdminNav";

// Panel chrome (navigation). No auth check here on purpose: layouts don't protect their pages.
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
