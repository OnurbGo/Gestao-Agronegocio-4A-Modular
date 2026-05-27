import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => value || null);

export const entidadeTipoSchema = z.enum([
  "FUNCIONARIO",
  "PROPRIETARIO",
  "CLIENTE",
  "ARRENDATARIO",
]);

export const entidadeSchema = z.object({
  nome: z.string().trim().min(2, "Nome é obrigatório."),
  cpf_cnpj: z.string().trim().min(11, "CPF/CNPJ inválido."),
  tipo_pessoa: z.enum(["FISICA", "JURIDICA"]),
  email: z
    .string()
    .trim()
    .email("E-mail inválido.")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || null),
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
    .length(2, "Estado deve ter 2 caracteres.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value.toUpperCase() : null)),
  complemento: optionalText,
  data_nascimento: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || null),
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
    .min(1, "Informe pelo menos um tipo de entidade."),
});

export const atualizarEntidadeSchema = entidadeSchema.partial().extend({
  tipos: z.array(entidadeTipoSchema).min(1).optional(),
});

export const entidadeIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID inválido."),
});

export const listarEntidadesQuerySchema = z.object({
  termo: z.string().trim().optional(),
  tipo: entidadeTipoSchema.optional(),
  ativo: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => {
      if (value === "true") {
        return true;
      }

      if (value === "false") {
        return false;
      }

      return undefined;
    }),
});

export type EntidadeInput = z.infer<typeof entidadeSchema>;
export type AtualizarEntidadeInput = z.infer<typeof atualizarEntidadeSchema>;
export type ListarEntidadesQuery = z.infer<typeof listarEntidadesQuerySchema>;
