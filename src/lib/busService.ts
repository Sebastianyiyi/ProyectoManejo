import { supabase } from "@/integrations/supabase/client";
import { getCooperativaActivaId } from "@/lib/cooperativaActiva";

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

export type BusInsert = Omit<Bus, "id" | "created_at" | "numero"> & {
  numero?: string | null;
};
export type BusUpdate = Partial<BusInsert>;

// Catálogo de marcas para seleccionar en combo box y evitar errores de tipeo.
export const MARCAS_CHASIS = [
  "Mercedes-Benz",
  "Volvo",
  "Scania",
  "Hino",
  "Chevrolet",
  "Volkswagen",
  "MAN",
  "International",
  "Agrale",
  "Hyundai",
  "JAC",
] as const;

export const MARCAS_CARROCERIA = [
  "Marcopolo",
  "Busscar",
  "Miral",
  "IMCE",
  "Olímpica",
  "Patricio Cepeda",
  "Carrocerías Jácome",
  "Davmotor",
  "Picosa",
  "Serman",
  "Varma",
  "Imperial",
] as const;

export const busService = {
  async getAll(): Promise<Bus[]> {
    const coopId = getCooperativaActivaId();
    if (!coopId) return [];
    const { data, error } = await supabase
      .from("buses")
      .select("*")
      .eq("cooperativa_id", coopId)
      .order("numero", { ascending: true });
    if (error) throw error;
    return data as Bus[];
  },

  // El campo "numero" lo autogenera la base de datos, por eso se omite aquí.
  async create(bus: Omit<BusInsert, "cooperativa_id" | "numero">): Promise<Bus> {
    const coopId = getCooperativaActivaId();
    if (!coopId) throw new Error("Selecciona una cooperativa activa antes de registrar buses.");
    const { data, error } = await supabase
      .from("buses")
      .insert({ ...bus, cooperativa_id: coopId })
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

// Sube una foto de bus al bucket público "buses" y devuelve su URL pública.
export async function subirFotoBus(archivo: File): Promise<string> {
  const extension = archivo.name.split(".").pop();
  const nombreArchivo = `fotos/bus_${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from("buses")
    .upload(nombreArchivo, archivo, { upsert: true });

  if (error) throw new Error("Error subiendo la foto: " + error.message);

  const { data } = supabase.storage.from("buses").getPublicUrl(nombreArchivo);
  return data.publicUrl;
}