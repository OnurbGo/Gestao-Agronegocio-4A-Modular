import { INestApplication, ValidationPipe } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";

export async function createHttpTestApp(
  moduleFixture: TestingModule,
): Promise<INestApplication> {
  const app = moduleFixture.createNestApplication();

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  await app.init();
  return app;
}
