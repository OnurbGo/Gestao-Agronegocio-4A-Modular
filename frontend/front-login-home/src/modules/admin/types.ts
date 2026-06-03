export type AdminModuleId = string;

export type PermissionModule = {
  modulo: AdminModuleId;
  pode_visualizar?: boolean;
  pode_criar?: boolean;
  pode_editar?: boolean;
  pode_excluir?: boolean;
  pode_restaurar?: boolean;
};

export type AdminAccount = {
  id_conta: number;
  email: string;
  ativo: boolean;
  usuario?: {
    nome?: string;
  };
  modulos?: PermissionModule[];
};

export type AccessRequest = {
  id_solicitacao_conta: number;
  nome: string;
  email: string;
  modulos_solicitados?: unknown;
};

export type PageMeta<TItem = unknown> = {
  items: TItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

