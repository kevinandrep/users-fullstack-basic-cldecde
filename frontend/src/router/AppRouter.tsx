import { createBrowserRouter, RouterProvider } from "react-router";
import { LoginPage, RegisterPage } from "../pods/auth";
import { HomePage } from "../pods/home/HomePage";
import { UserListPage } from "../pods/user";
import { ProtectedRoute } from "./ProtectedRoute";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [{ path: "/", element: <HomePage /> }],
  },
  {
    element: <ProtectedRoute allowedRoles={["ADMIN"]} />,
    children: [{ path: "/users", element: <UserListPage /> }],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
