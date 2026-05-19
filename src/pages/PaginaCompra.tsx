// src/pages/PaginaCompra.tsx
// Instala estas dependencias si no las tienes:
//   npm install qrcode.react
//   npm install @supabase/supabase-js (ya deberías tenerlo)

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  Bus,
  Check,
  Printer,
  Home,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getAsientosConDisponibilidad,
  calcularPrecio,
  detectarDescuento,
  crearReserva,
  subirComprobante,
  type Asiento,
  type TipoDescuento,
} from "@/lib/boletosService";

// ─── Supabase (usa tus variables de entorno) ───────────────────────────────


// ─── Tipos locales ─────────────────────────────────────────────────────────
interface Viaje {
  id: number;
  fecha_salida: string;
  precio_base: number;
  estado: string;
  rutas: { ciudad_origen: string; ciudad_destino: string };
  buses: { capacidad: number; tipo: string; placa: string };
  cooperativas?: { nombre: string; logo_url?: string };
}

interface Usuario {
  id: number;
  full_name: string;
  cedula: string;
  fecha_nacimiento?: string;
  tiene_discapacidad: boolean;
  rol: string;
}

// ─── ETAPAS DEL FLUJO ──────────────────────────────────────────────────────
type Etapa = "asientos" | "pago" | "confirmacion";

// ──────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ──────────────────────────────────────────────────────────────────────────
export default function PaginaCompra() {
  const { viajeId } = useParams<{ viajeId: string }>();
  const navigate = useNavigate();

  // Estado general
  const [etapa, setEtapa] = useState<Etapa>("asientos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Datos del viaje y usuario
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [asientos, setAsientos] = useState<Asiento[]>([]);

  // Selección
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [tipoDescuento, setTipoDescuento] = useState<TipoDescuento>("ninguno");

  // Pago
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [subiendoPago, setSubiendoPago] = useState(false);

  // Resultado final
  const [codigoQr, setCodigoQr] = useState<string | null>(null);
  const [reservaId, setReservaId] = useState<number | null>(null);
  const [precioFinal, setPrecioFinal] = useState(0);

  // ─── Cargar datos al montar ──────────────────────────────────────────────
  useEffect(() => {
    async function cargar() {
      if (!viajeId) return;
      try {
        setCargando(true);

        // Usuario logueado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/auth"); return; }

        const { data: perfil } = await supabase
          .from("usuarios")
          .select("*")
          .eq("email", user.email)
          .single();

        if (perfil) {
          setUsuario(perfil);
          setTipoDescuento(detectarDescuento(perfil));
        }

        // Datos del viaje con ruta y bus
        const { data: viajeData } = await supabase
          .from("viajes")
          .select(`
            id, fecha_salida, precio_base, estado,
            rutas (ciudad_origen, ciudad_destino),
            buses (capacidad, tipo, placa,
              cooperativas (nombre, logo_url)
            )
          `)
          .eq("id", viajeId)
          .single();

        if (viajeData) {
          // Aplanar la estructura para cooperativas
          const v = {
            ...viajeData,
            cooperativas: (viajeData.buses as any)?.cooperativas,
          };
          setViaje(v as any);
        }

        // Asientos con disponibilidad
        const asientosData = await getAsientosConDisponibilidad(Number(viajeId));
        setAsientos(asientosData);

      } catch (e: any) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [viajeId]);

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const precioBase = viaje?.precio_base ?? 0;
  const precioUnitario = calcularPrecio(precioBase, tipoDescuento);
  const totalPagar = precioUnitario * seleccionados.length;

  const toggleAsiento = (id: number) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Organizar asientos en filas para el mapa visual
  const maxFila = Math.max(...asientos.map((a) => a.fila), 0);
  const maxColumna = Math.max(...asientos.map((a) => a.columna), 0);

  const asientoPorPos = (fila: number, col: number) =>
    asientos.find((a) => a.fila === fila && a.columna === col);

  // ─── Confirmar selección de asientos ─────────────────────────────────────
  const handleContinuarPago = () => {
    if (seleccionados.length === 0) {
      alert("Selecciona al menos un asiento");
      return;
    }
    setEtapa("pago");
  };

  // ─── Confirmar pago y generar boleto ─────────────────────────────────────
  const handleConfirmarPago = async () => {
    if (!usuario || !viaje) return;
    if (!comprobante) { alert("Sube el comprobante de pago"); return; }

    try {
      setSubiendoPago(true);

      // Subir comprobante primero (necesitamos el ID de reserva, usamos 0 temporalmente)
      // La URL real se actualiza después
      const comprobanteUrl = await subirComprobante(comprobante, 0);

      const resultado = await crearReserva({
        usuarioId: usuario.id,
        viajeId: viaje.id,
        asientosIds: seleccionados,
        tipoDescuento,
        precioBase: viaje.precio_base,
        comprobanteUrl,
      });

      setCodigoQr(resultado.codigoQr);
      setReservaId(resultado.reservaId);
      setPrecioFinal(resultado.precioTotal);
      setEtapa("confirmacion");

    } catch (e: any) {
      alert("Error al procesar la reserva: " + e.message);
    } finally {
      setSubiendoPago(false);
    }
  };

  // ─── Etiqueta de descuento ────────────────────────────────────────────────
const labelDescuento: Record<TipoDescuento, string> = {
  ninguno: "Sin descuento",   // ← era "normal"
  menor: "50% — Menor de edad",
  discapacidad: "50% — Discapacidad",
  tercera_edad: "50% — Tercera edad",
};

  // ─── RENDER LOADING / ERROR ───────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
          <p className="text-muted-foreground">Cargando disponibilidad...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // ─── ETAPA 1: SELECCIÓN DE ASIENTOS ──────────────────────────────────────
  if (etapa === "asientos") {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Cabecera del viaje */}
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Viaje seleccionado</p>
              <h1 className="text-2xl font-bold text-foreground">
                {viaje?.rutas?.ciudad_origen} → {viaje?.rutas?.ciudad_destino}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {viaje?.fecha_salida
                  ? new Date(viaje.fecha_salida).toLocaleString("es-EC", {
                      dateStyle: "full",
                      timeStyle: "short",
                    })
                  : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Precio por asiento</p>
              <p className="text-3xl font-bold text-blue-600">
                ${precioUnitario.toFixed(2)}
              </p>
              {tipoDescuento !== "ninguno" && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  {labelDescuento[tipoDescuento]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-muted border" />
            <span className="text-muted-foreground">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-500" />
            <span className="text-muted-foreground">Seleccionado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gray-400" />
            <span className="text-muted-foreground">Ocupado</span>
          </div>
        </div>

        {/* Mapa del bus */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          {/* Frente del bus */}
          <div className="flex justify-center mb-4">
            <div className="bg-muted rounded-lg px-8 py-2 text-sm text-muted-foreground font-medium flex items-center gap-2">
              <Bus className="h-4 w-4" />
              Frente del bus
            </div>
          </div>

          {/* Grilla de asientos */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {Array.from({ length: maxFila }, (_, i) => i + 1).map((fila) => (
                <div key={fila} className="flex gap-2 justify-center mb-2">
                  {/* Pasillo: columnas 1-2 | espacio | columnas 3-4 */}
                  {Array.from({ length: maxColumna }, (_, j) => j + 1).map((col) => {
                    // Espacio del pasillo entre columna 2 y 3
                    const pasillo = maxColumna >= 4 && col === 3 ? "ml-6" : "";
                    const asiento = asientoPorPos(fila, col);

                    if (!asiento) {
                      return (
                        <div
                          key={`${fila}-${col}`}
                          className={`w-10 h-10 ${pasillo}`}
                        />
                      );
                    }

                    const ocupado = asiento.ocupado;
                    const seleccionado = seleccionados.includes(asiento.id);
                    const esVip = asiento.tipo === "vip";

                    return (
                      <button
                        key={asiento.id}
                        disabled={ocupado}
                        onClick={() => !ocupado && toggleAsiento(asiento.id)}
                        title={`Asiento ${asiento.numero}${esVip ? " (VIP)" : ""}`}
                        className={`
                          ${pasillo}
                          w-10 h-10 rounded-lg text-xs font-semibold
                          transition-all duration-150
                          flex items-center justify-center
                          border-2
                          ${ocupado
                            ? "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed"
                            : seleccionado
                              ? "bg-blue-500 border-blue-600 text-white scale-105 shadow-md"
                              : esVip
                                ? "bg-yellow-50 border-yellow-400 text-yellow-700 hover:bg-yellow-100"
                                : "bg-muted border-border text-foreground hover:bg-accent hover:scale-105"
                          }
                        `}
                      >
                        {asiento.numero}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Parte trasera */}
          <div className="flex justify-center mt-4">
            <div className="bg-muted rounded-lg px-8 py-2 text-sm text-muted-foreground">
              Parte trasera
            </div>
          </div>
        </div>

        {/* Resumen y botón continuar */}
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {seleccionados.length === 0
                  ? "No has seleccionado asientos"
                  : `${seleccionados.length} asiento${seleccionados.length > 1 ? "s" : ""} seleccionado${seleccionados.length > 1 ? "s" : ""}`}
              </p>
              {seleccionados.length > 0 && (
                <p className="text-2xl font-bold text-foreground mt-1">
                  Total: <span className="text-blue-600">${totalPagar.toFixed(2)}</span>
                </p>
              )}
            </div>
            <button
              onClick={handleContinuarPago}
              disabled={seleccionados.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Continuar al pago →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── ETAPA 2: PAGO ────────────────────────────────────────────────────────
  if (etapa === "pago") {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-5">
        <button
          onClick={() => setEtapa("asientos")}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          ← Volver a asientos
        </button>

        <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-xl font-bold">Resumen de compra</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ruta</span>
              <span className="font-medium">
                {viaje?.rutas?.ciudad_origen} → {viaje?.rutas?.ciudad_destino}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha</span>
              <span>
                {viaje?.fecha_salida
                  ? new Date(viaje.fecha_salida).toLocaleString("es-EC", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pasajero</span>
              <span>{usuario?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Asientos</span>
              <span>{seleccionados.length} asiento{seleccionados.length > 1 ? "s" : ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Descuento</span>
                <span className={tipoDescuento !== "ninguno" ? "text-green-600 font-medium" : ""}>
                {labelDescuento[tipoDescuento]}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between text-base font-bold">
              <span>Total a pagar</span>
              <span className="text-blue-600">${totalPagar.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-xl font-bold">Comprobante de pago</h2>
          <p className="text-sm text-muted-foreground">
            Realiza la transferencia y sube el comprobante. Un oficinista verificará el pago.
          </p>

          {/* Datos bancarios (edita con los datos reales) */}
          <div className="bg-muted rounded-lg p-4 text-sm space-y-1">
            <p className="font-semibold text-foreground">Datos de transferencia:</p>
            <p className="text-muted-foreground">Banco: Banco Pichincha</p>
            <p className="text-muted-foreground">Cuenta: 2200XXXXXXXX</p>
            <p className="text-muted-foreground">Tipo: Corriente</p>
            <p className="text-muted-foreground">A nombre de: Cooperativa XYZ</p>
            <p className="font-semibold text-blue-600">Monto: ${totalPagar.toFixed(2)}</p>
          </div>

          {/* Upload comprobante */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Subir comprobante (imagen o PDF)
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setComprobante(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4 file:rounded-lg
                file:border file:border-border file:text-sm
                file:bg-background file:text-foreground
                hover:file:bg-accent cursor-pointer"
            />
            {comprobante && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <Check className="h-3 w-3" />
                {comprobante.name} ({(comprobante.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleConfirmarPago}
          disabled={subiendoPago || !comprobante}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40
            text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {subiendoPago ? "Procesando reserva..." : "Confirmar reserva y enviar comprobante"}
        </button>
      </div>
    );
  }

  // ─── ETAPA 3: CONFIRMACIÓN + QR ───────────────────────────────────────────
  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <CheckCircle2 className="h-14 w-14 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Reserva confirmada</h1>
        <p className="text-muted-foreground text-sm">
          Tu comprobante fue recibido. El oficinista verificará el pago pronto.
        </p>
      </div>

      <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reserva #</span>
            <span className="font-mono font-bold">{reservaId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ruta</span>
            <span className="font-medium">
              {viaje?.rutas?.ciudad_origen} → {viaje?.rutas?.ciudad_destino}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pasajero</span>
            <span>{usuario?.full_name}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-bold">
            <span>Total pagado</span>
            <span className="text-blue-600">${precioFinal.toFixed(2)}</span>
          </div>
        </div>

        {/* QR Code */}
        {codigoQr && (
          <div className="flex flex-col items-center gap-3 pt-2">
            <p className="text-sm font-medium text-muted-foreground">
              Muestra este QR al subir al bus
            </p>
            <div className="border-4 border-white shadow-lg rounded-xl p-3 bg-white">
            <QRCodeSVG value={codigoQr} size={200} level="H" />
            </div>
            <p className="text-xs font-mono text-muted-foreground text-center break-all">
              {codigoQr}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => window.print()}
          className="flex-1 border border-border rounded-xl py-3 text-sm font-medium
            hover:bg-accent transition-colors flex items-center justify-center gap-2"
        >
          <Printer className="h-4 w-4" />
          Imprimir boleto
        </button>
        <button
          onClick={() => navigate("/")}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl
            py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Home className="h-4 w-4" />
          Ir al inicio
        </button>
      </div>
    </div>
  );
}