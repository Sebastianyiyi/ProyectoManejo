import { supabase } from "@/integrations/supabase/client";
import { getCooperativaActivaId } from "@/lib/cooperativaActiva";

// ─── Tipos base de Ruta ───────────────────────────────────────────────────────

export interface Ruta {
  id: number;
  ciudad_origen: string;
  ciudad_destino: string;
  distancia_km: number | null;
  duracion_minutos: number | null;
}

export type RutaInsert = Omit<Ruta, "id">;
export type RutaUpdate = Partial<RutaInsert>;

// ─── Tipos de Viaje programado (frecuencia + bus + fecha + costo) ─────────────

export interface ViajeConFrecuencia {
  id: number;
  frecuencia_id: number;
  bus_id: number;
  ruta_id: number | null;
  chofer_id: number | null;
  fecha_salida: string;
  fecha_llegada_est: string | null;
  precio_base: number;
  estado: string;
  created_at: string;
  // joins
  frecuencias?: {
    id: number;
    ciudad_origen: string;
    ciudad_destino: string;
    hora_salida: string;
    resolucion_url: string | null;
  };
  buses?: {
    id: number;
    placa: string;
    tipo: string;
    numero: string | null;
  };
  chofer?: {
    id: number;
    full_name: string;
    email: string;
  } | null;
}

export interface ViajeInsert {
  frecuencia_id: number;
  bus_id: number;
  chofer_id?: number | null;
  fecha_salida: string;
  fecha_llegada_est?: string | null;
  precio_base: number;
  estado?: string;
}

// ─── Servicio de Rutas (CRUD legacy) ─────────────────────────────────────────

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

// ─── Servicio de Viajes programados (frecuencia → viaje) ─────────────────────

export const viajesService = {
  /** Todos los viajes de la cooperativa activa, con join a frecuencia y bus */
  async getAll(): Promise<ViajeConFrecuencia[]> {
    const coopId = getCooperativaActivaId();
    if (!coopId) return [];

    const { data, error } = await supabase
      .from("viajes")
      .select(`
        id,
        frecuencia_id,
        bus_id,
        ruta_id,
        chofer_id,
        fecha_salida,
        fecha_llegada_est,
        precio_base,
        estado,
        created_at,
        frecuencias (
          id,
          ciudad_origen,
          ciudad_destino,
          hora_salida,
          resolucion_url
        ),
        buses (
          id,
          placa,
          tipo,
          numero
        ),
        usuarios (
          id,
          full_name,
          email
        )
      `)
      .eq("buses.cooperativa_id", coopId)
      .order("fecha_salida", { ascending: false });

    const mapped = (data ?? []).map((item: any) => ({
      ...item,
      frecuencias: Array.isArray(item.frecuencias) ? item.frecuencias[0] : item.frecuencias,
      buses: Array.isArray(item.buses) ? item.buses[0] : item.buses,
      chofer: Array.isArray(item.usuarios) ? item.usuarios[0] : (item.usuarios ?? null),
    }));
    return mapped as ViajeConFrecuencia[];
  },

  /** Crear un viaje a partir de frecuencia + bus + fecha + costo */
  async create(viaje: ViajeInsert): Promise<void> {
    const { error } = await supabase
      .from("viajes")
      .insert({
        frecuencia_id: viaje.frecuencia_id,
        bus_id: viaje.bus_id,
        chofer_id: viaje.chofer_id ?? null,
        fecha_salida: viaje.fecha_salida,
        fecha_llegada_est: viaje.fecha_llegada_est ?? null,
        precio_base: viaje.precio_base,
        estado: viaje.estado ?? "programado",
      });
    if (error) throw error;
  },

  async update(id: number, viaje: Partial<ViajeInsert>): Promise<void> {
    const { error } = await supabase
      .from("viajes")
      .update(viaje)
      .eq("id", id);
    if (error) throw error;
  },

  async delete(id: number): Promise<void> {
    // No se puede eliminar un viaje que ya tiene reservas/boletos de clientes.
    const { count } = await supabase
      .from("reservas")
      .select("*", { count: "exact", head: true })
      .eq("viaje_id", id);
    if ((count ?? 0) > 0) {
      throw new Error(
        "No se puede eliminar el viaje porque tiene reservas o boletos asociados. Cámbialo a 'cancelado' en lugar de eliminarlo."
      );
    }
    const { error } = await supabase.from("viajes").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
