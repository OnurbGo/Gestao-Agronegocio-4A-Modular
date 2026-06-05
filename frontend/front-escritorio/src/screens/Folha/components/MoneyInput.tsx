import { cn } from "@/utils/cn";

type MoneyInputProps = {
  className?: string;
  disabled?: boolean;
  value: string | number;
  onChange: (value: string) => void;
};

function MoneyInput({
  className,
  disabled = false,
  value,
  onChange,
}: MoneyInputProps) {
  return (
    <input
      className={cn(
        "h-9 w-24 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      disabled={disabled}
      min="0"
      onChange={(event) => onChange(event.target.value)}
      step="0.01"
      type="number"
      value={value}
    />
  );
}

export default MoneyInput;
