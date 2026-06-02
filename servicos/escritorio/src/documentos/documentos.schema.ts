import { z } from "zod";

export const arquivoOrigemSchema = z.enum(["ENTIDADE", "IMOVEL"]);

export const arquivoIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID invalido."),
});

export const donoArquivoParamSchema = z.object({
  id: z.coerce.number().int().positive("ID invalido."),
});

export const arquivoQuerySchema = z.object({
  origem: arquivoOrigemSchema,
});

export const uploadArquivoSchema = z.object({
  tipo_documento_id: z.coerce.number().int().positive("Tipo de documento invalido."),
  observacao: z.string().trim().optional().or(z.literal("")).transform((v) => v || null),
});

export type ArquivoOrigem = z.infer<typeof arquivoOrigemSchema>;
export type UploadArquivoInput = z.infer<typeof uploadArquivoSchema>;
