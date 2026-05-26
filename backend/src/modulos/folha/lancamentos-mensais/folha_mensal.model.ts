import { DataTypes, Model } from "sequelize";
import sequelize from "../../../config/database";
import Entidade from "../../escritorio/entidades/entidade.model";

class FolhaMensal extends Model {
  id_folha_mensal: number | undefined;
  entidade_id: number | undefined;
  ano: number | undefined;
  mes: number | undefined;
  dias_trabalhados: number | undefined;
  salario_bruto: string | undefined;
  inss: string | undefined;
  irrf: string | undefined;
  inss_adicional: string | undefined;
  ferias: string | undefined;
  comissao: string | undefined;
  salario_liquido: string | undefined;
  desconto_bar: string | undefined;
  desconto_diverso_1: string | undefined;
  desconto_diverso_2: string | undefined;
  desconto_diverso_3: string | undefined;
  salario_liquido_com_desconto: string | undefined;
}

const dinheiro = () => ({
  type: DataTypes.DECIMAL(12, 2),
  allowNull: false,
  defaultValue: 0,
});

FolhaMensal.init(
  {
    id_folha_mensal: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    entidade_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    ano: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    mes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    dias_trabalhados: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    salario_bruto: dinheiro(),
    inss: dinheiro(),
    irrf: dinheiro(),
    inss_adicional: dinheiro(),
    ferias: dinheiro(),
    comissao: dinheiro(),
    salario_liquido: dinheiro(),
    desconto_bar: dinheiro(),
    desconto_diverso_1: dinheiro(),
    desconto_diverso_2: dinheiro(),
    desconto_diverso_3: dinheiro(),
    salario_liquido_com_desconto: dinheiro(),
  },
  {
    sequelize,
    tableName: "FOLHA_MENSAL",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["entidade_id", "ano", "mes"],
      },
    ],
  },
);

Entidade.hasMany(FolhaMensal, {
  foreignKey: "entidade_id",
  as: "folhas_mensais",
});

FolhaMensal.belongsTo(Entidade, {
  foreignKey: "entidade_id",
  as: "entidade",
});

export default FolhaMensal;
