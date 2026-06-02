import { Module } from "@nestjs/common";
import { OpenApiProxyController } from "./openapi-proxy.controller";
import { OpenApiProxyService } from "./openapi-proxy.service";

@Module({
  controllers: [OpenApiProxyController],
  providers: [OpenApiProxyService],
})
export class AppModule {}
