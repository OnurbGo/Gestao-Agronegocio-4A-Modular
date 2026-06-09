import type { FormEvent } from "react";
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
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import type { EntidadeResumo, Imovel, ImovelFormData } from "@/shared/types";
import {
  mascaraIncra,
  mascaraMatricula,
  mascaraNirf,
} from "../helpers";
import ProprietariosPicker from "./ProprietariosPicker";

type ImovelFormProps = {
  areaAlq: string;
  entidadesFiltradas: EntidadeResumo[];
  entidadesSelecionadas: EntidadeResumo[];
  form: ImovelFormData;
  loading: boolean;
  proprietarioTermo: string;
  selected?: Imovel;
  selectedId: number | null;
  onFieldChange: (field: keyof ImovelFormData, value: string) => void;
  onProprietarioRemove: (id: number) => void;
  onProprietarioSearchChange: (value: string) => void;
  onProprietarioSelect: (id: number) => void;
  onRemove: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function Field({ children, className = "", label }) {
  return (
    <label className={`grid gap-1.5 text-sm font-bold text-slate-700 ${className}`}>
      {label}
      {children}
    </label>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 className="border-t border-emerald-100 pt-3 text-xs font-black uppercase tracking-wide text-slate-600 md:col-span-2">
      {children}
    </h3>
  );
}

function ImovelForm({
  areaAlq,
  entidadesFiltradas,
  entidadesSelecionadas,
  form,
  loading,
  proprietarioTermo,
  selected,
  selectedId,
  onFieldChange,
  onProprietarioRemove,
  onProprietarioSearchChange,
  onProprietarioSelect,
  onRemove,
  onSubmit,
}: ImovelFormProps) {
  return (
    <Card className="border-emerald-100">
      <CardHeader>
        <CardTitle>{selected ? selected.nome : "Novo imóvel"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <SectionTitle>Identificação do imóvel</SectionTitle>

          <Field className="md:col-span-2" label="Nome do imóvel">
            <Input
              onChange={(event) => onFieldChange("nome", event.target.value)}
              required
              value={form.nome}
            />
          </Field>
          <Field label="Lote">
            <Input
              onChange={(event) => onFieldChange("lote", event.target.value)}
              value={form.lote}
            />
          </Field>
          <Field label="Município">
            <Input
              onChange={(event) => onFieldChange("municipio", event.target.value)}
              value={form.municipio}
            />
          </Field>
          <Field label="N.º do lote">
            <Input
              onChange={(event) => onFieldChange("n_lote", event.target.value)}
              value={form.n_lote}
            />
          </Field>
          <Field label="Gleba">
            <Input
              onChange={(event) => onFieldChange("gleba", event.target.value)}
              value={form.gleba}
            />
          </Field>
          <Field label="Colônia">
            <Input
              onChange={(event) => onFieldChange("colonia", event.target.value)}
              value={form.colonia}
            />
          </Field>
          <Field label="Matrícula">
            <Input
              inputMode="numeric"
              maxLength={11}
              onChange={(event) =>
                onFieldChange("matricula", mascaraMatricula(event.target.value))
              }
              placeholder="000.000"
              value={form.matricula}
            />
          </Field>
          <Field label="NIRF">
            <Input
              inputMode="numeric"
              maxLength={10}
              onChange={(event) =>
                onFieldChange("nirf", mascaraNirf(event.target.value))
              }
              placeholder="0.000.000-0"
              value={form.nirf}
            />
          </Field>
          <Field label="INCRA">
            <Input
              inputMode="numeric"
              maxLength={17}
              onChange={(event) =>
                onFieldChange("incra", mascaraIncra(event.target.value))
              }
              placeholder="000.000.000.000-0"
              value={form.incra}
            />
          </Field>

          <ProprietariosPicker
            entidadesFiltradas={entidadesFiltradas}
            entidadesSelecionadas={entidadesSelecionadas}
            onRemove={onProprietarioRemove}
            onSearchChange={onProprietarioSearchChange}
            onSelect={onProprietarioSelect}
            proprietarioTermo={proprietarioTermo}
            proprietariosIds={form.proprietarios_ids}
          />

          <SectionTitle>Área</SectionTitle>

          <Field label="Área em Há">
            <Input
              min="0"
              onChange={(event) => onFieldChange("area_total", event.target.value)}
              step="0.0001"
              type="number"
              value={form.area_total}
            />
          </Field>
          <Field label="Área em Alqueires">
            <Input
              readOnly
              title="Calculado automaticamente (1 alqueire paulista = 2,42 ha)"
              type="text"
              value={areaAlq}
            />
          </Field>
          <Field className="md:col-span-2" label="Observação">
            <Textarea
              onChange={(event) => onFieldChange("observacao", event.target.value)}
              value={form.observacao}
            />
          </Field>

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
                      Esta ação vai remover o imóvel selecionado. Essa ação não pode
                      ser desfeita pela tela.
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

export default ImovelForm;
