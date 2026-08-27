import type { UserDto } from "./user.types";
import type { User } from "@/shared/types/";

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
