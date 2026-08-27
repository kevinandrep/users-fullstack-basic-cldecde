import { useState } from "react";
import { useNavigate } from "react-router";
import { useRegister } from "../useRegister";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const registerMutation = useRegister();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    registerMutation.mutate(
      { email, password, name },
      { onSuccess: () => navigate("/login") },
    );
  }

  return (
    <div>
      <h1>Registrarse</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
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
            minLength={6}
          />
        </div>
        <button type="submit" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? "Creando..." : "Crear cuenta"}
        </button>
        {registerMutation.isError && (
          <p style={{ color: "red" }}>Error al registrar</p>
        )}
      </form>
    </div>
  );
}
