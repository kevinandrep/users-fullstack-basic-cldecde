import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().pipe(z.email()),
  password: z.string().min(6),
  name: z.string().min(2),
});

export const updateUserSchema = z.object({
  email: z.string().pipe(z.email()).optional(),
  name: z.string().min(2).optional(),
});

export const loginSchema = z.object({
  email: z.string().pipe(z.email()),
  password: z.string().min(1),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
