import type { ReactNode } from "react";
import { Home, ShieldAlert } from "lucide-react";

type AccessGateAction = {
  label: string;
  onClick: () => void;
};

type AccessGateProps = {
  title: ReactNode;
  message: ReactNode;
  action?: AccessGateAction;
};

function AccessGate({ title, message, action }: AccessGateProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f7f2] px-4 py-10 text-slate-900">
      <section className="w-full max-w-lg rounded-lg border border-emerald-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-800">
          <ShieldAlert aria-hidden="true" className="h-7 w-7" />
        </div>
        <span className="mt-5 block text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">
          Escritório
        </span>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">{title}</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">{message}</p>
        {action ? (
          <button
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800"
            onClick={action.onClick}
            type="button"
          >
            <Home aria-hidden="true" className="h-4 w-4" />
            {action.label}
          </button>
        ) : null}
      </section>
    </main>
  );
}

export default AccessGate;
