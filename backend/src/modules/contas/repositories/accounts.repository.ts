import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { FindAndCountOptions, Op, Transaction } from "sequelize";
import { Usuario } from "../../usuarios/entities/usuario.entity";
import { ContaModulo } from "../../permissoes/entities/conta-modulo.entity";
import { PermissaoModulo } from "../../permissoes/types/modulo.enum";
import { Conta } from "../entities/conta.entity";
import { SolicitacaoConta } from "../entities/solicitacao-conta.entity";

@Injectable()
export class AccountsRepository {
  constructor(
    @InjectModel(Conta) private readonly contaModel: typeof Conta,
    @InjectModel(Usuario) private readonly usuarioModel: typeof Usuario,
    @InjectModel(ContaModulo)
    private readonly contaModuloModel: typeof ContaModulo,
    @InjectModel(SolicitacaoConta)
    private readonly solicitacaoModel: typeof SolicitacaoConta,
  ) {}

  criarTransacao(options?: { isolationLevel?: Transaction.ISOLATION_LEVELS }) {
    return this.contaModel.sequelize!.transaction(options);
  }

  contarContas(transaction?: Transaction) {
    return this.contaModel.count({ paranoid: false, transaction });
  }

  listarContas(options: FindAndCountOptions) {
    return this.contaModel.findAndCountAll(options);
  }

  buscarContaPorId(id_conta: number) {
    return this.contaModel.findByPk(id_conta, {
      attributes: { exclude: ["senha_hash"] },
      include: [
        { model: Usuario, as: "usuario" },
        { model: ContaModulo, as: "modulos" },
      ],
    });
  }

  buscarContaPorEmail(email: string, incluirRemovidas = false) {
    return this.contaModel.findOne({
      where: { email },
      paranoid: !incluirRemovidas,
    });
  }

  buscarContaParaAutenticacaoPorEmail(email: string) {
    return this.contaModel.findOne({
      where: { email },
      include: [
        { model: Usuario, as: "usuario" },
        { model: ContaModulo, as: "modulos" },
      ],
    });
  }

  buscarContaAtivaPorId(id_conta: number) {
    return this.contaModel.findOne({
      where: {
        id_conta,
        ativo: true,
      },
      include: [
        { model: Usuario, as: "usuario" },
        { model: ContaModulo, as: "modulos" },
      ],
    });
  }

  atualizarUltimoLogin(id_conta: number) {
    return this.contaModel.update(
      { ultimo_login: new Date() },
      { where: { id_conta } },
    );
  }

  criarUsuario(
    data: Partial<Usuario>,
    transaction?: Transaction,
  ) {
    return this.usuarioModel.create(data, { transaction });
  }

  criarConta(data: Partial<Conta>, transaction?: Transaction) {
    return this.contaModel.create(data, { transaction });
  }

  criarModulos(
    modulos: Array<PermissaoModulo & { conta_id: number }>,
    transaction?: Transaction,
  ) {
    return this.contaModuloModel.bulkCreate(modulos, { transaction });
  }

  atualizarConta(
    id_conta: number,
    data: Partial<Conta>,
    transaction?: Transaction,
  ) {
    return this.contaModel.update(data, { where: { id_conta }, transaction });
  }

  buscarSolicitacaoPorId(id_solicitacao_conta: number) {
    return this.solicitacaoModel.findByPk(id_solicitacao_conta);
  }

  buscarSolicitacaoPendentePorEmail(email: string) {
    return this.solicitacaoModel.findOne({
      where: {
        email,
        status: { [Op.in]: ["PENDENTE"] },
      },
    });
  }

  criarSolicitacao(data: Partial<SolicitacaoConta>) {
    return this.solicitacaoModel.create(data);
  }

  listarSolicitacoes(options: FindAndCountOptions) {
    return this.solicitacaoModel.findAndCountAll(options);
  }

  contarAdminsAtivos(transaction?: Transaction) {
    return this.contaModuloModel.count({
      where: {
        modulo: "ADMIN",
        [Op.or]: [
          { pode_visualizar: true },
          { pode_criar: true },
          { pode_editar: true },
          { pode_excluir: true },
          { pode_restaurar: true },
        ],
      },
      include: [
        {
          model: Conta,
          as: "conta",
          attributes: [],
          where: { ativo: true },
          required: true,
        },
      ],
      transaction,
    });
  }
}

