import { supabase } from "@/integrations/supabase/client";

export interface Cooperativa {
  id: number;
  nombre: string;
  ruc: string;
  estado: string;
  ciudad_principal: string | null;
  logo_url: string | null;
}

export interface CooperativaUpdate {
  nombre: string;
  ruc: string;
  ciudad_principal: string | null;
  logo_url: string | null;
}

export type CooperativaInsert = CooperativaUpdate;

const COLUMNS = "id, nombre, ruc, estado, ciudad_principal, logo_url";

export const cooperativaService = {
  // Lista todas las cooperativas no suspendidas (para el selector).
  async getAll(): Promise<Cooperativa[]> {
    const { data, error } = await supabase
      .from("cooperativas")
      .select(COLUMNS)
      .neq("estado", "suspendida")
      .order("nombre", { ascending: true });
    if (error) throw error;
    return data as Cooperativa[];
  },

  async getById(id: number): Promise<Cooperativa> {
    const { data, error } = await supabase
      .from("cooperativas")
      .select(COLUMNS)
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as Cooperativa;
  },

  async create(coop: CooperativaInsert): Promise<Cooperativa> {
    const { data, error } = await supabase
      .from("cooperativas")
      .insert({ ...coop, estado: "verificada" })
      .select(COLUMNS)
      .single();
    if (error) throw error;
    return data as Cooperativa;
  },

  async update(id: number, fields: CooperativaUpdate): Promise<Cooperativa> {
    const { data, error } = await supabase
      .from("cooperativas")
      .update(fields)
      .eq("id", id)
      .select(COLUMNS)
      .single();
    if (error) throw error;
    return data as Cooperativa;
  },
};

// Sube un logo al bucket público "cooperativas" y devuelve su URL pública.
export async function subirLogoCooperativa(archivo: File): Promise<string> {
  const extension = archivo.name.split(".").pop();
  const nombreArchivo = `logos/coop_${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from("cooperativas")
    .upload(nombreArchivo, archivo, { upsert: true });

  if (error) throw new Error("Error subiendo el logo: " + error.message);

  const { data } = supabase.storage.from("cooperativas").getPublicUrl(nombreArchivo);
  return data.publicUrl;
}
