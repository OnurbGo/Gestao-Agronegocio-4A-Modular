import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./config/swagger";
import coreRoutes from "./core/core.routes";
import escritorioRoutes from "./modulos/escritorio/escritorio.routes";
import folhaRoutes from "./modulos/folha/folha.routes";
import errorMiddleware from "./shared/middlewares/error.middleware";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "API Gestão Agronegócio 4A",
  });
});

app.get("/api-docs.json", (_req, res) => {
  res.json(swaggerDocument);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/core", coreRoutes);
app.use("/escritorio", escritorioRoutes);
app.use("/folha", folhaRoutes);
app.use(errorMiddleware);

export default app;
