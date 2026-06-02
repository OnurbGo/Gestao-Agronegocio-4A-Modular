import { z } from "zod";

const dateSchema = z.string().trim().refine((value) => Boolean(Date.parse(value)), {
  message: "Data invalida.",
});

const optionalDate = z
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

const dinheiro = z.coerce.number().finite().min(0).default(0);

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
  salario: dinheiro,
  percentual: z.coerce.number().finite().min(0).optional().nullable(),
  observacao: optionalText,
});

export const feriasSchema = z.object({
  periodo_aquisitivo_inicio: dateSchema,
  periodo_aquisitivo_fim: dateSchema,
  dias_totais: z.coerce.number().int().min(0),
  dias_gozados: z.coerce.number().int().min(0).default(0),
  valor_abono: dinheiro.optional().nullable(),
  periodo_inicio: optionalDate,
  periodo_fim: optionalDate,
  data_retorno: optionalDate,
});

export const lancamentoMensalLinhaSchema = z.object({
  mes: z.coerce.number().int().min(1).max(12),
  dias_trabalhados: z.coerce.number().int().min(0).max(31).default(0),
  salario_bruto: dinheiro,
  inss: dinheiro,
  irrf: dinheiro,
  inss_adicional: dinheiro,
  ferias: dinheiro,
  comissao: dinheiro,
  desconto_bar: dinheiro,
  desconto_diverso_1: dinheiro,
  desconto_diverso_2: dinheiro,
  desconto_diverso_3: dinheiro,
});

export const folhaMensalSchema = z.object({
  ano: z.coerce.number().int().min(2000).max(2100),
  linhas: z.array(lancamentoMensalLinhaSchema).min(1).max(12),
});

export type RegistroSalarialInput = z.infer<typeof registroSalarialSchema>;
export type FeriasInput = z.infer<typeof feriasSchema>;
export type FolhaMensalInput = z.infer<typeof folhaMensalSchema>;
export type ListarParticipantesQuery = z.infer<typeof listarParticipantesQuerySchema>;
