import { Injectable } from "@nestjs/common";

@Injectable()
export class AccountsEventsService {
  emitAccountDeactivated(contaId: number) {
    void contaId;
  }

  emitPermissionsUpdated(contaId: number) {
    void contaId;
  }

  emitAccountCredentialsUpdated(contaId: number) {
    void contaId;
  }
}

