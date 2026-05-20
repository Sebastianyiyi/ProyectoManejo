import { supabase } from "@/integrations/supabase/client";

export interface Ruta {
  id: number;
  ciudad_origen: string;
  ciudad_destino: string;
  distancia_km: number | null;
  duracion_minutos: number | null;
}

export type RutaInsert = Omit<Ruta, "id">;
export type RutaUpdate = Partial<RutaInsert>;

export const rutasService = {
  async getAll(): Promise<Ruta[]> {
    const { data, error } = await supabase
      .from("rutas")
      .select("*")
      .order("ciudad_origen", { ascending: true });
    
    if (error) throw error;
    return data as Ruta[];
  },

  async create(ruta: RutaInsert): Promise<Ruta> {
    const { data, error } = await supabase
      .from("rutas")
      .insert(ruta)
      .select()
      .single();
      
    if (error) throw error;
    return data as Ruta;
  },

  async update(id: number, ruta: RutaUpdate): Promise<Ruta> {
    const { data, error } = await supabase
      .from("rutas")
      .update(ruta)
      .eq("id", id)
      .select()
      .single();
      
    if (error) throw error;
    return data as Ruta;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase.from("rutas").delete().eq("id", id);
    if (error) throw error;
  },
};
