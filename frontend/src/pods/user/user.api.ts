import { axiosClient } from "@/shared/api/";
import type { UserDto } from "./user.types";
import { mapUserDtoListToUserList } from "./user.mapper";

export async function getAllUsersApi() {
  const { data } = await axiosClient.get<UserDto[]>("/users");
  return mapUserDtoListToUserList(data);
}

export async function deleteUserApi(id: string) {
  await axiosClient.delete(`/users/${id}`);
}
