export type PermissaoModulo = {
  id_conta_modulo?: number;
  conta_id?: number;
  modulo: string;
  pode_visualizar: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
  pode_restaurar: boolean;
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
