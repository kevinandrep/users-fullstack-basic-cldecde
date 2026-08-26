import { NextFunction, Request, Response } from "express";
import { AuthPayload, verifyToken } from "../utils/jwt-utils.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token no proporcionado" });
  }

  const token = header?.split(" ")[1] as string;

  try {
    const payload = verifyToken(token);
    req.user = payload;
  } catch {
    res.status(401).json({ message: "Token invalido o expirado" });
  }
}
