import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_METADATA = "permissions";
export const PERMISSIONS_MATCH_METADATA = "permissions_match";

export type RequiredPermission = {
  modulo: string;
  acao: "visualizar" | "criar" | "editar" | "excluir" | "restaurar";
};

export const RequirePermission = (
  modulo: string,
  acao: RequiredPermission["acao"],
) =>
  SetMetadata(PERMISSIONS_METADATA, [
    { modulo, acao } satisfies RequiredPermission,
  ]);

export const RequireAnyPermission = (permissions: RequiredPermission[]) => {
  return (target: object, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    SetMetadata(PERMISSIONS_METADATA, permissions)(target, key!, descriptor!);
    SetMetadata(PERMISSIONS_MATCH_METADATA, "any")(target, key!, descriptor!);
  };
};
