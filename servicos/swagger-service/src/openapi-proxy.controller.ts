import { Controller, Get } from "@nestjs/common";
import { OpenApiProxyService } from "./openapi-proxy.service";

@Controller("api-docs")
export class OpenApiProxyController {
  constructor(private readonly openApiProxyService: OpenApiProxyService) {}

  @Get("core-json")
  core() {
    return this.openApiProxyService.getCoreSpec();
  }

  @Get("escritorio-json")
  escritorio() {
    return this.openApiProxyService.getEscritorioSpec();
  }
}
