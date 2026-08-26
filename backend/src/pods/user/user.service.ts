import { prisma } from "../../shared/db/prisma.client.js";
import { signToken } from "../../shared/utils/jwt-utils.js";
import {
  comparePassword,
  hashPassword,
} from "../../shared/utils/password-util.js";
import { CreateUserInput, LoginInput, UpdateUserInput } from "./user.schema.js";

export async function createUser(data: CreateUserInput) {
  const hashed = await hashPassword(data.password);
  return prisma.user.create({
    data: { email: data.email, password: hashed, name: data.name },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}

export async function getAllUsers() {
  return prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}

export async function updateUser(id: string, data: UpdateUserInput) {
  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, updatedAt: true },
  });
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}

export async function loginUser(data: LoginInput) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: data.email },
  });
  const valid = await comparePassword(data.password, user.password);

  if (!valid) {
    throw new Error("Credenciales inválidas");
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}
