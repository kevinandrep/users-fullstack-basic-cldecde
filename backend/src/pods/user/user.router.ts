import { Router } from "express";
import * as controller from "./user.controller.js";
import {
  validate,
  authenticate,
  authorize,
} from "../../shared/middlewares/index.js";
import {
  createUserSchema,
  updateUserSchema,
  loginSchema,
} from "./user.schema.js";

export const userRouter = Router();

// Públicas
userRouter.post(
  "/register",
  validate(createUserSchema),
  controller.createUserHandler,
);
userRouter.post("/login", validate(loginSchema), controller.loginHandler);

// Protegidas — cualquier usuario autenticado
userRouter.get("/me/:id", authenticate, controller.getUserByIdHandler);
userRouter.patch(
  "/me/:id",
  authenticate,
  validate(updateUserSchema),
  controller.updateUserHandler,
);

// Protegidas — solo ADMIN
userRouter.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  controller.getAllUsersHandler,
);
userRouter.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  controller.deleteUserHandler,
);
