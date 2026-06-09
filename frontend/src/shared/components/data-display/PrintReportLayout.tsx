import type { ReactNode } from "react";

type PrintReportLayoutProps = {
  children: ReactNode;
  footer?: ReactNode;
};

function PrintReportLayout({ children, footer }: PrintReportLayoutProps) {
  return (
    <section className="print-only-report rounded-lg border border-emerald-100 bg-white p-4">
      {children}
      <footer className="report-footer mt-6 border-t border-slate-200 pt-3 text-center text-[11px] font-semibold text-slate-500">
        {footer || "Gestão Agronegócio 4A"}
      </footer>
    </section>
  );
}

export default PrintReportLayout;
