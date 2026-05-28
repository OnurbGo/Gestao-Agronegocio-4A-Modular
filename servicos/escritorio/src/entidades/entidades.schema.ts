import { z } from "zod";

const optionalText = z
  .preprocess(
    (value) => (value === null ? undefined : value),
    z.string().trim().optional().or(z.literal("")),
  )
  .transform((value) => value || null);

export const entidadeTipoSchema = z.enum([
  "FUNCIONARIO",
  "PROPRIETARIO",
  "CLIENTE",
  "ARRENDATARIO",
]);

export const entidadeSchema = z.object({
  nome: z.string().trim().min(2, "Nome e obrigatorio."),
  cpf_cnpj: z.preprocess(
    (value) => (typeof value === "string" ? value.replace(/\D/g, "") : value),
    z.string().trim().min(11, "CPF/CNPJ invalido."),
  ),
  tipo_pessoa: z.preprocess(
    (value) => (typeof value === "string" ? value.toUpperCase() : value),
    z.enum(["FISICA", "JURIDICA"]),
  ),
  email: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  telefone: optionalText,
  celular: optionalText,
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
    .transform((v) => (v ? v.toUpperCase() : null)),
  complemento: optionalText,
  data_nascimento: optionalText,
  nacionalidade: optionalText,
  filiacao: optionalText,
  estado_civil: z
    .enum(["SOLTEIRO", "CASADO", "DIVORCIADO", "VIUVO", "UNIAO_ESTAVEL"])
    .optional()
    .nullable(),
  genero: z
    .enum(["MASCULINO", "FEMININO", "OUTRO", "NAO_INFORMADO"])
    .optional()
    .nullable(),
  participa_folha: z.boolean().default(false),
  observacao: optionalText,
  ativo: z.boolean().default(true),
  tipos: z
    .array(entidadeTipoSchema)
    .min(1, "Informe pelo menos um tipo.")
    .default(["CLIENTE"]),
});

export const atualizarEntidadeSchema = entidadeSchema.partial().extend({
  tipos: z.array(entidadeTipoSchema).min(1).optional(),
});

export const entidadeIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID invalido."),
});

export const listarEntidadesQuerySchema = z.object({
  termo: z.string().trim().optional(),
  tipo: entidadeTipoSchema.optional(),
  ativo: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => {
      if (value === "true") return true;
      if (value === "false") return false;
      return undefined;
    }),
});

export type EntidadeInput = z.infer<typeof entidadeSchema>;
export type AtualizarEntidadeInput = z.infer<typeof atualizarEntidadeSchema>;
export type ListarEntidadesQuery = z.infer<typeof listarEntidadesQuerySchema>;
