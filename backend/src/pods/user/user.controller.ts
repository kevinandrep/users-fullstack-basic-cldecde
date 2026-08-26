import { NextFunction, Request, Response } from "express";
import * as userService from "./user.service.js";

export async function createUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function getAllUsersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
}

export async function getUserByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params["id"] as string;
    const user = await userService.getUserById(id);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params["id"] as string;
    const user = await userService.updateUser(id, req.body);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

export async function deleteUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params["id"] as string;

    await userService.deleteUser(id);
    res.status(204).send();
  } catch (err) {
    res.status(401).json({ message: "Credenciales invalidas" });
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await userService.loginUser(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(401).json({ message: "Credenciales invalidas" });
  }
}
