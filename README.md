# 🧩 Guía Completa: CRUD de Usuarios Fullstack con Auth JWT y Roles

> **Stack:** Node.js + TypeScript 7 + Express 5 + Prisma 7 + Zod v4 + PostgreSQL (backend) · Vite + React 19 + TypeScript + React Router v8 + Axios + TanStack Query (frontend)
> **Entorno:** Windows + PowerShell + pnpm
> **Arquitectura:** Pods (router → controller → service → schema) con barrels `index.ts`

---

## 📋 Tabla de contenidos

1. [Reglas de oro del stack](#reglas-de-oro-del-stack)
2. [Parte 1 — Backend](#parte-1--backend)
   - [1.1 Estructura inicial](#11-estructura-inicial)
   - [1.2 Instalación de dependencias](#12-instalación-de-dependencias)
   - [1.3 Configuración de TypeScript](#13-configuración-de-typescript)
   - [1.4 Prisma: init, schema y adapter](#14-prisma-init-schema-y-adapter)
   - [1.5 Base de datos en pgAdmin](#15-base-de-datos-en-pgadmin)
   - [1.6 Carpeta shared (db, utils, middlewares)](#16-carpeta-shared-db-utils-middlewares)
   - [1.7 Pod user (schema → service → controller → router)](#17-pod-user-schema--service--controller--router)
   - [1.8 app.ts y server.ts](#18-appts-y-serverts)
   - [1.9 Probar el backend](#19-probar-el-backend)
3. [Parte 2 — Frontend](#parte-2--frontend)
   - [2.1 Crear el proyecto Vite](#21-crear-el-proyecto-vite)
   - [2.2 Estructura y variables de entorno](#22-estructura-y-variables-de-entorno)
   - [2.3 Cliente Axios y QueryClient](#23-cliente-axios-y-queryclient)
   - [2.4 Pod auth (DTO, mapper, api, hooks, páginas)](#24-pod-auth-dto-mapper-api-hooks-páginas)
   - [2.5 Pod user (lista y borrado)](#25-pod-user-lista-y-borrado)
   - [2.6 Router con guards por rol](#26-router-con-guards-por-rol)
4. [Parte 3 — Conectar todo](#parte-3--conectar-todo)
   - [3.1 CORS en el backend](#31-cors-en-el-backend)
   - [3.2 Flujo de prueba end-to-end](#32-flujo-de-prueba-end-to-end)
5. [Git y control de versiones](#git-y-control-de-versiones)
6. [Lecciones clave del stack nuevo](#lecciones-clave-del-stack-nuevo)

---

## Reglas de oro del stack

Estas reglas evitan el 90% de los errores típicos con este stack (versiones nuevas: TS7, Express 5, Prisma 7, Zod v4):

| # | Regla |
|---|-------|
| 1 | `tsconfig.json` del **backend** siempre con `module: "NodeNext"` y `moduleResolution: "NodeNext"`. Nunca `commonjs` ni `moduleResolution: "node"`. |
| 2 | Con NodeNext + ESM, **todo import relativo entre archivos `.ts` propios necesita la extensión `.js`** (ej: `from "./x.service.js"`). Esto **no aplica al frontend** (Vite usa `moduleResolution: "bundler"`, ahí los imports van sin extensión). |
| 3 | En `schema.prisma`, el `datasource` **no lleva `url`** (eso va en `prisma.config.ts`). El `generator client` lleva `output` apuntando dentro de `src` **antes** de correr cualquier `generate`/`migrate`. |
| 4 | En `prisma.config.ts`, usa `env("DATABASE_URL")` como función — nunca `process.env["DATABASE_URL"]` con corchetes (rompe el tipado y requiere `@types/node` innecesariamente ahí). |
| 5 | `@prisma/client` se instala **explícitamente** (`pnpm add @prisma/client`), incluso con el provider nuevo `prisma-client`. No basta con tener `prisma` como dev dependency. |
| 6 | Con el provider `prisma-client` (sin motor Rust), además necesitas el **adapter de conexión**: `pnpm add @prisma/adapter-pg pg` + `pnpm add -D @types/pg`. |
| 7 | Flujo de Prisma: si cambias el **modelo** → `pnpm prisma migrate dev --name x` (regenera el client solo). Si solo cambias el **generator/output** sin tocar el modelo → hace falta `pnpm prisma generate` manual. |
| 8 | Evita genéricos `<T>` o inferencia avanzada de Zod para problemas simples. Prefiere interfaces fijas y casts explícitos (`as Tipo`) cuando TypeScript se queja. |
| 9 | **CORS no es opcional** en un proyecto con frontend y backend en puertos distintos — configúralo desde el arranque del backend. |
| 10 | `git add -A` en vez de `git add .` en monorepos con subcarpetas, para no perder cambios de otra carpeta al hacer commit desde adentro de una de ellas. |

---

## Parte 1 — Backend

### 1.1 Estructura inicial

```powershell
New-Item -ItemType Directory -Path "users-fullstack" | Out-Null
Set-Location "users-fullstack"
New-Item -ItemType Directory -Path "backend" | Out-Null
New-Item -ItemType Directory -Path "frontend" | Out-Null

Set-Location "backend"
pnpm init
```

En el `package.json` generado, confirma que tenga (en pnpm recientes ya viene por defecto):

```json
"type": "module"
```

### 1.2 Instalación de dependencias

```powershell
# Producción
pnpm add express zod bcrypt jsonwebtoken dotenv cors

# Desarrollo
pnpm add -D typescript@latest tsx @types/node @types/express @types/bcrypt @types/jsonwebtoken @types/cors

# Prisma CLI
pnpm add -D prisma@latest

# Prisma Client + adapter de Postgres (necesario con el provider "prisma-client")
pnpm add @prisma/client @prisma/adapter-pg pg
pnpm add -D @types/pg
```

Verifica versiones:

```powershell
pnpm exec tsc --version
pnpm exec prisma --version
```

### 1.3 Configuración de TypeScript

```powershell
New-Item -ItemType File -Path "tsconfig.json" | Out-Null
```

**`tsconfig.json`:**

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

Estructura base:

```powershell
New-Item -ItemType Directory -Path "src" | Out-Null
New-Item -ItemType File -Path "src/app.ts" | Out-Null
New-Item -ItemType File -Path "src/server.ts" | Out-Null
```

### 1.4 Prisma: init, schema y adapter

```powershell
pnpm exec prisma init
```

Esto genera `prisma/schema.prisma`, `prisma.config.ts` y `.env`.

**`prisma.config.ts`:**

```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

**`prisma/schema.prisma`** — edita el `generator` y agrega el modelo:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum Role {
  ADMIN
  USER
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

> - `@id @default(uuid())` → el id se genera solo.
> - `@unique` en `email` → Postgres rechaza duplicados a nivel de base, no solo en Zod.
> - `@@map("users")` → la tabla en Postgres se llama `users` en minúsculas/plural, aunque el modelo se llame `User`.

### 1.5 Base de datos en pgAdmin

1. Abre pgAdmin, conéctate a tu servidor local.
2. Click derecho en **Databases** → **Create** → **Database...**
3. Nombre: el que pongas en tu `.env` (ej. `users_db`).
4. Save. Debe quedar **vacía**, sin tablas — Prisma las crea con la migración.

**`.env`** (raíz de `backend`):

```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/users_db?schema=public"
JWT_SECRET="una-clave-secreta-larga-y-random-para-desarrollo"
PORT=3000
```

Primera migración (regenera el client automáticamente):

```powershell
pnpm exec prisma migrate dev --name init
```

Verifica que se generó el client:

```powershell
Get-ChildItem "src/generated/prisma"
```

### 1.6 Carpeta shared (db, utils, middlewares)

```powershell
New-Item -ItemType Directory -Path "src/shared/db" -Force | Out-Null
New-Item -ItemType Directory -Path "src/shared/utils" -Force | Out-Null
New-Item -ItemType Directory -Path "src/shared/middlewares" -Force | Out-Null
```

#### `src/shared/db/prisma.client.ts`

```typescript
import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env["DATABASE_URL"] as string,
});

export const prisma = new PrismaClient({ adapter });
```

> El `adapter` es el puente real que abre la conexión TCP a Postgres — con el provider `prisma-client` (sin motor Rust), este paso es obligatorio.

#### `src/shared/db/index.ts`

```typescript
export { prisma } from "./prisma.client.js";
```

#### `src/shared/utils/password.util.ts`

```typescript
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
```

#### `src/shared/utils/jwt.util.ts`

```typescript
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
```

#### `src/shared/utils/index.ts`

```typescript
export { hashPassword, comparePassword } from "./password.util.js";
export { signToken, verifyToken } from "./jwt.util.js";
export type { AuthPayload } from "./jwt.util.js";
```

#### `src/shared/middlewares/authenticate.middleware.ts`

```typescript
import type { Request, Response, NextFunction } from "express";
import { verifyToken, type AuthPayload } from "../utils/index.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token no proporcionado" });
    return;
  }

  const token = header.split(" ")[1] as string;

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Token inválido o expirado" });
  }
}
```

> `declare global` le enseña a TypeScript que `req.user` puede existir; sin esto se quejaría porque `Request` de Express no trae ese campo por defecto.

#### `src/shared/middlewares/authorize.middleware.ts`

```typescript
import type { Request, Response, NextFunction } from "express";

export function authorize(...allowedRoles: Array<"ADMIN" | "USER">) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: "No tienes permisos para esta acción" });
      return;
    }
    next();
  };
}
```

#### `src/shared/middlewares/validate.middleware.ts`

```typescript
import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

export function validate(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({ message: "Datos inválidos", errors: result.error.issues });
      return;
    }

    req.body = result.data;
    next();
  };
}
```

#### `src/shared/middlewares/errorHandler.middleware.ts`

```typescript
import type { Request, Response, NextFunction } from "express";
import { Prisma } from "../../generated/prisma/client.js";

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  console.error(err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = err as Prisma.PrismaClientKnownRequestError;

    if (prismaError.code === "P2002") {
      res.status(409).json({ message: "El recurso ya existe (campo único duplicado)" });
      return;
    }
    if (prismaError.code === "P2025") {
      res.status(404).json({ message: "Recurso no encontrado" });
      return;
    }
  }

  res.status(500).json({ message: "Error interno del servidor" });
}
```

> Se usa un cast explícito (`as Prisma.PrismaClientKnownRequestError`) porque TypeScript no siempre infiere solo el tipo dentro del `if`, incluso después del `instanceof`.

#### `src/shared/middlewares/index.ts`

```typescript
export { authenticate } from "./authenticate.middleware.js";
export { authorize } from "./authorize.middleware.js";
export { validate } from "./validate.middleware.js";
export { errorHandler } from "./errorHandler.middleware.js";
```

### 1.7 Pod user (schema → service → controller → router)

```powershell
New-Item -ItemType Directory -Path "src/pods/user" -Force | Out-Null
```

#### `src/pods/user/user.schema.ts`

```typescript
import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

#### `src/pods/user/user.service.ts`

```typescript
import { prisma } from "../../shared/db/index.js";
import { hashPassword, comparePassword, signToken } from "../../shared/utils/index.js";
import type { CreateUserInput, UpdateUserInput, LoginInput } from "./user.schema.js";

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
  const user = await prisma.user.findUniqueOrThrow({ where: { email: data.email } });
  const valid = await comparePassword(data.password, user.password);

  if (!valid) {
    throw new Error("Credenciales inválidas");
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
}
```

> `select` en cada query es para nunca devolver el `password` hasheado al frontend.

#### `src/pods/user/user.controller.ts`

```typescript
import type { Request, Response, NextFunction } from "express";
import * as userService from "./user.service.js";

export async function createUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function getAllUsersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
}

export async function getUserByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    const user = await userService.getUserById(id);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    const user = await userService.updateUser(id, req.body);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

export async function deleteUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    await userService.deleteUser(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.loginUser(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(401).json({ message: "Credenciales inválidas" });
  }
}
```

> `req.params["id"] as string` en vez de `req.params.id` — con `strict: true` de TS7, acceder a params por índice puede venir tipado como `string | undefined`, y el cast lo resuelve simple.

#### `src/pods/user/user.router.ts`

```typescript
import { Router } from "express";
import * as controller from "./user.controller.js";
import { validate, authenticate, authorize } from "../../shared/middlewares/index.js";
import { createUserSchema, updateUserSchema, loginSchema } from "./user.schema.js";

export const userRouter = Router();

// Públicas
userRouter.post("/register", validate(createUserSchema), controller.createUserHandler);
userRouter.post("/login", validate(loginSchema), controller.loginHandler);

// Protegidas — cualquier usuario autenticado
userRouter.get("/me/:id", authenticate, controller.getUserByIdHandler);
userRouter.patch("/me/:id", authenticate, validate(updateUserSchema), controller.updateUserHandler);

// Protegidas — solo ADMIN
userRouter.get("/", authenticate, authorize("ADMIN"), controller.getAllUsersHandler);
userRouter.delete("/:id", authenticate, authorize("ADMIN"), controller.deleteUserHandler);
```

#### `src/pods/user/index.ts`

```typescript
export { userRouter } from "./user.router.js";
```

### 1.8 app.ts y server.ts

#### `src/app.ts`

```typescript
import express from "express";
import cors from "cors";
import { userRouter } from "./pods/user/index.js";
import { errorHandler } from "./shared/middlewares/index.js";

export const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use("/api/users", userRouter);

app.use(errorHandler);
```

> `cors()` agrega los headers que el navegador exige para permitir que el frontend (`localhost:5173`) le hable al backend (`localhost:3000`) — sin esto, el navegador bloquea la respuesta aunque el backend la haya procesado bien.

#### `src/server.ts`

```typescript
import "dotenv/config";
import { app } from "./app.js";

const PORT = process.env["PORT"] ?? 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
```

> El `import "dotenv/config"` va **primero**, antes de importar `app.js`, así las variables de entorno ya están cargadas cuando `prisma.client.ts` las lee para el adapter.

Script de arranque en `package.json`:

```json
"scripts": {
  "dev": "tsx watch src/server.ts"
}
```

### 1.9 Probar el backend

```powershell
pnpm exec tsc --noEmit
pnpm run dev
```

Con Insomnia/Postman:

**Registro** — `POST http://localhost:3000/api/users/register`
```json
{
  "email": "admin@test.com",
  "password": "123456",
  "name": "Admin User"
}
```

**Login** — `POST http://localhost:3000/api/users/login`
```json
{
  "email": "admin@test.com",
  "password": "123456"
}
```

Para probar rutas de ADMIN, promueve el usuario directo en pgAdmin (Query Tool):

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@test.com';
```

> El rol viaja **dentro del JWT**, así que después de este UPDATE debes volver a hacer login para obtener un token nuevo con `role: "ADMIN"`.

Luego prueba:
- `GET /api/users` (header `Authorization: Bearer <token>`) → 200 solo con token de ADMIN, 403 con token de USER, 401 sin token.
- `GET /api/users/me/:id` → 200 con cualquier usuario autenticado.

---

## Parte 2 — Frontend

### 2.1 Crear el proyecto Vite

```powershell
Set-Location "../frontend"
pnpm create vite@latest . -- --template react-ts
pnpm install
pnpm add react-router axios @tanstack/react-query
pnpm add -D typescript@latest
```

> Desde React Router v7+, ya no existe `react-router-dom` — todo se importa directo de `react-router`.
>
> ⚠️ **A diferencia del backend, aquí NO se toca el `moduleResolution` del `tsconfig.json`** (Vite ya trae `"bundler"` por defecto) y los imports relativos **no llevan `.js`**.

### 2.2 Estructura y variables de entorno

```powershell
New-Item -ItemType Directory -Path "src/pods" -Force | Out-Null
New-Item -ItemType Directory -Path "src/shared/api" -Force | Out-Null
New-Item -ItemType Directory -Path "src/shared/types" -Force | Out-Null
New-Item -ItemType Directory -Path "src/router" -Force | Out-Null
New-Item -ItemType File -Path ".env" | Out-Null
```

**`.env`:**
```env
VITE_API_URL=http://localhost:3000/api
```

> Vite solo expone al cliente las variables que empiezan con `VITE_`.

**`src/shared/types/user.types.ts`** (modelo de dominio que usa toda la UI):

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
  createdAt?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}
```

**`src/shared/types/index.ts`:**

```typescript
export type { User, LoginResponse, LoginInput, RegisterInput } from "./user.types";
```

### 2.3 Cliente Axios y QueryClient

**`src/shared/api/axiosClient.ts`:**

```typescript
import axios from "axios";

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**`src/shared/api/queryClient.ts`:**

```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minuto
      retry: 1,
    },
  },
});
```

**`src/shared/api/index.ts`:**

```typescript
export { axiosClient } from "./axiosClient";
export { queryClient } from "./queryClient";
```

### 2.4 Pod auth (DTO, mapper, api, hooks, páginas)

> **Patrón de mappers:** cada pod define su propio DTO (la forma cruda que manda el backend) y un mapper que lo convierte al modelo de dominio en `shared/types`. Así el resto de la app nunca depende de los nombres exactos de campos del backend.

```powershell
New-Item -ItemType Directory -Path "src/pods/auth/pages" -Force | Out-Null
```

**`src/pods/auth/auth.types.ts`** (DTOs crudos):

```typescript
export interface LoginResponseDto {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "USER";
  };
}

export interface RegisterResponseDto {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
  createdAt: string;
}
```

**`src/pods/auth/auth.mapper.ts`:**

```typescript
import type { LoginResponseDto, RegisterResponseDto } from "./auth.types";
import type { User, LoginResponse } from "../../shared/types";

export function mapLoginResponseDtoToLoginResponse(dto: LoginResponseDto): LoginResponse {
  return {
    token: dto.token,
    user: {
      id: dto.user.id,
      email: dto.user.email,
      name: dto.user.name,
      role: dto.user.role,
    },
  };
}

export function mapRegisterResponseDtoToUser(dto: RegisterResponseDto): User {
  return {
    id: dto.id,
    email: dto.email,
    name: dto.name,
    role: dto.role,
    createdAt: dto.createdAt,
  };
}
```

**`src/pods/auth/auth.api.ts`:**

```typescript
import { axiosClient } from "../../shared/api";
import type { LoginInput, RegisterInput } from "../../shared/types";
import type { LoginResponseDto, RegisterResponseDto } from "./auth.types";
import { mapLoginResponseDtoToLoginResponse, mapRegisterResponseDtoToUser } from "./auth.mapper";

export async function loginApi(input: LoginInput) {
  const { data } = await axiosClient.post<LoginResponseDto>("/users/login", input);
  return mapLoginResponseDtoToLoginResponse(data);
}

export async function registerApi(input: RegisterInput) {
  const { data } = await axiosClient.post<RegisterResponseDto>("/users/register", input);
  return mapRegisterResponseDtoToUser(data);
}
```

**`src/pods/auth/useLogin.ts`:**

```typescript
import { useMutation } from "@tanstack/react-query";
import { loginApi } from "./auth.api";
import type { LoginInput } from "../../shared/types";

export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) => loginApi(input),
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    },
  });
}
```

> `useMutation` es para acciones que cambian datos (login, crear, borrar); `useQuery` es para leer datos.

**`src/pods/auth/useRegister.ts`:**

```typescript
import { useMutation } from "@tanstack/react-query";
import { registerApi } from "./auth.api";
import type { RegisterInput } from "../../shared/types";

export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) => registerApi(input),
  });
}
```

**`src/pods/auth/pages/LoginPage.tsx`:**

```typescript
import { useState } from "react";
import { useNavigate } from "react-router";
import { useLogin } from "../useLogin";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const loginMutation = useLogin();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    loginMutation.mutate(
      { email, password },
      { onSuccess: () => navigate("/") }
    );
  }

  return (
    <div>
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Ingresando..." : "Ingresar"}
        </button>
        {loginMutation.isError && <p style={{ color: "red" }}>Credenciales inválidas</p>}
      </form>
    </div>
  );
}
```

**`src/pods/auth/pages/RegisterPage.tsx`:**

```typescript
import { useState } from "react";
import { useNavigate } from "react-router";
import { useRegister } from "../useRegister";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const registerMutation = useRegister();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    registerMutation.mutate(
      { email, password, name },
      { onSuccess: () => navigate("/login") }
    );
  }

  return (
    <div>
      <h1>Registrarse</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        <button type="submit" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? "Creando..." : "Crear cuenta"}
        </button>
        {registerMutation.isError && <p style={{ color: "red" }}>Error al registrar</p>}
      </form>
    </div>
  );
}
```

**`src/pods/auth/index.ts`:**

```typescript
export { loginApi, registerApi } from "./auth.api";
export { useLogin } from "./useLogin";
export { useRegister } from "./useRegister";
export { LoginPage } from "./pages/LoginPage";
export { RegisterPage } from "./pages/RegisterPage";
```

### 2.5 Pod user (lista y borrado)

```powershell
New-Item -ItemType Directory -Path "src/pods/user/pages" -Force | Out-Null
```

**`src/pods/user/user.types.ts`:**

```typescript
export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
  createdAt: string;
}
```

**`src/pods/user/user.mapper.ts`:**

```typescript
import type { UserDto } from "./user.types";
import type { User } from "../../shared/types";

export function mapUserDtoToUser(dto: UserDto): User {
  return {
    id: dto.id,
    email: dto.email,
    name: dto.name,
    role: dto.role,
    createdAt: dto.createdAt,
  };
}

export function mapUserDtoListToUserList(dtos: UserDto[]): User[] {
  return dtos.map(mapUserDtoToUser);
}
```

**`src/pods/user/user.api.ts`:**

```typescript
import { axiosClient } from "../../shared/api";
import type { UserDto } from "./user.types";
import { mapUserDtoListToUserList } from "./user.mapper";

export async function getAllUsersApi() {
  const { data } = await axiosClient.get<UserDto[]>("/users");
  return mapUserDtoListToUserList(data);
}

export async function deleteUserApi(id: string) {
  await axiosClient.delete(`/users/${id}`);
}
```

**`src/pods/user/useUsers.ts`:**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllUsersApi, deleteUserApi } from "./user.api";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: getAllUsersApi,
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUserApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
```

> `invalidateQueries` le dice a TanStack Query "esta data ya no es válida, vuelve a pedirla" — la lista se refresca sola después de borrar, sin actualizarla a mano.

**`src/pods/user/pages/UserListPage.tsx`:**

```typescript
import { useUsers, useDeleteUser } from "../useUsers";

export function UserListPage() {
  const { data: users, isLoading, isError } = useUsers();
  const deleteMutation = useDeleteUser();

  if (isLoading) return <p>Cargando usuarios...</p>;
  if (isError) return <p>Error al cargar usuarios</p>;

  return (
    <div>
      <h1>Usuarios (solo ADMIN)</h1>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <button onClick={() => deleteMutation.mutate(user.id)} disabled={deleteMutation.isPending}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**`src/pods/user/index.ts`:**

```typescript
export { getAllUsersApi, deleteUserApi } from "./user.api";
export { useUsers, useDeleteUser } from "./useUsers";
export { UserListPage } from "./pages/UserListPage";
```

### 2.6 Router con guards por rol

```powershell
New-Item -ItemType Directory -Path "src/pods/home" -Force | Out-Null
```

**`src/pods/home/HomePage.tsx`:**

```typescript
import { useNavigate } from "react-router";

export function HomePage() {
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <div>
      <h1>Bienvenido, {user?.name}</h1>
      <p>Rol: {user?.role}</p>
      {user?.role === "ADMIN" && (
        <p><a href="/users">Ver todos los usuarios</a></p>
      )}
      <button onClick={handleLogout}>Cerrar sesión</button>
    </div>
  );
}
```

**`src/router/ProtectedRoute.tsx`:**

```typescript
import { Navigate, Outlet } from "react-router";

interface ProtectedRouteProps {
  allowedRoles?: Array<"ADMIN" | "USER">;
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");

  if (!token || !userRaw) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const user = JSON.parse(userRaw) as { role: "ADMIN" | "USER" };
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}
```

> `<Outlet />` es donde React Router renderiza la ruta hija que coincidió — patrón estándar para layouts/guards que envuelven varias rutas.

**`src/router/AppRouter.tsx`:**

```typescript
import { createBrowserRouter, RouterProvider } from "react-router";
import { LoginPage, RegisterPage } from "../pods/auth";
import { HomePage } from "../pods/home/HomePage";
import { UserListPage } from "../pods/user";
import { ProtectedRoute } from "./ProtectedRoute";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [{ path: "/", element: <HomePage /> }],
  },
  {
    element: <ProtectedRoute allowedRoles={["ADMIN"]} />,
    children: [{ path: "/users", element: <UserListPage /> }],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
```

**`src/router/index.ts`:**

```typescript
export { AppRouter } from "./AppRouter";
```

**`src/App.tsx`:**

```typescript
import { AppRouter } from "./router";

function App() {
  return <AppRouter />;
}

export default App;
```

**`src/main.tsx`:**

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./shared/api";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
```

---

## Parte 3 — Conectar todo

### 3.1 CORS en el backend

Ya incluido en el `app.ts` de la [sección 1.8](#18-appts-y-serverts), pero es el paso que **más falla si se olvida**: sin `cors({ origin: "http://localhost:5173" })`, el navegador bloquea toda petición del frontend al backend aunque ambos estén corriendo correctamente.

### 3.2 Flujo de prueba end-to-end

1. Backend corriendo (`pnpm run dev` en `backend`) y frontend corriendo (`pnpm run dev` en `frontend`).
2. `/register` → crear un usuario nuevo (rol `USER` por defecto).
3. `/login` con ese usuario → redirige a `/` (Home), sin ver el link a `/users` (no es ADMIN).
4. Cerrar sesión → vuelve a `/login`.
5. Promover un usuario a `ADMIN` vía SQL en pgAdmin, volver a loguearse con él.
6. En Home, ahora sí aparece el link "Ver todos los usuarios" → entrar a `/users`.
7. La tabla carga todos los usuarios. Botón "Eliminar" quita un usuario sin recargar la página (gracias a `invalidateQueries`).

---

## Git y control de versiones

### `.gitignore` en la raíz del proyecto

```gitignore
node_modules/
dist/
.env
src/generated/
*.log

# Prisma AI skills (auto-generados por prisma init)
.claude/
.agents/
.windsurf/
skills-lock.json
```

> `src/generated/` se ignora porque es código regenerable (`prisma generate` lo recrea). Vite trae su propio `.gitignore` dentro de `frontend/` — no hay conflicto, los `.gitignore` anidados se combinan, no se pisan.

### Flujo de commits

```powershell
git init
git add -A
git commit -m "mensaje descriptivo"
git branch -M main
git remote add origin https://github.com/usuario/repo.git
git push -u origin main
```

> Usa siempre `git add -A` (no `git add .`) en monorepos con subcarpetas — `git add .` solo agrega cambios de la carpeta donde estás parado, mientras que `git commit`/`git push` siempre operan sobre todo el repo sin importar dónde estés.

---

## Lecciones clave del stack nuevo

- **Provider `prisma-client`** (sin motor Rust): necesita `@prisma/adapter-pg` + `pg` instalados explícitamente, y `@prisma/client` como dependencia real, aunque el `output` esté configurado dentro de `src/generated`.
- **`errorHandler` con Prisma 7:** el `instanceof Prisma.PrismaClientKnownRequestError` no siempre narrowea el tipo de `err` automáticamente en el `if` — se necesita un cast explícito adicional.
- **React Router v8** es casi idéntico a v7 en la API que se usa a diario (`createBrowserRouter`, `RouterProvider`, `Outlet`, hooks). El único cambio real es que `react-router-dom` ya no existe — todo se importa de `react-router`.
- **TypeScript en frontend vs. backend:** el backend corre con Node directo (necesita `NodeNext` + extensiones `.js` en imports); el frontend lo empaqueta Vite (usa `moduleResolution: "bundler"`, sin extensiones en imports). Son reglas distintas para cada lado, no una única regla global.
- **CORS** siempre se configura desde el principio del backend cuando frontend y backend corren en puertos distintos — un error de CORS bloqueado por el navegador puede disfrazarse de "credenciales inválidas" si el manejo de errores del frontend es genérico.
- **`git add -A`** en vez de `git add .` en monorepos, para no perder cambios de otras carpetas al hacer commit desde dentro de una subcarpeta.
