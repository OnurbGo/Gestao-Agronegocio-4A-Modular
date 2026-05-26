import { z } from "zod";
import { permissaoModuloSchema } from "../permissoes/permissao.schema";

export const criarUsuarioSchema = z.object({
  nome: z.string().trim().min(2, "Nome é obrigatório."),
  email: z
    .string()
    .trim()
    .email("E-mail inválido.")
    .transform((email) => email.toLowerCase()),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
  observacao: z.string().trim().optional().or(z.literal("")),
  modulos: z.array(permissaoModuloSchema).optional().default([]),
});

export const atualizarUsuarioSchema = z.object({
  nome: z.string().trim().min(2, "Nome é obrigatório.").optional(),
  email: z
    .string()
    .trim()
    .email("E-mail inválido.")
    .transform((email) => email.toLowerCase())
    .optional(),
  senha: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres.")
    .optional(),
  ativo: z.boolean().optional(),
  observacao: z.string().trim().optional().or(z.literal("")),
});

export const aprovarSolicitacaoSchema = z.object({
  modulos: z.array(permissaoModuloSchema).optional(),
});

export const recusarSolicitacaoSchema = z.object({
  motivo_recusa: z.string().trim().optional().or(z.literal("")),
});

export const solicitacaoIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID inválido."),
});

export const listarSolicitacoesQuerySchema = z.object({
  status: z.enum(["PENDENTE", "APROVADA", "RECUSADA"]).optional(),
});

export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;
export type AtualizarUsuarioInput = z.infer<typeof atualizarUsuarioSchema>;
export type AprovarSolicitacaoInput = z.infer<
  typeof aprovarSolicitacaoSchema
>;
export type RecusarSolicitacaoInput = z.infer<typeof recusarSolicitacaoSchema>;
