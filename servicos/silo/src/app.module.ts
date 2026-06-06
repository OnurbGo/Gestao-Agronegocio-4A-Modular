import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuditModule } from "./audit/audit.module";
import { AuthClientModule } from "./auth-client/auth-client.module";
import { SiloModule } from "./silo/silo.module";
import { SILO_MODELS } from "./silo/silo.models";

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: "mysql",
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      models: SILO_MODELS,
      autoLoadModels: true,
      synchronize: process.env.DB_SYNC_ALTER === "true",
      sync: { alter: process.env.DB_SYNC_ALTER === "true" },
      logging: process.env.DB_LOGGING === "true" ? console.log : false,
    }),
    AuthClientModule,
    AuditModule,
    SiloModule,
  ],
})
export class AppModule {}
