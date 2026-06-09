import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import express from "express";
import path from "path";
import { AppModule } from "./app.module";
import { userPhotoUploadDir } from "./modules/usuarios/utils/user-photo.upload";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const uploadRoot = process.env.UPLOAD_ROOT || path.resolve(process.cwd(), "uploads");
  const escritorioUploadDir =
    process.env.ESCRITORIO_UPLOAD_DIR || path.resolve(uploadRoot, "escritorio");

  app.setGlobalPrefix("api");
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.use("/uploads/usuarios", express.static(userPhotoUploadDir));
  app.use("/uploads/escritorio", express.static(escritorioUploadDir));

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Gestao Agronegocio API")
    .setDescription("Backend unico em monolito modular")
    .setVersion("1.0")
    .addServer("/api", "API unificada")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      "JWT",
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api-docs", app, document);
  app.getHttpAdapter().get("/openapi.json", (_request, response) => {
    response.json(document);
  });

  await app.listen(Number(process.env.PORT || 3000), "0.0.0.0");
}

bootstrap();
