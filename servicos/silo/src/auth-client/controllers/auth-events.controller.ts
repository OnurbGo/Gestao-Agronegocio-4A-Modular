import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { CoreAuthClientService } from "../services/core-auth-client.service";

@Controller()
export class AuthEventsController {
  constructor(private readonly coreAuthClient: CoreAuthClientService) {}

  @EventPattern("core.account.deactivated")
  contaDesativada(@Payload() data: { conta_id: number }) {
    this.coreAuthClient.invalidarConta(data.conta_id);
  }

  @EventPattern("core.permissions.updated")
  permissoesAtualizadas(@Payload() data: { conta_id: number }) {
    this.coreAuthClient.invalidarConta(data.conta_id);
  }

  @EventPattern("core.account.credentials.updated")
  credenciaisAtualizadas(@Payload() data: { conta_id: number }) {
    this.coreAuthClient.invalidarConta(data.conta_id);
  }
}
