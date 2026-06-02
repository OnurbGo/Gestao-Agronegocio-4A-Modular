import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Gestao Agronegocio 4A APIs")
    .setDescription("Documentacao centralizada das APIs Core e Escritorio.")
    .setVersion("1.0")
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup("api-docs", app, document, {
    explorer: true,
    swaggerOptions: {
      urls: [
        { name: "Core API", url: "/api-docs/core-json" },
        { name: "Escritorio API", url: "/api-docs/escritorio-json" },
      ],
    },
  });

  await app.listen(Number(process.env.PORT || 3000), "0.0.0.0");
}

bootstrap();
