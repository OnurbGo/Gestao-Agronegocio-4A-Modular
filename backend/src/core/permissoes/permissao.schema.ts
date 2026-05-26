import { z } from "zod";
import { MODULOS } from "./modulo.enum";

export const permissaoModuloSchema = z.object({
  modulo: z.enum(MODULOS),
  pode_visualizar: z.boolean().default(true),
  pode_criar: z.boolean().default(false),
  pode_editar: z.boolean().default(false),
  pode_excluir: z.boolean().default(false),
  pode_restaurar: z.boolean().default(false),
});

export const salvarPermissoesSchema = z.object({
  modulos: z
    .array(permissaoModuloSchema)
    .min(1, "Informe pelo menos um módulo."),
});

export const usuarioIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID inválido."),
});

export type PermissaoModuloInput = z.infer<typeof permissaoModuloSchema>;
export type SalvarPermissoesInput = z.infer<typeof salvarPermissoesSchema>;
