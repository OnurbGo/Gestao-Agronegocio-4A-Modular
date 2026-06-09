import { Controller } from "@nestjs/common";
import { AuthService } from "../services/auth.service";

@Controller()
export class AuthMessagesController {
  constructor(private readonly authService: AuthService) {
    void this.authService;
  }
}

