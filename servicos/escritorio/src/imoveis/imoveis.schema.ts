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

const optionalMoney = z
  .union([z.coerce.number().finite().min(0), z.literal(""), z.null()])
  .optional()
  .transform((value) => (value === "" || value === undefined ? null : value));

export const imovelSchema = z.object({
  nome: z.string().trim().min(2, "Nome e obrigatorio."),
  codigo: optionalText,
  matricula: optionalText,
  proprietario_entidade_id: optionalId,
  area_total: optionalMoney,
  area_agricultavel: optionalMoney,
  cep: optionalText,
  logradouro: optionalText,
  numero: optionalText,
  bairro: optionalText,
  cidade: optionalText,
  estado: z
    .string()
    .trim()
    .length(2)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value.toUpperCase() : null)),
  complemento: optionalText,
  observacao: optionalText,
  ativo: z.boolean().default(true),
});

export const atualizarImovelSchema = imovelSchema.partial();

export const imovelIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID invalido."),
});

export const listarImoveisQuerySchema = z.object({
  termo: z.string().trim().optional(),
  ativo: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => {
      if (value === "true") return true;
      if (value === "false") return false;
      return undefined;
    }),
});

export type ImovelInput = z.infer<typeof imovelSchema>;
export type AtualizarImovelInput = z.infer<typeof atualizarImovelSchema>;
export type ListarImoveisQuery = z.infer<typeof listarImoveisQuerySchema>;
