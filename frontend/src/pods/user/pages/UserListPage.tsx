import { useUsers, useDeleteUser } from "../useUsers";

export function UserListPage() {
  const { data: users, isLoading, isError } = useUsers();
  const deleteMutation = useDeleteUser();

  if (isLoading) return <p>Cargando usuarios...</p>;
  if (isError) return <p>Error al cargar usuarios</p>;

  return (
    <div>
      <h1>Usuarios (solo ADMIN)</h1>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <button
                  onClick={() => deleteMutation.mutate(user.id)}
                  disabled={deleteMutation.isPending}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
