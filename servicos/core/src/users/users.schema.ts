import { z } from "zod";

export const usuarioIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID invalido."),
});

export const atualizarUsuarioSchema = z.object({
  nome: z.string().trim().min(2).optional(),
  imagem_perfil_url: z.string().trim().url().optional().nullable(),
  observacao: z.string().trim().optional().nullable(),
});

export type AtualizarUsuarioInput = z.infer<typeof atualizarUsuarioSchema>;
