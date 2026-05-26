import { Router } from "express";
import validate from "../../shared/middlewares/validate.middleware";
import authMiddleware from "./auth.middleware";
import AuthController from "./auth.controller";
import { loginSchema } from "./auth.schema";

const router = Router();

router.post("/login", validate(loginSchema), AuthController.login);
router.get("/me", authMiddleware, AuthController.me);

export default router;
