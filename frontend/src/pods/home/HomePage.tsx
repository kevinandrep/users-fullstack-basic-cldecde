import { useNavigate } from "react-router";

export function HomePage() {
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <div>
      <h1>Bienvenido, {user?.name}</h1>
      <p>Rol: {user?.role}</p>
      {user?.role === "ADMIN" && (
        <p>
          <a href="/users">Ver todos los usuarios</a>
        </p>
      )}
      <button onClick={handleLogout}>Cerrar sesión</button>
    </div>
  );
}
