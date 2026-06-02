import { Injectable, ServiceUnavailableException } from "@nestjs/common";

@Injectable()
export class OpenApiProxyService {
  private readonly coreUrl =
    process.env.CORE_OPENAPI_URL || "http://core-service:3000/openapi.json";

  private readonly escritorioUrl =
    process.env.ESCRITORIO_OPENAPI_URL ||
    "http://escritorio-service:3000/openapi.json";

  getCoreSpec() {
    return this.fetchSpec(this.coreUrl, "Core");
  }

  getEscritorioSpec() {
    return this.fetchSpec(this.escritorioUrl, "Escritorio");
  }

  private async fetchSpec(url: string, serviceName: string) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      throw new ServiceUnavailableException(
        `Nao foi possivel carregar a documentacao do ${serviceName}.`,
      );
    }
  }
}
