import { supabase } from "@/integrations/supabase/client";

export type RolUsuario = "administrador" | "oficinista" | "chofer" | "passenger";

export interface Usuario {
  id: string;
  full_name: string;
  email: string;
  rol: RolUsuario;
  created_at?: string | null;
}

export interface UsuarioCreate {
  full_name: string;
  email: string;
  rol: RolUsuario;
}

export interface UsuarioUpdate {
  full_name?: string;
  email?: string;
  rol?: RolUsuario;
}

export const usuariosService = {
  async getAll(): Promise<Usuario[]> {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, full_name, email, rol, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al obtener usuarios:", error);
      throw new Error("No se pudieron cargar los usuarios.");
    }

    return (data ?? []) as Usuario[];
  },

  async create(usuario: UsuarioCreate): Promise<Usuario> {
    const { data, error } = await supabase
      .from("usuarios")
      .insert([
        {
          id: crypto.randomUUID(),
          full_name: usuario.full_name,
          email: usuario.email,
          rol: usuario.rol,
        },
      ])
      .select("id, full_name, email, rol, created_at")
      .single();

    if (error) {
      console.error("Error al crear usuario:", error);
      throw new Error("No se pudo crear el usuario.");
    }

    return data as Usuario;
  },

  async update(id: string, usuario: UsuarioUpdate): Promise<Usuario> {
    const { data, error } = await supabase
      .from("usuarios")
      .update(usuario)
      .eq("id", id)
      .select("id, full_name, email, rol, created_at")
      .single();

    if (error) {
      console.error("Error al actualizar usuario:", error);
      throw new Error("No se pudo actualizar el usuario.");
    }

    return data as Usuario;
  },

  async updateRol(id: string, rol: RolUsuario): Promise<Usuario> {
    const { data, error } = await supabase
      .from("usuarios")
      .update({ rol })
      .eq("id", id)
      .select("id, full_name, email, rol, created_at")
      .single();

    if (error) {
      console.error("Error al cambiar rol:", error);
      throw new Error("No se pudo actualizar el rol del usuario.");
    }

    return data as Usuario;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("usuarios")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error al eliminar usuario:", error);
      throw new Error("No se pudo eliminar el usuario.");
    }
  },
};