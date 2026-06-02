import { z } from "zod";
import { MODULOS } from "./modulo.enum";

export const contaIdParamSchema = z.object({
  contaId: z.coerce.number().int().positive("ID invalido."),
});

export const salvarPermissoesSchema = z.object({
  modulos: z.array(
    z.object({
      modulo: z.enum(MODULOS),
      pode_visualizar: z.boolean(),
      pode_criar: z.boolean(),
      pode_editar: z.boolean(),
      pode_excluir: z.boolean(),
      pode_restaurar: z.boolean(),
    }),
  ),
});

export type SalvarPermissoesInput = z.infer<typeof salvarPermissoesSchema>;
