import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("E-mail invalido."),
  senha: z.string().min(1, "Senha e obrigatoria."),
});

export type LoginInput = z.infer<typeof loginSchema>;
