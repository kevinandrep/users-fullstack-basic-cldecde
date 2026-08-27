import { useState } from "react";
import { useNavigate } from "react-router";
import { useLogin } from "../useLogin";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const loginMutation = useLogin();

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    loginMutation.mutate(
      { email, password },
      { onSuccess: () => navigate("/") },
    );
  }

  return (
    <div>
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Ingresando..." : "Ingresar"}
        </button>
        {loginMutation.isError && (
          <p style={{ color: "red" }}>Credenciales inválidas</p>
        )}
      </form>
    </div>
  );
}
