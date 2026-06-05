import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Edit,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  RolUsuario,
  Usuario,
  usuariosService,
} from "@/lib/usuariosService";

const ROLES: RolUsuario[] = [
  "administrador",
  "oficinista",
  "chofer",
  "passenger",
];

const initialForm = {
  full_name: "",
  email: "",
  rol: "passenger" as RolUsuario,
};

export default function UsuariosPage() {
  const { user } = useAuth();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuariosService.getAll();

      const usuariosSinActual = data.filter(
        (usuario) => String(usuario.id) !== String(user?.id)
      );

      setUsuarios(usuariosSinActual);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      cargarUsuarios();
    }
  }, [user?.id]);

  const usuariosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return usuarios;

    return usuarios.filter((usuario) => {
      return (
        usuario.full_name?.toLowerCase().includes(term) ||
        usuario.email?.toLowerCase().includes(term) ||
        usuario.rol?.toLowerCase().includes(term)
      );
    });
  }, [usuarios, search]);

  const limpiarFormulario = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const validarFormulario = () => {
    if (!form.full_name.trim()) {
      toast.error("El nombre del usuario es obligatorio.");
      return false;
    }

    if (!form.email.trim()) {
      toast.error("El correo electrónico es obligatorio.");
      return false;
    }

    if (!form.email.includes("@")) {
      toast.error("Ingrese un correo electrónico válido.");
      return false;
    }

    if (!form.rol) {
      toast.error("Seleccione un rol para el usuario.");
      return false;
    }

    return true;
  };

  const guardarUsuario = async () => {
    if (!validarFormulario()) return;

    try {
      setSaving(true);

      if (editingId) {
        const actualizado = await usuariosService.update(editingId, {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          rol: form.rol,
        });

        setUsuarios((prev) =>
          prev.map((usuario) =>
            usuario.id === editingId ? actualizado : usuario
          )
        );

        toast.success("Usuario actualizado correctamente.");
      } else {
        const creado = await usuariosService.create({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          rol: form.rol,
        });

        setUsuarios((prev) => [creado, ...prev]);
        toast.success("Usuario creado correctamente.");
      }

      limpiarFormulario();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar el usuario.");
    } finally {
      setSaving(false);
    }
  };

  const editarUsuario = (usuario: Usuario) => {
    setEditingId(usuario.id);
    setForm({
      full_name: usuario.full_name ?? "",
      email: usuario.email ?? "",
      rol: usuario.rol,
    });
  };

  const eliminarUsuario = async (usuario: Usuario) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar al usuario ${usuario.full_name}?`
    );

    if (!confirmar) return;

    try {
      await usuariosService.delete(usuario.id);

      setUsuarios((prev) =>
        prev.filter((item) => item.id !== usuario.id)
      );

      if (editingId === usuario.id) {
        limpiarFormulario();
      }

      toast.success("Usuario eliminado correctamente.");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el usuario.");
    }
  };

  const cambiarRol = async (usuario: Usuario, rol: RolUsuario) => {
    try {
      const actualizado = await usuariosService.updateRol(usuario.id, rol);

      setUsuarios((prev) =>
        prev.map((item) =>
          item.id === usuario.id ? actualizado : item
        )
      );

      toast.success("Rol actualizado correctamente.");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cambiar el rol del usuario.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="h-6 w-6 text-primary" />
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-muted-foreground">
            Administra los usuarios registrados y modifica sus roles dentro del sistema.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={cargarUsuarios}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">
            {editingId ? "Editar usuario" : "Crear usuario"}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Nombre completo
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  full_name: e.target.value,
                }))
              }
              placeholder="Ej. Juan Pérez"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Correo electrónico
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              placeholder="usuario@correo.com"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Rol
            </label>
            <select
              value={form.rol}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  rol: e.target.value as RolUsuario,
                }))
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              {ROLES.map((rol) => (
                <option key={rol} value={rol}>
                  {rol}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button
            onClick={guardarUsuario}
            disabled={saving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving
              ? "Guardando..."
              : editingId
                ? "Actualizar usuario"
                : "Crear usuario"}
          </Button>

          {editingId && (
            <Button
              type="button"
              variant="outline"
              onClick={limpiarFormulario}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar edición
            </Button>
          )}
        </div>
      </section>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold">Usuarios registrados</h2>
            <p className="text-sm text-muted-foreground">
              Total de usuarios: {usuarios.length}
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, correo o rol..."
              className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Correo</th>
                <th className="px-5 py-3 font-medium">Rol</th>
                <th className="px-5 py-3 font-medium">Fecha de registro</th>
                <th className="px-5 py-3 text-right font-medium">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-muted-foreground"
                  >
                    Cargando usuarios...
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-muted-foreground"
                  >
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((usuario) => (
                  <tr
                    key={usuario.id}
                    className="border-t hover:bg-muted/30"
                  >
                    <td className="px-5 py-3 font-medium">
                      {usuario.full_name || "Sin nombre"}
                    </td>

                    <td className="px-5 py-3 text-muted-foreground">
                      {usuario.email}
                    </td>

                    <td className="px-5 py-3">
                      <select
                        value={usuario.rol}
                        onChange={(e) =>
                          cambiarRol(usuario, e.target.value as RolUsuario)
                        }
                        className="rounded-md border bg-background px-2 py-1 text-xs capitalize outline-none focus:ring-2 focus:ring-primary"
                      >
                        {ROLES.map((rol) => (
                          <option key={rol} value={rol}>
                            {rol}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-5 py-3 text-muted-foreground">
                      {usuario.created_at
                        ? new Date(usuario.created_at).toLocaleDateString()
                        : "No disponible"}
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editarUsuario(usuario)}
                          className="gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => eliminarUsuario(usuario)}
                          className="gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}