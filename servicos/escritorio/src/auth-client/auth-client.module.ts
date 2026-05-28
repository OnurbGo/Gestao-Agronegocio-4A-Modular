import { Module } from "@nestjs/common";
import { CoreAuthClientService } from "./core-auth-client.service";
import { EscritorioAuthGuard } from "./escritorio-auth.guard";
import { PermissionGuard } from "./permission.guard";
import { AuthEventsController } from "./auth-events.controller";

@Module({
  controllers: [AuthEventsController],
  providers: [CoreAuthClientService, EscritorioAuthGuard, PermissionGuard],
  exports: [CoreAuthClientService, EscritorioAuthGuard, PermissionGuard],
})
export class AuthClientModule {}
