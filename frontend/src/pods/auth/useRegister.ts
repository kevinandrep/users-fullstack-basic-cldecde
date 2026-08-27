import type { RegisterInput } from "@/shared/types/user.types";
import { useMutation } from "@tanstack/react-query";
import { registerApi } from "./auth.api";

export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) => registerApi(input),
  });
}
