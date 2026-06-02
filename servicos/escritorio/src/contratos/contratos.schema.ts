import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => value || null);

const optionalId = z
  .union([z.coerce.number().int().positive(), z.literal(""), z.null()])
  .optional()
  .transform((value) => (value === "" || value === undefined ? null : value));

const dateSchema = z.string().trim().refine((value) => Boolean(Date.parse(value)), {
  message: "Data invalida.",
});

export const contratoStatusSchema = z.enum([
  "RASCUNHO",
  "ATIVO",
  "ENCERRADO",
  "CANCELADO",
]);

export const contratoSchema = z.object({
  numero: z.string().trim().min(1, "Numero e obrigatorio."),
  entidade_id: z.coerce.number().int().positive("Entidade e obrigatoria."),
  imovel_id: optionalId,
  safra: z.string().trim().min(1, "Safra e obrigatoria."),
  produto: z.string().trim().min(1, "Produto e obrigatorio."),
  quantidade_prevista: z.coerce.number().finite().min(0).default(0),
  unidade: z.string().trim().min(1).default("KG"),
  data_inicial: dateSchema,
  data_final: dateSchema,
  status: contratoStatusSchema.default("RASCUNHO"),
  observacao: optionalText,
  ativo: z.boolean().default(true),
});

export const atualizarContratoSchema = contratoSchema.partial();

export const contratoIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID invalido."),
});

export const listarContratosQuerySchema = z.object({
  termo: z.string().trim().optional(),
  status: contratoStatusSchema.optional(),
  ativo: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => {
      if (value === "true") return true;
      if (value === "false") return false;
      return undefined;
    }),
});

export type ContratoInput = z.infer<typeof contratoSchema>;
export type AtualizarContratoInput = z.infer<typeof atualizarContratoSchema>;
export type ListarContratosQuery = z.infer<typeof listarContratosQuerySchema>;
