import { z } from "zod";
import { MODULOS } from "../permissions/modulo.enum";

const permissaoSchema = z.object({
  modulo: z.enum(MODULOS),
  pode_visualizar: z.boolean().default(true),
  pode_criar: z.boolean().default(false),
  pode_editar: z.boolean().default(false),
  pode_excluir: z.boolean().default(false),
  pode_restaurar: z.boolean().default(false),
});

export const criarContaSchema = z.object({
  nome: z.string().trim().min(2, "Nome e obrigatorio."),
  email: z.string().trim().email("E-mail invalido."),
  senha: z.string().min(6, "Senha deve ter no minimo 6 caracteres."),
  imagem_perfil_url: z.string().trim().url().optional().or(z.literal("")),
  observacao: z.string().trim().optional().or(z.literal("")),
  modulos: z.array(permissaoSchema).optional(),
});

export const contaIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID invalido."),
});

export const atualizarStatusContaSchema = z.object({
  ativo: z.boolean(),
});

export const solicitarContaSchema = z.object({
  nome: z.string().trim().min(2, "Nome e obrigatorio."),
  email: z.string().trim().email("E-mail invalido."),
  senha: z.string().min(6, "Senha deve ter no minimo 6 caracteres."),
  imagem_perfil_url: z.string().trim().url().optional().or(z.literal("")),
  observacao: z.string().trim().optional().or(z.literal("")),
  modulos_solicitados: z.array(z.enum(MODULOS)).optional(),
});

export const solicitacaoIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID invalido."),
});

export const aprovarSolicitacaoSchema = z.object({
  modulos: z.array(permissaoSchema).min(1, "Informe ao menos um modulo."),
});

export const recusarSolicitacaoSchema = z.object({
  motivo_recusa: z.string().trim().min(3, "Motivo e obrigatorio."),
});

export type CriarContaInput = z.infer<typeof criarContaSchema>;
export type AtualizarStatusContaInput = z.infer<typeof atualizarStatusContaSchema>;
export type SolicitarContaInput = z.infer<typeof solicitarContaSchema>;
export type AprovarSolicitacaoInput = z.infer<typeof aprovarSolicitacaoSchema>;
export type RecusarSolicitacaoInput = z.infer<typeof recusarSolicitacaoSchema>;
