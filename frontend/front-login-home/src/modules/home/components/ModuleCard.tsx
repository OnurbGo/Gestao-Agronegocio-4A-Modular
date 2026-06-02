import {
  ArrowRight,
  Building2,
  Factory,
  Lock,
  Package,
  Scale,
  Settings,
  Sprout,
  Warehouse,
} from "lucide-react";

const MODULE_ICONS = {
  ESCRITORIO: Building2,
  BALANCA: Scale,
  SILO: Factory,
  BARRACAO: Warehouse,
  LAVOURA: Sprout,
  ALMOXARIFADO: Package,
};

const STATUS_STYLES = {
  allowed: "bg-emerald-50 text-emerald-800",
  development: "bg-amber-50 text-amber-800",
  blocked: "bg-red-50 text-red-700",
};

function ModuleCard({ module, allowed, unavailable, onOpen }) {
  const ModuleIcon = MODULE_ICONS[module.id] || Building2;
  const StatusIcon = allowed ? (unavailable ? Settings : ArrowRight) : Lock;
  const statusLabel = allowed
    ? unavailable
      ? "Em desenvolvimento"
      : module.status
    : "Sem acesso";
  const statusClassName = allowed
    ? unavailable
      ? STATUS_STYLES.development
      : STATUS_STYLES.allowed
    : STATUS_STYLES.blocked;

  return (
    <button
      className={`group flex min-h-52 flex-col rounded-lg border bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-7 ${
        allowed
          ? "border-emerald-100 hover:border-emerald-300"
          : "border-slate-200 opacity-75"
      }`}
      onClick={onOpen}
      type="button"
    >
      <span
        className={`inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold ${statusClassName}`}
      >
        <StatusIcon aria-hidden="true" className="h-3.5 w-3.5" />
        {statusLabel}
      </span>

      <span className="mt-5 flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-emerald-700 text-white transition group-hover:bg-emerald-800">
          <ModuleIcon aria-hidden="true" className="h-5 w-5" />
        </span>
        <strong className="min-w-0 text-xl font-bold leading-tight text-slate-950">
          {module.nome}
        </strong>
      </span>

      <span className="mt-5 block min-h-12 text-sm leading-6 text-slate-600">
        {module.descricao}
      </span>

      <div className="mt-auto pt-6">
        <small className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800">
          {unavailable && allowed ? "Em desenvolvimento" : "Abrir módulo"}
          {allowed && !unavailable ? (
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          ) : null}
        </small>
      </div>
    </button>
  );
}

export default ModuleCard;
