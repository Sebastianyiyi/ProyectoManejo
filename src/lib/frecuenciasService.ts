import { supabase } from "@/integrations/supabase/client";
import { getCooperativaActivaId } from "@/lib/cooperativaActiva";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Frecuencia {
  id: number;
  cooperativa_id: number;
  ciudad_origen: string;
  ciudad_destino: string;
  hora_salida: string;          // formato HH:MM
  resolucion_url: string | null;
  activo: boolean;
  created_at: string;
}

export type FrecuenciaInsert = Omit<Frecuencia, "id" | "created_at">;
export type FrecuenciaUpdate = Partial<FrecuenciaInsert>;

// ─── Servicio ─────────────────────────────────────────────────────────────────

export const frecuenciasService = {
  async getAll(): Promise<Frecuencia[]> {
    const coopId = getCooperativaActivaId();
    if (!coopId) return [];
    const { data, error } = await supabase
      .from("frecuencias")
      .select("*")
      .eq("cooperativa_id", coopId)
      .order("ciudad_origen", { ascending: true });
    if (error) throw error;
    return data as Frecuencia[];
  },

  async create(frecuencia: Omit<FrecuenciaInsert, "cooperativa_id">): Promise<Frecuencia> {
    const coopId = getCooperativaActivaId();
    if (!coopId) throw new Error("Selecciona una cooperativa activa antes de registrar frecuencias.");
    const { data, error } = await supabase
      .from("frecuencias")
      .insert({ ...frecuencia, cooperativa_id: coopId })
      .select()
      .single();
    if (error) throw error;
    return data as Frecuencia;
  },

  async update(id: number, frecuencia: FrecuenciaUpdate): Promise<Frecuencia> {
    const { data, error } = await supabase
      .from("frecuencias")
      .update(frecuencia)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Frecuencia;
  },

  async toggleActivo(id: number, activo: boolean): Promise<void> {
    const { error } = await supabase
      .from("frecuencias")
      .update({ activo })
      .eq("id", id);
    if (error) throw error;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase.from("frecuencias").delete().eq("id", id);
    if (error) throw error;
  },
};

// ─── Upload resolución agencia ────────────────────────────────────────────────

export async function subirResolucion(archivo: File): Promise<string> {
  const extension = archivo.name.split(".").pop();
  const nombreArchivo = `resoluciones/res_${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from("frecuencias")
    .upload(nombreArchivo, archivo, { upsert: true });

  if (error) throw new Error("Error subiendo la resolución: " + error.message);

  const { data } = supabase.storage.from("frecuencias").getPublicUrl(nombreArchivo);
  return data.publicUrl;
}
