import { Controller } from "@nestjs/common";
import { CoreAuthClientService } from "../services/core-auth-client.service";

@Controller()
export class AuthEventsController {
  constructor(private readonly coreAuthClient: CoreAuthClientService) {
    void this.coreAuthClient;
  }
}
