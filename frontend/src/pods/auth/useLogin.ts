import type { LoginInput } from "@/shared/types/user.types";
import { useMutation } from "@tanstack/react-query";
import { loginApi } from "./auth.api";

export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) => loginApi(input),
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    },
  });
}
