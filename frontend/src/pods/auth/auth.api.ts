import { axiosClient } from "@/shared/api/";
import type { LoginInput, RegisterInput } from "@/shared/types/";
import type { LoginResponseDto, RegisterResponseDto } from "./auth.types";
import {
  mapLoginResponseDtoToLoginResponse,
  mapRegisterResponseDtoToUser,
} from "./auth.mapper";

export async function loginApi(input: LoginInput) {
  const { data } = await axiosClient.post<LoginResponseDto>(
    "/users/login",
    input,
  );
  return mapLoginResponseDtoToLoginResponse(data);
}

export async function registerApi(input: RegisterInput) {
  const { data } = await axiosClient.post<RegisterResponseDto>(
    "/users/register",
    input,
  );
  return mapRegisterResponseDtoToUser(data);
}
