import type { FormEvent } from "react";
import FormErrorAlert from "@/shared/components/feedback/FormErrorAlert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import type { Entidade, EntidadeFormData } from "@/shared/types";
import { formatCpfCnpj, formatPhone, tipoOptions } from "../helpers";

type EntidadeFormProps = {
  form: EntidadeFormData;
  loading: boolean;
  errorMessage?: string | null;
  selected?: Entidade;
  selectedId: number | null;
  onFieldChange: (field: keyof EntidadeFormData, value: string) => void;
  onRemove: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleTipo: (tipo: string) => void;
};

function Field({ children, className = "", label }) {
  return (
    <label className={`grid gap-1.5 text-sm font-bold text-slate-700 ${className}`}>
      {label}
      {children}
    </label>
  );
}

function EntidadeForm({
  errorMessage,
  form,
  loading,
  selected,
  selectedId,
  onFieldChange,
  onRemove,
  onSubmit,
  onToggleTipo,
}: EntidadeFormProps) {
  return (
    <Card className="border-emerald-100">
      <CardHeader>
        <CardTitle>{selected ? selected.nome : "Novo cadastro"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="md:col-span-2">
            <FormErrorAlert message={errorMessage} />
          </div>
          <Field label="Nome">
            <Input
              onChange={(event) => onFieldChange("nome", event.target.value)}
              required
              value={form.nome}
            />
          </Field>
          <Field label="CPF/CNPJ">
            <Input
              inputMode="numeric"
              maxLength={18}
              onChange={(event) =>
                onFieldChange("cpf_cnpj", formatCpfCnpj(event.target.value))
              }
              required
              value={form.cpf_cnpj}
            />
          </Field>
          <Field label="Tipo pessoa">
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
              onChange={(event) => onFieldChange("tipo_pessoa", event.target.value)}
              value={form.tipo_pessoa}
            >
              <option value="FISICA">Física</option>
              <option value="JURIDICA">Jurídica</option>
            </select>
          </Field>
          <Field label="E-mail">
            <Input
              onChange={(event) => onFieldChange("email", event.target.value)}
              type="email"
              value={form.email}
            />
          </Field>
          <Field label="Telefone">
            <Input
              inputMode="numeric"
              maxLength={15}
              onChange={(event) =>
                onFieldChange("telefone", formatPhone(event.target.value))
              }
              value={form.telefone}
            />
          </Field>
          <Field label="Celular">
            <Input
              inputMode="numeric"
              maxLength={15}
              onChange={(event) =>
                onFieldChange("celular", formatPhone(event.target.value))
              }
              value={form.celular}
            />
          </Field>
          <Field label="Cidade">
            <Input
              onChange={(event) => onFieldChange("cidade", event.target.value)}
              value={form.cidade}
            />
          </Field>
          <Field label="UF">
            <Input
              maxLength={2}
              onChange={(event) => onFieldChange("estado", event.target.value)}
              value={form.estado}
            />
          </Field>
          <Field label="Admissão">
            <Input
              onChange={(event) =>
                onFieldChange("data_admissao", event.target.value)
              }
              type="date"
              value={form.data_admissao}
            />
          </Field>
          <Field className="md:col-span-2" label="Observação">
            <Textarea
              onChange={(event) => onFieldChange("observacao", event.target.value)}
              value={form.observacao}
            />
          </Field>

          <div className="grid gap-2 md:col-span-2 sm:grid-cols-2 lg:grid-cols-4">
            {tipoOptions.map((tipo) => (
              <label
                className="flex min-h-10 items-center gap-2 rounded-md border border-emerald-100 bg-emerald-50/40 px-3 text-sm font-bold text-slate-700"
                key={tipo}
              >
                <Checkbox
                  checked={form.tipos.includes(tipo)}
                  onCheckedChange={() => onToggleTipo(tipo)}
                />
                {tipo}
              </label>
            ))}
          </div>

          <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
            {selectedId ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={loading} type="button" variant="destructive">
                    Remover
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação vai remover o cadastro selecionado. Essa ação não
                      pode ser desfeita pela tela.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                      <Button type="button" variant="outline">
                        Cancelar
                      </Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button
                        disabled={loading}
                        onClick={onRemove}
                        type="button"
                        variant="destructive"
                      >
                        Remover
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
            <Button disabled={loading} type="submit">
              Salvar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default EntidadeForm;
