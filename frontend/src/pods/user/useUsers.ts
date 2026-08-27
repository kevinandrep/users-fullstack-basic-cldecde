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
