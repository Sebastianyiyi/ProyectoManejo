import { supabase } from "@/integrations/supabase/client";

export interface Cooperativa {
  id: number;
  nombre: string;
  ruc: string;
  estado: string;
  ciudad_principal: string | null;
  logo_url: string | null;
  telefono: string | null;
  direccion: string | null;
  color_primario: string;
  color_secundario: string;
}

export interface CooperativaUpdate {
  nombre: string;
  ruc: string;
  ciudad_principal: string | null;
  logo_url: string | null;
  telefono: string | null;
  direccion: string | null;
  color_primario: string;
  color_secundario: string;
}

const SELECT_FIELDS =
  "id, nombre, ruc, estado, ciudad_principal, logo_url, telefono, direccion, color_primario, color_secundario";

export const cooperativaService = {
  async get(): Promise<Cooperativa> {
    const { data, error } = await supabase
      .from("cooperativas")
      .select(SELECT_FIELDS)
      .neq("estado", "suspendida")
      .order("id", { ascending: true })
      .limit(1)
      .single();
    if (error) throw error;
    return data as Cooperativa;
  },

  async update(id: number, fields: CooperativaUpdate): Promise<Cooperativa> {
    const { data, error } = await supabase
      .from("cooperativas")
      .update(fields)
      .eq("id", id)
      .select(SELECT_FIELDS)
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