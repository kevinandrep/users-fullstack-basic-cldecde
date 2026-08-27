import { Navigate, Outlet } from "react-router";

interface ProtectedRouteProps {
  allowedRoles?: Array<"ADMIN" | "USER">;
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");

  if (!token || !userRaw) {
    return <Navigate to="/login"></Navigate>;
  }

  if (allowedRoles) {
    const user = JSON.parse(userRaw) as { role: "ADMIN" | "USER" };
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace></Navigate>;
    }
  }

  return <Outlet></Outlet>;
}
