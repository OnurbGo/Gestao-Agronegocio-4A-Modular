import { PermissaoModulo } from "../../permissoes/types/modulo.enum";

export type TokenPayload = {
  id_conta: number;
  id_usuario: number;
  email: string;
  iat?: number;
};

export type AuthContext = {
  conta_id: number;
  usuario_id: number;
  nome: string;
  imagem_perfil_url: string | null;
  observacao: string | null;
  email: string;
  modulos: PermissaoModulo[];
  possuiAdmin: boolean;
  possuiGerente: boolean;
};

