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