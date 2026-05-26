import "dotenv/config";
import { Sequelize } from "sequelize";

const isTest = process.env.NODE_ENV === "test";

const sequelize = new Sequelize(
  (isTest ? process.env.DB_NAME_TEST : process.env.DB_NAME)!,
  process.env.DB_USER!,
  process.env.DB_PASS!,
  {
    host: process.env.DB_HOST!,
    dialect: "mysql",
    logging: !isTest,
  },
);

if (process.env.NODE_ENV !== "test") {
  (async () => {
    try {
      await sequelize.sync({ alter: true });
      console.log("Banco de dados sincronizado.");
    } catch (error) {
      console.error("Erro ao sincronizar o banco de dados:", error);
    }
  })();
}

export default sequelize;
