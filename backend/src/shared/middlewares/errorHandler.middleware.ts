import type { Request, Response, NextFunction } from "express";
import { Prisma } from "../../generated/prisma/client.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  console.error(err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res
        .status(409)
        .json({ message: "El recurso ya existe (campo único duplicado)" });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ message: "Recurso no encontrado" });
      return;
    }
  }

  res.status(500).json({ message: "Error interno del servidor" });
}
