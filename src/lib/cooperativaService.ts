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

export const cooperativaService = {
  async get(): Promise<Cooperativa> {
    const { data, error } = await supabase
      .from("cooperativas")
      .select("id, nombre, ruc, estado, ciudad_principal, logo_url")
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
      .select()
      .single();
    if (error) throw error;
    return data as Cooperativa;
  },
};
