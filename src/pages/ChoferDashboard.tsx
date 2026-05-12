import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Bus,
  MapPin,
  TicketCheck,
  Loader2,
  Search,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Camera,
  CameraOff,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Html5Qrcode } from "html5-qrcode";

interface RutaInfo {
  ciudad_origen: string;
  ciudad_destino: string;
}

interface BusInfo {
  placa: string;
  numero: string | null;
  tipo: string;
}

interface ViajeChofer {
  id: number;
  fecha_salida: string;
  fecha_llegada_est: string;
  precio_base: number;
  estado: string;
  rutas: RutaInfo | null;
  buses: BusInfo | null;
}

interface ViajeChoferSupabase {
  id: number;
  fecha_salida: string;
  fecha_llegada_est: string;
  precio_base: number;
  estado: string;
  rutas: RutaInfo[] | RutaInfo | null;
  buses: BusInfo[] | BusInfo | null;
}

interface BoletoValidacion {
  id: number;
  codigo_qr: string;
  estado: string;
  usado_at: string | null;
  emitido_at: string;
  detalle_reserva_id: number;
  detalle_reserva: {
    id: number;
    precio_unitario: number;
    asientos: {
      numero: number;
      fila: number;
      columna: number;
      tipo: string;
    } | null;
    reservas: {
      id: number;
      estado: string;
      precio_total: number;
      tipo_descuento: string;
      usuarios: {
        full_name: string;
        cedula: string;
        phone: string;
        email: string;
      } | null;
      viajes: {
        id: number;
        estado: string;
        chofer_id: number;
        fecha_salida: string;
        rutas: {
          ciudad_origen: string;
          ciudad_destino: string;
        } | null;
      } | null;
    } | null;
  } | null;
}

interface BoletoValidacionSupabase {
  id: number;
  codigo_qr: string;
  estado: string;
  usado_at: string | null;
  emitido_at: string;
  detalle_reserva_id: number;
  detalle_reserva:
    | {
        id: number;
        precio_unitario: number;
        asientos:
          | {
              numero: number;
              fila: number;
              columna: number;
              tipo: string;
            }[]
          | {
              numero: number;
              fila: number;
              columna: number;
              tipo: string;
            }
          | null;
        reservas:
          | {
              id: number;
              estado: string;
              precio_total: number;
              tipo_descuento: string;
              usuarios:
                | {
                    full_name: string;
                    cedula: string;
                    phone: string;
                    email: string;
                  }[]
                | {
                    full_name: string;
                    cedula: string;
                    phone: string;
                    email: string;
                  }
                | null;
              viajes:
                | {
                    id: number;
                    estado: string;
                    chofer_id: number;
                    fecha_salida: string;
                    rutas:
                      | {
                          ciudad_origen: string;
                          ciudad_destino: string;
                        }[]
                      | {
                          ciudad_origen: string;
                          ciudad_destino: string;
                        }
                      | null;
                  }[]
                | {
                    id: number;
                    estado: string;
                    chofer_id: number;
                    fecha_salida: string;
                    rutas:
                      | {
                          ciudad_origen: string;
                          ciudad_destino: string;
                        }[]
                      | {
                          ciudad_origen: string;
                          ciudad_destino: string;
                        }
                      | null;
                  }
                | null;
            }[]
          | {
              id: number;
              estado: string;
              precio_total: number;
              tipo_descuento: string;
              usuarios:
                | {
                    full_name: string;
                    cedula: string;
                    phone: string;
                    email: string;
                  }[]
                | {
                    full_name: string;
                    cedula: string;
                    phone: string;
                    email: string;
                  }
                | null;
              viajes:
                | {
                    id: number;
                    estado: string;
                    chofer_id: number;
                    fecha_salida: string;
                    rutas:
                      | {
                          ciudad_origen: string;
                          ciudad_destino: string;
                        }[]
                      | {
                          ciudad_origen: string;
                          ciudad_destino: string;
                        }
                      | null;
                  }[]
                | {
                    id: number;
                    estado: string;
                    chofer_id: number;
                    fecha_salida: string;
                    rutas:
                      | {
                          ciudad_origen: string;
                          ciudad_destino: string;
                        }[]
                      | {
                          ciudad_origen: string;
                          ciudad_destino: string;
                        }
                      | null;
                  }
                | null;
            }
          | null;
      }[]
    | {
        id: number;
        precio_unitario: number;
        asientos:
          | {
              numero: number;
              fila: number;
              columna: number;
              tipo: string;
            }[]
          | {
              numero: number;
              fila: number;
              columna: number;
              tipo: string;
            }
          | null;
        reservas:
          | {
              id: number;
              estado: string;
              precio_total: number;
              tipo_descuento: string;
              usuarios:
                | {
                    full_name: string;
                    cedula: string;
                    phone: string;
                    email: string;
                  }[]
                | {
                    full_name: string;
                    cedula: string;
                    phone: string;
                    email: string;
                  }
                | null;
              viajes:
                | {
                    id: number;
                    estado: string;
                    chofer_id: number;
                    fecha_salida: string;
                    rutas:
                      | {
                          ciudad_origen: string;
                          ciudad_destino: string;
                        }[]
                      | {
                          ciudad_origen: string;
                          ciudad_destino: string;
                        }
                      | null;
                  }[]
                | {
                    id: number;
                    estado: string;
                    chofer_id: number;
                    fecha_salida: string;
                    rutas:
                      | {
                          ciudad_origen: string;
                          ciudad_destino: string;
                        }[]
                      | {
                          ciudad_origen: string;
                          ciudad_destino: string;
                        }
                      | null;
                  }
                | null;
            }[]
          | {
              id: number;
              estado: string;
              precio_total: number;
              tipo_descuento: string;
              usuarios:
                | {
                    full_name: string;
                    cedula: string;
                    phone: string;
                    email: string;
                  }[]
                | {
                    full_name: string;
                    cedula: string;
                    phone: string;
                    email: string;
                  }
                | null;
              viajes:
                | {
                    id: number;
                    estado: string;
                    chofer_id: number;
                    fecha_salida: string;
                    rutas:
                      | {
                          ciudad_origen: string;
                          ciudad_destino: string;
                        }[]
                      | {
                          ciudad_origen: string;
                          ciudad_destino: string;
                        }
                      | null;
                  }[]
                | {
                    id: number;
                    estado: string;
                    chofer_id: number;
                    fecha_salida: string;
                    rutas:
                      | {
                          ciudad_origen: string;
                          ciudad_destino: string;
                        }[]
                      | {
                          ciudad_origen: string;
                          ciudad_destino: string;
                        }
                      | null;
                  }
                | null;
            }
          | null;
      }
    | null;
}

function obtenerPrimerElemento<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

function obtenerMensajeEstadoReserva(estado?: string | null): string {
  switch (estado) {
    case "pendiente_pago":
      return "La reserva está pendiente de pago. No se puede validar la asistencia.";
    case "pago_en_verificacion":
      return "El pago de la reserva está en verificación. No se puede validar la asistencia todavía.";
    case "cancelada":
      return "La reserva está cancelada. No se puede validar la asistencia.";
    case "confirmada":
      return "";
    default:
      return "La reserva no tiene un estado válido para validar asistencia.";
  }
}

function normalizarBoleto(data: BoletoValidacionSupabase): BoletoValidacion {
  const detalle = obtenerPrimerElemento(data.detalle_reserva);
  const asiento = obtenerPrimerElemento(detalle?.asientos);
  const reserva = obtenerPrimerElemento(detalle?.reservas);
  const usuario = obtenerPrimerElemento(reserva?.usuarios);
  const viaje = obtenerPrimerElemento(reserva?.viajes);
  const ruta = obtenerPrimerElemento(viaje?.rutas);

  return {
    id: data.id,
    codigo_qr: data.codigo_qr,
    estado: data.estado,
    usado_at: data.usado_at,
    emitido_at: data.emitido_at,
    detalle_reserva_id: data.detalle_reserva_id,
    detalle_reserva: detalle
      ? {
          id: detalle.id,
          precio_unitario: Number(detalle.precio_unitario),
          asientos: asiento,
          reservas: reserva
            ? {
                id: reserva.id,
                estado: reserva.estado,
                precio_total: Number(reserva.precio_total),
                tipo_descuento: reserva.tipo_descuento,
                usuarios: usuario,
                viajes: viaje
                  ? {
                      id: viaje.id,
                      estado: viaje.estado,
                      chofer_id: viaje.chofer_id,
                      fecha_salida: viaje.fecha_salida,
                      rutas: ruta,
                    }
                  : null,
              }
            : null,
        }
      : null,
  };
}

const QR_READER_ID = "qr-reader-chofer";
export default function ChoferDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [viajes, setViajes] = useState<ViajeChofer[]>([]);
  const [cargandoViajes, setCargandoViajes] = useState(true);

  const [codigoQR, setCodigoQR] = useState("");
  const [boletoEncontrado, setBoletoEncontrado] = useState<BoletoValidacion | null>(null);
  const [buscandoBoleto, setBuscandoBoleto] = useState(false);
  const [validandoAsistencia, setValidandoAsistencia] = useState(false);

  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [iniciandoCamara, setIniciandoCamara] = useState(false);
  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    if (user.role !== "chofer") {
      navigate("/", { replace: true });
      return;
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const cargarViajes = async () => {
      if (!user?.id || user.role !== "chofer") return;

      setCargandoViajes(true);

      const { data, error } = await supabase
        .from("viajes")
        .select(`
          id,
          fecha_salida,
          fecha_llegada_est,
          precio_base,
          estado,
          rutas (
            ciudad_origen,
            ciudad_destino
          ),
          buses (
            placa,
            numero,
            tipo
          )
        `)
        .eq("chofer_id", user.id)
        .order("fecha_salida", { ascending: true });

      if (error) {
        console.error("Error al cargar viajes del chofer:", error);
        toast.error("No se pudieron cargar los viajes asignados.");
        setViajes([]);
        setCargandoViajes(false);
        return;
      }

      const viajesNormalizados: ViajeChofer[] = ((data ?? []) as ViajeChoferSupabase[]).map(
        (viaje) => ({
          id: viaje.id,
          fecha_salida: viaje.fecha_salida,
          fecha_llegada_est: viaje.fecha_llegada_est,
          precio_base: Number(viaje.precio_base),
          estado: viaje.estado,
          rutas: obtenerPrimerElemento(viaje.rutas),
          buses: obtenerPrimerElemento(viaje.buses),
        })
      );

      setViajes(viajesNormalizados);
      setCargandoViajes(false);
    };

    cargarViajes();
  }, [user]);

  const detenerCamara = async () => {
    const scanner = qrScannerRef.current;

    if (!scanner) {
      setCamaraActiva(false);
      return;
    }

    try {
      await scanner.stop();
    } catch (error) {
      console.warn("La cámara ya estaba detenida o no pudo detenerse:", error);
    }

    try {
      await scanner.clear();
    } catch (error) {
      console.warn("No se pudo limpiar el lector QR:", error);
    }

    qrScannerRef.current = null;
    setCamaraActiva(false);
  };

  const iniciarCamara = async () => {
    if (camaraActiva || iniciandoCamara) return;

    setIniciandoCamara(true);

    try {
      const scanner = new Html5Qrcode(QR_READER_ID);
      qrScannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
        },
        async (decodedText) => {
          const codigoEscaneado = decodedText.trim();

          setCodigoQR(codigoEscaneado);
          toast.success("Código QR escaneado correctamente.");

          await detenerCamara();
        },
        () => {
          // Esta función se ejecuta constantemente mientras busca un QR.
          // La dejamos vacía para no llenar la consola con mensajes.
        }
      );

      setCamaraActiva(true);
    } catch (error) {
      console.error("Error al iniciar la cámara:", error);
      toast.error(
        "No se pudo activar la cámara. Revisa los permisos del navegador."
      );
    } finally {
      setIniciandoCamara(false);
    }
  };

  useEffect(() => {
    return () => {
      const scanner = qrScannerRef.current;

      if (!scanner) return;

      scanner
        .stop()
        .catch(() => {
          // La cámara puede ya estar detenida.
        })
        .finally(() => {
          try {
            scanner.clear();
          } catch {
            // El lector puede ya estar limpio.
          }

          qrScannerRef.current = null;
        });
    };
  }, []);

  const buscarBoletoPorQR = async () => {
    const codigoLimpio = codigoQR.trim();

    if (!codigoLimpio) {
      toast.error("Ingresa o escanea un código QR.");
      return;
    }

    if (!user?.id) {
      toast.error("No se pudo identificar al chofer.");
      return;
    }

    setBuscandoBoleto(true);
    setBoletoEncontrado(null);

    try {
      // 1. Buscar boleto por código QR
      const { data: boletoData, error: boletoError } = await supabase
        .from("boletos")
        .select("id, codigo_qr, estado, usado_at, emitido_at, detalle_reserva_id")
        .eq("codigo_qr", codigoLimpio)
        .maybeSingle();

      if (boletoError) {
        console.error("Error al buscar boleto:", boletoError);
        toast.error("Ocurrió un error al buscar el boleto.");
        return;
      }

      if (!boletoData) {
        toast.error("No se encontró ningún boleto con ese código QR.");
        return;
      }

      // 2. Buscar detalle de reserva
      const { data: detalleData, error: detalleError } = await supabase
        .from("detalle_reserva")
        .select("id, reserva_id, asiento_id, precio_unitario")
        .eq("id", boletoData.detalle_reserva_id)
        .maybeSingle();

      if (detalleError) {
        console.error("Error al buscar detalle de reserva:", detalleError);
        toast.error("No se pudo obtener el detalle de la reserva.");
        return;
      }

      if (!detalleData) {
        toast.error("El boleto no tiene un detalle de reserva asociado.");
        return;
      }

      // 3. Buscar asiento
      const { data: asientoData, error: asientoError } = await supabase
        .from("asientos")
        .select("numero, fila, columna, tipo")
        .eq("id", detalleData.asiento_id)
        .maybeSingle();

      if (asientoError) {
        console.error("Error al buscar asiento:", asientoError);
        toast.error("No se pudo obtener el asiento del boleto.");
        return;
      }

      // 4. Buscar reserva
      const { data: reservaData, error: reservaError } = await supabase
        .from("reservas")
        .select("id, usuario_id, viaje_id, estado, precio_total, tipo_descuento")
        .eq("id", detalleData.reserva_id)
        .maybeSingle();

      if (reservaError) {
        console.error("Error al buscar reserva:", reservaError);
        toast.error("No se pudo obtener la reserva del boleto.");
        return;
      }

      if (!reservaData) {
        toast.error("El boleto no tiene una reserva asociada.");
        return;
      }

      // 5. Buscar pasajero
      const { data: usuarioData, error: usuarioError } = await supabase
        .from("usuarios")
        .select("full_name, cedula, phone, email")
        .eq("id", reservaData.usuario_id)
        .maybeSingle();

      if (usuarioError) {
        console.error("Error al buscar pasajero:", usuarioError);
        toast.error("No se pudo obtener el pasajero de la reserva.");
        return;
      }

      // 6. Buscar viaje
      const { data: viajeData, error: viajeError } = await supabase
        .from("viajes")
        .select("id, estado, chofer_id, fecha_salida, ruta_id")
        .eq("id", reservaData.viaje_id)
        .maybeSingle();

      if (viajeError) {
        console.error("Error al buscar viaje:", viajeError);
        toast.error("No se pudo obtener el viaje del boleto.");
        return;
      }

      if (!viajeData) {
        toast.error("El boleto no tiene un viaje asociado.");
        return;
      }

      // 7. Validar que el viaje pertenezca al chofer logueado
      if (viajeData.chofer_id !== user.id) {
        toast.error("Este boleto no pertenece a un viaje asignado a este chofer.");
        return;
      }

      // 8. Buscar ruta
      const { data: rutaData, error: rutaError } = await supabase
        .from("rutas")
        .select("ciudad_origen, ciudad_destino")
        .eq("id", viajeData.ruta_id)
        .maybeSingle();

      if (rutaError) {
        console.error("Error al buscar ruta:", rutaError);
        toast.error("No se pudo obtener la ruta del viaje.");
        return;
      }

      // 9. Armar boleto encontrado para mostrar en pantalla
      const boletoArmado: BoletoValidacion = {
        id: boletoData.id,
        codigo_qr: boletoData.codigo_qr,
        estado: boletoData.estado,
        usado_at: boletoData.usado_at,
        emitido_at: boletoData.emitido_at,
        detalle_reserva_id: boletoData.detalle_reserva_id,
        detalle_reserva: {
          id: detalleData.id,
          precio_unitario: Number(detalleData.precio_unitario),
          asientos: asientoData
            ? {
                numero: asientoData.numero,
                fila: asientoData.fila,
                columna: asientoData.columna,
                tipo: asientoData.tipo,
              }
            : null,
          reservas: {
            id: reservaData.id,
            estado: reservaData.estado,
            precio_total: Number(reservaData.precio_total),
            tipo_descuento: reservaData.tipo_descuento,
            usuarios: usuarioData
              ? {
                  full_name: usuarioData.full_name,
                  cedula: usuarioData.cedula,
                  phone: usuarioData.phone,
                  email: usuarioData.email,
                }
              : null,
            viajes: {
              id: viajeData.id,
              estado: viajeData.estado,
              chofer_id: viajeData.chofer_id,
              fecha_salida: viajeData.fecha_salida,
              rutas: rutaData
                ? {
                    ciudad_origen: rutaData.ciudad_origen,
                    ciudad_destino: rutaData.ciudad_destino,
                  }
                : null,
            },
          },
        },
      };

      setBoletoEncontrado(boletoArmado);
      toast.success("Boleto encontrado correctamente.");
    } catch (error) {
      console.error("Error inesperado al buscar boleto:", error);
      toast.error("Ocurrió un error inesperado al buscar el boleto.");
    } finally {
      setBuscandoBoleto(false);
    }
  };

  const validarAsistencia = async () => {
    if (!boletoEncontrado) {
      toast.error("Primero busca un boleto.");
      return;
    }

    const estadoReserva = boletoEncontrado.detalle_reserva?.reservas?.estado;

    if (boletoEncontrado.estado !== "activo") {
     toast.error("Este boleto ya fue usado o no está disponible para validación.");
      return;
    }

    if (estadoReserva !== "confirmada") {
      toast.error(obtenerMensajeEstadoReserva(estadoReserva));
      return;
    }

    setValidandoAsistencia(true);

    const fechaUso = new Date().toISOString();

    const { error } = await supabase
      .from("boletos")
      .update({
        estado: "usado",
        usado_at: fechaUso,
      })
      .eq("id", boletoEncontrado.id)
      .eq("estado", "activo");

    setValidandoAsistencia(false);

    if (error) {
      console.error("Error al validar asistencia:", error);
      toast.error("No se pudo validar la asistencia.");
      return;
    }

    setBoletoEncontrado({
      ...boletoEncontrado,
      estado: "usado",
      usado_at: fechaUso,
    });

    toast.success("Asistencia registrada correctamente.");
  };

  const limpiarBusquedaQR = async () => {
    setCodigoQR("");
    setBoletoEncontrado(null);

    if (camaraActiva) {
      await detenerCamara();
    }
  };

  if (loading) {
    return (
      <div className="container py-10 flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Cargando sesión...</span>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">Panel del Chofer</h1>
        <p className="text-muted-foreground">
          Bienvenido, {user?.name}. Desde aquí podrás revisar tus viajes asignados,
          validar boletos por QR y registrar ventas presenciales.
        </p>
      </section>

      <Tabs defaultValue="viajes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="viajes">Mis viajes</TabsTrigger>
          <TabsTrigger value="qr">Escanear QR</TabsTrigger>
          <TabsTrigger value="venta">Venta presencial</TabsTrigger>
        </TabsList>

        <TabsContent value="viajes" className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary grid place-items-center">
                  <Bus className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Viajes asignados</p>
                  <p className="text-2xl font-bold">{viajes.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary grid place-items-center">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Próximo viaje</p>
                  <p className="text-lg font-semibold">
                    {viajes[0]
                      ? new Date(viajes[0].fecha_salida).toLocaleDateString()
                      : "Sin viajes"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary grid place-items-center">
                  <TicketCheck className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Validación de boletos</p>
                  <p className="text-lg font-semibold">Disponible</p>
                </div>
              </div>
            </Card>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Mis viajes asignados</h2>

            {cargandoViajes ? (
              <Card className="p-6 flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Cargando viajes...</span>
              </Card>
            ) : viajes.length === 0 ? (
              <Card className="p-6 text-muted-foreground">
                No tienes viajes asignados por el momento.
              </Card>
            ) : (
              <div className="grid gap-4">
                {viajes.map((viaje) => (
                  <Card key={viaje.id} className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />

                          <h3 className="font-semibold">
                            {viaje.rutas?.ciudad_origen ?? "Origen no disponible"} →{" "}
                            {viaje.rutas?.ciudad_destino ?? "Destino no disponible"}
                          </h3>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          Salida: {new Date(viaje.fecha_salida).toLocaleString()}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          Llegada estimada:{" "}
                          {new Date(viaje.fecha_llegada_est).toLocaleString()}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          Bus: {viaje.buses?.placa ?? "No asignado"}{" "}
                          {viaje.buses?.numero ? `- Nº ${viaje.buses.numero}` : ""}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          Tipo de bus: {viaje.buses?.tipo ?? "No definido"}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 md:items-end">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                          {viaje.estado}
                        </span>

                        <Button variant="outline" disabled>
                          Ver pasajeros
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="qr" className="space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary grid place-items-center">
                <QrCode className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-semibold">Validación de asistencia por QR</h2>
                <p className="text-sm text-muted-foreground">
                  Ingresa el código QR del boleto para validar el acceso del pasajero al bus.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant={camaraActiva ? "destructive" : "outline"}
                  onClick={camaraActiva ? detenerCamara : iniciarCamara}
                  disabled={iniciandoCamara}
                >
                  {iniciandoCamara ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : camaraActiva ? (
                    <CameraOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}

                  {iniciandoCamara
                    ? "Activando cámara..."
                    : camaraActiva
                    ? "Detener cámara"
                    : "Activar cámara"}
                </Button>

                <p className="text-sm text-muted-foreground flex items-center">
                  También puedes escribir o corregir manualmente el código QR.
               </p>
              </div>

              <div
                id={QR_READER_ID}
                className={`overflow-hidden rounded-lg border bg-muted/30 ${
                  camaraActiva || iniciandoCamara ? "block" : "hidden"
               }`}
             />
          </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="codigoQR">Código QR</Label>
                <Input
                  id="codigoQR"
                  value={codigoQR}
                  onChange={(e) => setCodigoQR(e.target.value)}
                  placeholder="Ejemplo: BLT-8-10-1778556384336-WVQCMM"
                />
              </div>

              <Button onClick={buscarBoletoPorQR} disabled={buscandoBoleto}>
                {buscandoBoleto ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Buscar boleto
              </Button>

              <Button variant="outline" onClick={limpiarBusquedaQR}>
                Limpiar
              </Button>
            </div>
          </Card>

          {boletoEncontrado && (
            <Card className="p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Resultado del boleto</h3>
                  <p className="text-sm text-muted-foreground break-all">
                    Código: {boletoEncontrado.codigo_qr}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    boletoEncontrado.estado === "activo"
                      ? "bg-green-100 text-green-700"
                      : boletoEncontrado.estado === "usado"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {boletoEncontrado.estado}
                </span>
              </div>

              {boletoEncontrado.estado !== "activo" && (
                <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800 flex gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium">Este boleto no puede validarse nuevamente.</p>
                    <p className="text-sm">
                      Estado actual: {boletoEncontrado.estado}
                      {boletoEncontrado.usado_at
                        ? ` — usado el ${new Date(
                            boletoEncontrado.usado_at
                          ).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                </div>
              )}

              {boletoEncontrado.estado === "activo" &&
                boletoEncontrado.detalle_reserva?.reservas?.estado !== "confirmada" && (
                   <div className="rounded-lg border border-orange-300 bg-orange-50 p-4 text-orange-800 flex gap-3">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-medium">La asistencia no puede validarse.</p>
                        <p className="text-sm">
                          {obtenerMensajeEstadoReserva(
                            boletoEncontrado.detalle_reserva?.reservas?.estado
                         )}
                       </p>
                      </div>
                    </div>
                )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-semibold">Datos del pasajero</h4>

                  <p className="text-sm">
                    <span className="font-medium">Nombre:</span>{" "}
                    {boletoEncontrado.detalle_reserva?.reservas?.usuarios?.full_name ??
                      "No disponible"}
                  </p>

                  <p className="text-sm">
                    <span className="font-medium">Cédula:</span>{" "}
                    {boletoEncontrado.detalle_reserva?.reservas?.usuarios?.cedula ??
                      "No disponible"}
                  </p>

                  <p className="text-sm">
                    <span className="font-medium">Teléfono:</span>{" "}
                    {boletoEncontrado.detalle_reserva?.reservas?.usuarios?.phone ??
                      "No disponible"}
                  </p>

                  <p className="text-sm">
                    <span className="font-medium">Correo:</span>{" "}
                    {boletoEncontrado.detalle_reserva?.reservas?.usuarios?.email ??
                      "No disponible"}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Datos del viaje y asiento</h4>

                  <p className="text-sm">
                    <span className="font-medium">Ruta:</span>{" "}
                    {boletoEncontrado.detalle_reserva?.reservas?.viajes?.rutas
                      ?.ciudad_origen ?? "Origen"}{" "}
                    →{" "}
                    {boletoEncontrado.detalle_reserva?.reservas?.viajes?.rutas
                      ?.ciudad_destino ?? "Destino"}
                  </p>

                  <p className="text-sm">
                    <span className="font-medium">Salida:</span>{" "}
                    {boletoEncontrado.detalle_reserva?.reservas?.viajes?.fecha_salida
                      ? new Date(
                          boletoEncontrado.detalle_reserva.reservas.viajes.fecha_salida
                        ).toLocaleString()
                      : "No disponible"}
                  </p>

                  <p className="text-sm">
                    <span className="font-medium">Asiento:</span>{" "}
                    {boletoEncontrado.detalle_reserva?.asientos?.numero ?? "N/D"} -{" "}
                    {boletoEncontrado.detalle_reserva?.asientos?.tipo ?? "N/D"}
                  </p>

                  <p className="text-sm">
                    <span className="font-medium">Precio:</span> $
                    {boletoEncontrado.detalle_reserva?.precio_unitario.toFixed(2) ??
                      "0.00"}
                  </p>

                  <p className="text-sm">
                    <span className="font-medium">Reserva:</span>{" "}
                    {boletoEncontrado.detalle_reserva?.reservas?.estado ??
                      "No disponible"}
                  </p>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={validarAsistencia}
                disabled={
                  validandoAsistencia ||
                  boletoEncontrado.estado !== "activo" ||
                  boletoEncontrado.detalle_reserva?.reservas?.estado !== "confirmada"
                }
              >
                {validandoAsistencia ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Validar asistencia
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="venta" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold">Venta presencial durante el viaje</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Este módulo será el siguiente paso. Aquí buscaremos al comprador por cédula,
              cargaremos sus datos, mostraremos asientos disponibles y registraremos el pago
              en efectivo.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}