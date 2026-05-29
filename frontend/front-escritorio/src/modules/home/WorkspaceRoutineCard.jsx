import { ArrowRight } from "lucide-react";

function WorkspaceRoutineCard({ card, onOpen }) {
  const Icon = card.icon;

  return (
    <button
      className="group grid min-h-[12rem] gap-4 rounded-lg border border-emerald-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
      onClick={onOpen}
      type="button"
    >
      <span className="flex min-w-0 items-center gap-4">
        <span className="grid h-10 w-10 mt-3 shrink-0 place-items-center rounded-md bg-emerald-700 text-white transition group-hover:bg-emerald-800">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <strong className="min-w-0 text-xl font-bold leading-tight text-slate-950">
          {card.title}
        </strong>
      </span>

      <small className="mt-4 text-sm leading-7 text-slate-600">
        {card.description}
      </small>

      <div className="mt-auto pb-8">
        <span className="inline-flex items-center gap-2 text-base font-bold text-emerald-800">
          Abrir
          <ArrowRight aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
    </button>
  );
}

export default WorkspaceRoutineCard;
