import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { CoreAuthClientService } from "./services/core-auth-client.service";
import { AdminOrGerenteGuard } from "./guards/admin-or-gerente.guard";
import { PermissionGuard } from "./guards/permission.guard";
import { SiloAuthGuard } from "./guards/silo-auth.guard";

@Module({
  imports: [AuthModule],
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
