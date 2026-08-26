import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

export function validate(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res
        .status(400)
        .json({ message: "datos invalidos", errors: result.error.issues });
    }

    req.body = result.data;

    next();
  };
}
