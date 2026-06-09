import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { CoreAuthClientService } from "./services/core-auth-client.service";
import { EscritorioAuthGuard } from "./guards/escritorio-auth.guard";
import { PermissionGuard } from "./guards/permission.guard";

@Module({
  imports: [AuthModule],
  providers: [CoreAuthClientService, EscritorioAuthGuard, PermissionGuard],
  exports: [CoreAuthClientService, EscritorioAuthGuard, PermissionGuard],
})
export class AuthClientModule {}

