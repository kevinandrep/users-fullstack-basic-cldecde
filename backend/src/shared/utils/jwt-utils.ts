import jwt from "jsonwebtoken";

export interface AuthPayload {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
}

const JWT_SECRET = process.env["JWT_SECRET"] as string;

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as unknown as AuthPayload;
}
