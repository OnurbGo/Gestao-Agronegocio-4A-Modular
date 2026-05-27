import "dotenv/config";
import app from "./app";
import sequelize from "./config/database";

const PORT = process.env.PORT || 3000;
const syncAlter = process.env.DB_SYNC_ALTER === "true";

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database authenticated");
    await sequelize.sync({ alter: syncAlter });
    console.log("Database synchronized");
    app.listen(Number(PORT), "0.0.0.0", () =>
      console.log(`Server is running on port ${PORT}`),
    );
  } catch (err) {
    console.error("Erro ao sincronizar o banco de dados:", err);
    process.exit(1);
  }
})();
