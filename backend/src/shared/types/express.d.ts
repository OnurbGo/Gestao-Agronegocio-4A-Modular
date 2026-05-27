import type {
  Modulo,
  PermissaoModulo,
} from "../../core/permissoes/modulo.enum";

declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id_usuario: number;
        nome: string;
        email: string;
        modulos: PermissaoModulo[];
        possuiAdmin: boolean;
        possuiGerente: boolean;
        modulosNomes: Modulo[];
      };
    }
  }
}

export {};
