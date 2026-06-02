import { SetMetadata } from "@nestjs/common";

export const PERMISSION_METADATA = "permission";

export type RequiredPermission = {
  modulo: string;
  acao: "visualizar" | "criar" | "editar" | "excluir" | "restaurar";
};

export const RequirePermission = (modulo: string, acao: RequiredPermission["acao"]) =>
  SetMetadata(PERMISSION_METADATA, { modulo, acao } satisfies RequiredPermission);

