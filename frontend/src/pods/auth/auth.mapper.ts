import type { LoginResponseDto, RegisterResponseDto } from "./auth.types";
import type { User, LoginResponse } from "../../shared/types/";

export function mapLoginResponseDtoToLoginResponse(
  dto: LoginResponseDto,
): LoginResponse {
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
