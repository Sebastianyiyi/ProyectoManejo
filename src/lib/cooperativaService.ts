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

const COLUMNS = "id, nombre, ruc, estado, ciudad_principal, logo_url";

export const cooperativaService = {
  // La app opera con una única cooperativa: se devuelve la primera no suspendida.
  async get(): Promise<Cooperativa> {
    const { data, error } = await supabase
      .from("cooperativas")
      .select(COLUMNS)
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
