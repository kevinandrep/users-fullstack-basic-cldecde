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
