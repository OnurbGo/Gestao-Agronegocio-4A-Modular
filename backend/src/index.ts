import app from "./app";
import sequelize from "./config/database";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT;
if (!PORT) {
  throw new Error("A variável de ambiente PORT não está definida.");
}

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database authenticated");
    await sequelize.sync({ alter: false });
    console.log("Database synchronized");
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (err) {
    console.error("Erro ao sincronizar o banco de dados:", err);
    process.exit(1);
  }
})();
