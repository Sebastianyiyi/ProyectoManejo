import { supabase } from "@/integrations/supabase/client";

export type TipoBus = "economico" | "ejecutivo" | "premium";

export interface Bus {
  id: number;
  cooperativa_id: number;
  placa: string;
  numero: string | null;
  capacidad: number;
  tipo: TipoBus;
  marca_chasis: string | null;
  marca_carroceria: string | null;
  foto_url: string | null;
  activo: boolean;
  created_at: string;
}

export type BusInsert = Omit<Bus, "id" | "created_at">;
export type BusUpdate = Partial<BusInsert>;

export const COOPERATIVA_ID = 3;

export const busService = {
  async getAll(): Promise<Bus[]> {
    const { data, error } = await supabase
      .from("buses")
      .select("*")
      .eq("cooperativa_id", COOPERATIVA_ID)
      .order("numero", { ascending: true });
    if (error) throw error;
    return data as Bus[];
  },

  async create(bus: Omit<BusInsert, "cooperativa_id">): Promise<Bus> {
    const { data, error } = await supabase
      .from("buses")
      .insert({ ...bus, cooperativa_id: COOPERATIVA_ID })
      .select()
      .single();
    if (error) throw error;
    return data as Bus;
  },

  async update(id: number, bus: BusUpdate): Promise<Bus> {
    const { data, error } = await supabase
      .from("buses")
      .update(bus)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Bus;
  },

  async toggleActivo(id: number, activo: boolean): Promise<void> {
    const { error } = await supabase
      .from("buses")
      .update({ activo })
      .eq("id", id);
    if (error) throw error;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase.from("buses").delete().eq("id", id);
    if (error) throw error;
  },
};