import { NextFunction, Request, Response } from "express";

export function authorize(...allowedRules: Array<"ADMIN" | "USER">) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.status(403).json({ message: "no teiens permisos para esta accion" });

    next();
  };
}
