import { Module } from "@nestjs/common";
import { CoreAuthClientService } from "./services/core-auth-client.service";
import { EscritorioAuthGuard } from "./guards/escritorio-auth.guard";
import { PermissionGuard } from "./guards/permission.guard";
import { AuthEventsController } from "./controllers/auth-events.controller";

@Module({
  controllers: [AuthEventsController],
  providers: [CoreAuthClientService, EscritorioAuthGuard, PermissionGuard],
  exports: [CoreAuthClientService, EscritorioAuthGuard, PermissionGuard],
})
export class AuthClientModule {}

