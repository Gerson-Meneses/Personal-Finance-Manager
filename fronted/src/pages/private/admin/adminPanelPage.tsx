import { useCallback, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useAdminUsers } from "../../../features/admin/hooks";
import { useIsAdmin } from "../../../features/auth/useIsAdmin";
import { useAuthContext } from "../../../features/auth/useAuthContext";
import type { AdminUser } from "../../../features/admin/types";
import { SearchInput } from "../../../shared/components/SearchInput/SearchInput";
import { useClientSearch } from "../../../shared/Hooks/UseClientSearch";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import InfoModal from "../../../shared/components/InfoModal/InfoModal";
import { useToast } from "../../../shared/Hooks/useToast";
import "./adminPanel.css";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminPanelPage() {
  const isAdmin = useIsAdmin();
  const { user } = useAuthContext();
  const { users, loading, isError, error, refetch, deleteUser } = useAdminUsers(isAdmin);

  const { search, setSearch, filtered } = useClientSearch<AdminUser>(
    useCallback(
      (u: AdminUser) => `${u.name} ${u.credential?.email ?? ""} ${u.country ?? ""}`,
      []
    )
  );

  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const toast = useToast();

  const visible = useMemo(() => filtered(users), [filtered, users]);

  if (!isAdmin) return <Navigate to="/" replace />;

  if (loading) return <LoadingScreen message="Cargando usuarios..." />;

  if (isError) {
    return (
      <div className="page-container admin-page">
        <header className="page-header card">
          <div>
            <h1>Panel de administración</h1>
            <p className="text-muted">Gestión de usuarios de la aplicación</p>
          </div>
        </header>
        <div className="card admin-error-card">
          <p>No se pudieron cargar los usuarios.</p>
          <p className="text-muted">{error?.message || "Error inesperado"}</p>
          <button type="button" className="btn-primary" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete || deleteUser.isPending) return;
    deleteUser.mutate(pendingDelete.id, {
      onSettled: () => setPendingDelete(null),
      onSuccess: () => toast.success("Usuario eliminado"),
      onError: (err) => setDeleteError(err.message || "No se pudo eliminar el usuario"),
    });
  };

  return (
    <div className="page-container admin-page">
      <header className="page-header card admin-header">
        <div>
          <h1>
            <ShieldCheck size={22} className="admin-title-icon" aria-hidden="true" />
            Panel de administración
          </h1>
          <p className="text-muted">
            {users.length} usuario{users.length !== 1 ? "s" : ""} registrado{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="admin-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, email o país..."
          />
          <button type="button" className="btn-secondary" onClick={() => refetch()}>
            <RefreshCw size={15} aria-hidden="true" />
            Actualizar
          </button>
        </div>
      </header>

      {deleteError && (
        <div className="admin-error-banner" role="alert">
          <span>{deleteError}</span>
          <button
            type="button"
            onClick={() => setDeleteError(null)}
            aria-label="Cerrar aviso"
            data-tooltip="Cerrar aviso"
            className="tooltip-left tooltip-anchor"
          >
            ✕
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="empty-state">
          {search ? (
            <>
              <p>No se encontraron usuarios para «{search}».</p>
              <button type="button" className="btn-ghost" onClick={() => setSearch("")}>
                Limpiar búsqueda
              </button>
            </>
          ) : (
            <p>No hay usuarios registrados.</p>
          )}
        </div>
      ) : (
        <div className="card admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>País</th>
                <th>Rol</th>
                <th>Verificado</th>
                <th>Registrado</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => {
                const isSelf = u.id === user?.id;
                return (
                  <tr key={u.id}>
                    <td data-label="Usuario">
                      <div className="admin-user-cell">
                        <span className="admin-user-avatar" aria-hidden="true">
                          {getInitials(u.name)}
                        </span>
                        <div className="admin-user-meta">
                          <span className="admin-user-name">{u.name}</span>
                          <span className="admin-user-phone">{u.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Email">{u.credential?.email ?? "—"}</td>
                    <td data-label="País">{u.country || "—"}</td>
                    <td data-label="Rol">
                      <span className={`admin-badge ${u.isAdmin ? "is-admin" : "is-user"}`}>
                        {u.isAdmin ? "Admin" : "Usuario"}
                      </span>
                    </td>
                    <td data-label="Verificado">
                      <span className={`admin-badge ${u.is_verified ? "is-verified" : "is-pending"}`}>
                        {u.is_verified ? "Sí" : "No"}
                      </span>
                    </td>
                    <td data-label="Registrado">{formatDate(u.createdAt)}</td>
                    <td className="admin-actions">
                      <button
                        type="button"
                        className="admin-delete-btn tooltip-left"
                        onClick={() => {
                          setDeleteError(null);
                          setPendingDelete(u);
                        }}
                        disabled={isSelf || deleteUser.isPending}
                        aria-label={`Eliminar ${u.name}`}
                        data-tooltip={
                          isSelf
                            ? "No puedes eliminar tu propia cuenta"
                            : deleteUser.isPending
                              ? "Eliminando…"
                              : `Eliminar usuario: ${u.name}`
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <InfoModal
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        type="error"
        title="Eliminar usuario"
        message={`¿Eliminar al usuario "${pendingDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText={deleteUser.isPending ? "Eliminando…" : "Eliminar"}
        cancelText="Cancelar"
        confirmDisabled={deleteUser.isPending}
      />
    </div>
  );
}
