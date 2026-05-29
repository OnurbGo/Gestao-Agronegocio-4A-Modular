import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Transport } from "@nestjs/microservices";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import express from "express";
import { AppModule } from "./app.module";
import { userPhotoUploadDir } from "./users/utils/user-photo.upload";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const redisHost = process.env.REDIS_HOST || "localhost";
  const redisPort = Number(process.env.REDIS_PORT || 6379);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.use("/uploads/usuarios", express.static(userPhotoUploadDir));

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Core API")
    .setDescription("Gestão de contas, usuários e permissões")
    .setVersion("1.0")
    .addServer("/api/core", "Via Nginx")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      "JWT",
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  app.getHttpAdapter().get("/openapi.json", (_request, response) => {
    response.json(document);
  });

  app.connectMicroservice({
    transport: Transport.REDIS,
    options: {
      host: redisHost,
      port: redisPort,
    },
  });

  await app.startAllMicroservices();
  await app.listen(Number(process.env.PORT || 3000), "0.0.0.0");
}

bootstrap();

