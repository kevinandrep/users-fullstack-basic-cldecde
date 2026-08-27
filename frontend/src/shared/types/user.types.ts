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
