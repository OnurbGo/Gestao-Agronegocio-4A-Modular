import { z } from "zod";

const dateSchema = z.string().trim().refine((value) => Boolean(Date.parse(value)), {
  message: "Data invalida.",
});

const optionalDateSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => value || null);

const optionalText = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => value || null);

const dinheiroSchema = z.coerce.number().finite().min(0).default(0);

export const participanteIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID invalido."),
});

export const listarParticipantesQuerySchema = z.object({
  termo: z.string().trim().optional(),
});

export const anoQuerySchema = z.object({
  ano: z.coerce.number().int().min(2000).max(2100).default(new Date().getFullYear()),
});

export const relatorioMensalQuerySchema = anoQuerySchema.extend({
  mes: z.coerce.number().int().min(1).max(12).default(new Date().getMonth() + 1),
});

export const registroSalarialSchema = z.object({
  inicio_vigencia: dateSchema,
  salario: dinheiroSchema,
  percentual: z.coerce.number().finite().min(0).optional().nullable(),
  observacao: optionalText,
});

export const feriasSchema = z.object({
  periodo_aquisitivo_inicio: dateSchema,
  periodo_aquisitivo_fim: dateSchema,
  dias_totais: z.coerce.number().int().min(0),
  dias_gozados: z.coerce.number().int().min(0).default(0),
  valor_abono: dinheiroSchema.optional().nullable(),
  periodo_inicio: optionalDateSchema,
  periodo_fim: optionalDateSchema,
  data_retorno: optionalDateSchema,
});

export const lancamentoMensalLinhaSchema = z.object({
  mes: z.coerce.number().int().min(1).max(12),
  dias_trabalhados: z.coerce.number().int().min(0).max(31).default(0),
  salario_bruto: dinheiroSchema,
  inss: dinheiroSchema,
  irrf: dinheiroSchema,
  inss_adicional: dinheiroSchema,
  ferias: dinheiroSchema,
  comissao: dinheiroSchema,
  desconto_bar: dinheiroSchema,
  desconto_diverso_1: dinheiroSchema,
  desconto_diverso_2: dinheiroSchema,
  desconto_diverso_3: dinheiroSchema,
});

export const folhaMensalSchema = z.object({
  ano: z.coerce.number().int().min(2000).max(2100),
  linhas: z.array(lancamentoMensalLinhaSchema).min(1).max(12),
});

export type ListarParticipantesQuery = z.infer<
  typeof listarParticipantesQuerySchema
>;
export type AnoQuery = z.infer<typeof anoQuerySchema>;
export type RelatorioMensalQuery = z.infer<typeof relatorioMensalQuerySchema>;
export type RegistroSalarialInput = z.infer<typeof registroSalarialSchema>;
export type FeriasInput = z.infer<typeof feriasSchema>;
export type FolhaMensalInput = z.infer<typeof folhaMensalSchema>;
