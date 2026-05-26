import "dotenv/config";
import { Sequelize } from "sequelize";

const isTest = process.env.NODE_ENV === "test";
const logging = process.env.DB_LOGGING === "true" ? console.log : false;

const sequelize = new Sequelize(
  (isTest ? process.env.DB_NAME_TEST : process.env.DB_NAME)!,
  process.env.DB_USER!,
  process.env.DB_PASS!,
  {
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mysql",
    logging: isTest ? false : logging,
  },
);

export default sequelize;
