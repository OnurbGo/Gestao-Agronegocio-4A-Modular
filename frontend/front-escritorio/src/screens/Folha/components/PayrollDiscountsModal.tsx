import Modal from "@/components/layout/Modal";
import MoneyInput from "./MoneyInput";
import type { PayrollEditableField, PayrollLine } from "@/types";
import { descontoCampos, dinheiro, totalDescontos } from "../helpers";

type PayrollDiscountsModalProps = {
  linha?: PayrollLine | null;
  onChange: (
    mes: number,
    campo: PayrollEditableField,
    valor: string,
  ) => void;
  onClose: () => void;
};

function PayrollDiscountsModal({
  linha,
  onChange,
  onClose,
}: PayrollDiscountsModalProps) {
  if (!linha) {
    return null;
  }

  return (
    <Modal onClose={onClose} title={`Descontos - mês ${linha.mes}`}>
      <div className="grid gap-4">
        {descontoCampos.map((item) => (
          <label
            className="grid gap-1.5 text-sm font-bold text-slate-700"
            key={item.campo}
          >
            {item.label}
            <MoneyInput
              className="w-full"
              onChange={(value) => onChange(linha.mes, item.campo, value)}
              value={linha[item.campo]}
            />
          </label>
        ))}
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
          <span className="text-xs font-black uppercase text-slate-500">
            Total de descontos manuais
          </span>
          <strong className="mt-1 block text-xl text-slate-950">
            {dinheiro(totalDescontos(linha))}
          </strong>
        </div>
      </div>
    </Modal>
  );
}

export default PayrollDiscountsModal;
