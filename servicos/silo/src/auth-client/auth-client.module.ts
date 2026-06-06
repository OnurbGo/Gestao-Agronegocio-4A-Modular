import { Module } from "@nestjs/common";
import { AuthEventsController } from "./controllers/auth-events.controller";
import { CoreAuthClientService } from "./services/core-auth-client.service";
import { AdminOrGerenteGuard } from "./guards/admin-or-gerente.guard";
import { PermissionGuard } from "./guards/permission.guard";
import { SiloAuthGuard } from "./guards/silo-auth.guard";

@Module({
  controllers: [AuthEventsController],
  providers: [
    CoreAuthClientService,
    SiloAuthGuard,
    PermissionGuard,
    AdminOrGerenteGuard,
  ],
  exports: [
    CoreAuthClientService,
    SiloAuthGuard,
    PermissionGuard,
    AdminOrGerenteGuard,
  ],
})
export class AuthClientModule {}
