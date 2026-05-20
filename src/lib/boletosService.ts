// src/lib/boletosService.ts

import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────

export type TipoDescuento = "ninguno" | "menor" | "discapacidad" | "tercera_edad";

export interface Asiento {
  id: number;
  numero: number;
  fila: number;
  columna: number;
  tipo: string; // "normal" | "vip" | etc
  activo: boolean;
  ocupado?: boolean; // lo calculamos nosotros
}

export interface ResumenReserva {
  reservaId: number;
  codigoQr: string;
  precioTotal: number;
  asientos: number[];
}

// ─────────────────────────────────────────
// 1. OBTENER ASIENTOS DEL BUS + CUÁLES ESTÁN OCUPADOS
// ─────────────────────────────────────────

export async function getAsientosConDisponibilidad(viajeId: number): Promise<Asiento[]> {
  // Primero obtenemos el bus del viaje
  const { data: viaje, error: viajeError } = await supabase
    .from("viajes")
    .select("bus_id")
    .eq("id", viajeId)
    .single();

  if (viajeError || !viaje) throw new Error("No se encontró el viaje");

  // Todos los asientos del bus
  const { data: asientos, error: asientosError } = await supabase
    .from("asientos")
    .select("*")
    .eq("bus_id", viaje.bus_id)
    .eq("activo", true)
    .order("numero");

  if (asientosError || !asientos) throw new Error("Error cargando asientos");

  // IDs de asientos ya reservados en este viaje (reservas activas)
  const { data: reservados } = await supabase
    .from("detalle_reserva")
    .select("asiento_id, reservas!inner(viaje_id, estado)")
    .eq("reservas.viaje_id", viajeId)
    .in("reservas.estado", ["pendiente", "confirmada"]);

  const ocupadosIds = new Set((reservados ?? []).map((r: any) => r.asiento_id));

  return asientos.map((a) => ({
    ...a,
    ocupado: ocupadosIds.has(a.id),
  }));
}

// ─────────────────────────────────────────
// 2. CALCULAR PRECIO CON DESCUENTO
// ─────────────────────────────────────────

const descuentos: Record<TipoDescuento, number> = {
  ninguno: 0,      // ← era "normal"
  menor: 0.5,
  discapacidad: 0.5,
  tercera_edad: 0.5,
};
export function calcularPrecio(precioBase: number, tipo: TipoDescuento): number {
  return precioBase * (1 - descuentos[tipo]);
}
// Detectar automáticamente el tipo de descuento según los datos del usuario
export function detectarDescuento(usuario: {
  fecha_nacimiento?: string | null;
  tiene_discapacidad?: boolean;
}): TipoDescuento {
  if (usuario.tiene_discapacidad) return "discapacidad";

  if (usuario.fecha_nacimiento) {
    const nacimiento = new Date(usuario.fecha_nacimiento);
    const hoy = new Date();
    const edad = hoy.getFullYear() - nacimiento.getFullYear();

    if (edad < 18) return "menor";
    if (edad >= 65) return "tercera_edad";
  }
  return "ninguno";
}

// ─────────────────────────────────────────
// 3. CREAR RESERVA COMPLETA
//    reserva → detalle_reserva (por asiento) → pago → boletos
// ─────────────────────────────────────────

export async function crearReserva(params: {
  usuarioId: number;
  viajeId: number;
  asientosIds: number[];
  tipoDescuento: TipoDescuento;
  precioBase: number;
  comprobanteUrl?: string;
}): Promise<ResumenReserva> {
  const { usuarioId, viajeId, asientosIds, tipoDescuento, precioBase, comprobanteUrl } = params;

  const precioUnitario = calcularPrecio(precioBase, tipoDescuento);
  const precioTotal = precioUnitario * asientosIds.length;

  // 1) Crear la reserva
  const { data: reserva, error: reservaError } = await supabase
    .from("reservas")
    .insert({
      usuario_id: usuarioId,
      viaje_id: viajeId,
      tipo_descuento: tipoDescuento,
      precio_total: precioTotal,
      estado: "pendiente_pago",
    })
    .select()
    .single();

  if (reservaError || !reserva) throw new Error("Error al crear la reserva: " + reservaError?.message);

  // 2) Crear detalle por cada asiento
  const detalles = asientosIds.map((asientoId) => ({
    reserva_id: reserva.id,
    asiento_id: asientoId,
    precio_unitario: precioUnitario,
  }));

  const { data: detallesCreados, error: detalleError } = await supabase
    .from("detalle_reserva")
    .insert(detalles)
    .select();

  if (detalleError || !detallesCreados) throw new Error("Error al crear detalles: " + detalleError?.message);

  // 3) Crear el pago
  const { error: pagoError } = await supabase.from("pagos").insert({
    reserva_id: reserva.id,
    monto: precioTotal,
    estado: "pendiente",
    comprobante_url: comprobanteUrl ?? null,
  });

  if (pagoError) throw new Error("Error al crear el pago: " + pagoError.message);

  // 4) Generar boleto con código QR para cada detalle
  const boletos = detallesCreados.map((detalle) => ({
    detalle_reserva_id: detalle.id,
    codigo_qr: generarCodigoQR(reserva.id, detalle.id),
    estado: "activo",
    emitido_at: new Date().toISOString(),
  }));

  const { error: boletoError } = await supabase.from("boletos").insert(boletos);

  if (boletoError) throw new Error("Error al generar boletos: " + boletoError.message);

  return {
    reservaId: reserva.id,
    codigoQr: boletos[0].codigo_qr, // el primero (si hay varios se muestran todos)
    precioTotal,
    asientos: asientosIds,
  };
}

// ─────────────────────────────────────────
// 4. OBTENER BOLETOS DE UNA RESERVA (para mostrar al usuario)
// ─────────────────────────────────────────

export async function getBoletosDeReserva(reservaId: number) {
  const { data, error } = await supabase
    .from("boletos")
    .select(`
      id,
      codigo_qr,
      estado,
      emitido_at,
      detalle_reserva (
        precio_unitario,
        asientos (numero, tipo)
      )
    `)
    .eq("detalle_reserva.reserva_id", reservaId);

  if (error) throw new Error("Error cargando boletos: " + error.message);
  return data ?? [];
}

// ─────────────────────────────────────────
// 5. SUBIR COMPROBANTE DE PAGO A SUPABASE STORAGE
// ─────────────────────────────────────────

export async function subirComprobante(archivo: File, reservaId: number): Promise<string> {
  const extension = archivo.name.split(".").pop();
  const nombreArchivo = `comprobantes/reserva_${reservaId}_${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from("pagos") // nombre del bucket en Supabase Storage
    .upload(nombreArchivo, archivo, { upsert: true });

  if (error) throw new Error("Error subiendo comprobante: " + error.message);

  const { data: urlData } = supabase.storage.from("pagos").getPublicUrl(nombreArchivo);
  return urlData.publicUrl;
}

// ─────────────────────────────────────────
// HELPER: generar código QR único
// ─────────────────────────────────────────

function generarCodigoQR(reservaId: number, detalleId: number): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BLT-${reservaId}-${detalleId}-${timestamp}-${random}`;
}