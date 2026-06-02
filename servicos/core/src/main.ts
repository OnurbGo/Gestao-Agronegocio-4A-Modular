import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Transport } from "@nestjs/microservices";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const redisHost = process.env.REDIS_HOST || "localhost";
  const redisPort = Number(process.env.REDIS_PORT || 6379);

  app.enableCors();

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
  SwaggerModule.setup("api-docs", app, document);

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
