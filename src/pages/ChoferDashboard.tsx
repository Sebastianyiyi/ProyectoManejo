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
  PlayCircle,
  StopCircle,
  UserSearch,
  Armchair,
  DollarSign,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import type { TKey } from "@/contexts/LanguageContext";
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
  ruta_id: number;
  bus_id: number;
  fecha_salida: string;
  fecha_llegada_est: string;
  fecha_inicio_real: string | null;
  fecha_fin_real: string | null;
  precio_base: number;
  estado: string;
  tipo_viaje: "directo" | "indirecto";
  rutas: RutaInfo | null;
  buses: BusInfo | null;
}

interface ViajeChoferSupabase {
  id: number;
  ruta_id: number;
  bus_id: number;
  fecha_salida: string;
  fecha_llegada_est: string;
  fecha_inicio_real: string | null;
  fecha_fin_real: string | null;
  precio_base: number;
  estado: string;
  tipo_viaje: "directo" | "indirecto";
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

interface UsuarioVenta {
  id: number;
  full_name: string;
  cedula: string;
  phone: string;
  email: string;
  fecha_nacimiento: string | null;
  tiene_discapacidad: boolean;
}

interface AsientoVenta {
  id: number;
  numero: number;
  fila: number;
  columna: string | number;
  tipo: string;
}

interface CiudadParada {
  id: number;
  nombre: string;
  provincia: string | null;
}

interface AsientoSeleccionado {
  asiento: AsientoVenta;
  cedulaOcupante: string;
  ocupante: UsuarioVenta | null;
  tipo_descuento: "ninguno" | "menor" | "tercera_edad" | "discapacidad";
  precio_unitario: number;
}

interface VentaExitosa {
  reservaId: number;
  total: number;
  boletos: {
    codigo_qr: string;
    asiento: number;
    pasajero: string;
  }[];
}

function obtenerPrimerElemento<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

function obtenerMensajeEstadoReserva(estado: string | null | undefined, t: (k: TKey) => string): string {
  switch (estado) {
    case "pendiente_pago": return t("chofer_reserve_pending");
    case "pago_en_verificacion": return t("chofer_reserve_verifying");
    case "cancelada": return t("chofer_reserve_cancelled");
    case "confirmada": return "";
    default: return t("chofer_reserve_invalid");
  }
}

function calcularEdad(fechaNacimiento?: string | null): number | null {
  if (!fechaNacimiento) return null;

  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();

  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }

  return edad;
}

function obtenerDescuentosPermitidos(
  usuario: UsuarioVenta | null
): Array<"ninguno" | "menor" | "tercera_edad" | "discapacidad"> {
  const descuentos: Array<"ninguno" | "menor" | "tercera_edad" | "discapacidad"> = [
    "ninguno",
  ];

  if (!usuario) return descuentos;

  const edad = calcularEdad(usuario.fecha_nacimiento);

  if (edad !== null && edad < 18) {
    descuentos.push("menor");
  }

  if (edad !== null && edad >= 65) {
    descuentos.push("tercera_edad");
  }

  if (usuario.tiene_discapacidad) {
    descuentos.push("discapacidad");
  }

  return descuentos;
}

function calcularPrecioPorAsiento(
  precioBase: number,
  tipoAsiento: string,
  tipoDescuento: string
): number {
  let precio = precioBase;

  if (tipoAsiento === "ventana") {
    precio = precioBase * 1.1;
  }

  if (tipoAsiento === "ejecutivo") {
    precio = precioBase * 1.25;
  }

  if (
    tipoDescuento === "menor" ||
    tipoDescuento === "tercera_edad" ||
    tipoDescuento === "discapacidad"
  ) {
    precio = precio * 0.5;
  }

  return Number(precio.toFixed(2));
}

function generarCodigoBoletoVentaPresencial(
  reservaId: number,
  detalleId: number
): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VP-${reservaId}-${detalleId}-${Date.now()}-${random}`;
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
  const { t } = useLang();

  const [viajes, setViajes] = useState<ViajeChofer[]>([]);
  const [cargandoViajes, setCargandoViajes] = useState(true);

  const [codigoQR, setCodigoQR] = useState("");
  const [boletoEncontrado, setBoletoEncontrado] = useState<BoletoValidacion | null>(null);
  const [buscandoBoleto, setBuscandoBoleto] = useState(false);
  const [validandoAsistencia, setValidandoAsistencia] = useState(false);

  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [iniciandoCamara, setIniciandoCamara] = useState(false);
  const [viajeVentaId, setViajeVentaId] = useState("");
  const [ciudadesParadas, setCiudadesParadas] = useState<CiudadParada[]>([]);
  const [ciudadParadaId, setCiudadParadaId] = useState("");
  const [observacionVenta, setObservacionVenta] = useState("");

  const [cedulaComprador, setCedulaComprador] = useState("");
  const [comprador, setComprador] = useState<UsuarioVenta | null>(null);
  const [buscandoComprador, setBuscandoComprador] = useState(false);

  const [asientosDisponibles, setAsientosDisponibles] = useState<AsientoVenta[]>([]);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState<AsientoSeleccionado[]>([]);
  const [cargandoAsientos, setCargandoAsientos] = useState(false);

  const [efectivoRecibido, setEfectivoRecibido] = useState("");
  const [registrandoVenta, setRegistrandoVenta] = useState(false);
  const [ventaExitosa, setVentaExitosa] = useState<VentaExitosa | null>(null);

  const viajesAsignadosActivos = viajes.filter((viaje) =>
    ["programado", "en_curso"].includes(viaje.estado)
  );

  const viajesCompletados = viajes.filter((viaje) => viaje.estado === "completado");

  const viajesDisponiblesVenta = viajes.filter((viaje) =>
    ["programado", "en_curso"].includes(viaje.estado)
  );


  const viajeVenta =
  viajesDisponiblesVenta.find((viaje) => String(viaje.id) === viajeVentaId) ?? null;

  const totalVenta = asientosSeleccionados.reduce(
    (total, item) => total + item.precio_unitario,
    0
  );

  const efectivoNumero = Number(efectivoRecibido || 0);
  const cambioVenta = efectivoNumero - totalVenta;

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
          ruta_id,
          bus_id,
          fecha_salida,
          fecha_llegada_est,
          fecha_inicio_real,
          fecha_fin_real,
          precio_base,
          estado,
          tipo_viaje,
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
          ruta_id: viaje.ruta_id,
          bus_id: viaje.bus_id,
          fecha_salida: viaje.fecha_salida,
          fecha_llegada_est: viaje.fecha_llegada_est,
          fecha_inicio_real: viaje.fecha_inicio_real,
          fecha_fin_real: viaje.fecha_fin_real,
          precio_base: Number(viaje.precio_base),
          estado: viaje.estado,
          tipo_viaje: viaje.tipo_viaje,
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
      scanner.clear();
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

  useEffect(() => {
    cargarCiudadesParadas();
  }, []);

  useEffect(() => {
    if (viajeVenta) {
      cargarAsientosDisponibles(viajeVenta);
    }
  }, [viajeVentaId]);

  const cargarCiudadesParadas = async () => {
    const { data, error } = await supabase
      .from("ciudades_paradas")
      .select("id, nombre, provincia")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (error) {
      console.error("Error al cargar ciudades/paradas:", error);
      toast.error("No se pudieron cargar las ciudades de parada.");
      return;
    }

    setCiudadesParadas((data ?? []) as CiudadParada[]);
  };

  const buscarUsuarioPorCedula = async (cedula: string): Promise<UsuarioVenta | null> => {
    const cedulaLimpia = cedula.trim();

    if (!cedulaLimpia) {
      toast.error("Ingresa una cédula.");
      return null;
    }

    const { data, error } = await supabase
      .from("usuarios")
      .select("id, full_name, cedula, phone, email, fecha_nacimiento, tiene_discapacidad")
      .eq("cedula", cedulaLimpia)
      .eq("activo", true)
      .maybeSingle();

    if (error) {
      console.error("Error al buscar usuario:", error);
      toast.error("No se pudo buscar el usuario.");
      return null;
    }

    if (!data) {
      toast.error("No se encontró un usuario activo con esa cédula.");
      return null;
    }

    return data as UsuarioVenta;
  };

  const buscarCompradorPorCedula = async () => {
    setBuscandoComprador(true);

    const usuarioEncontrado = await buscarUsuarioPorCedula(cedulaComprador);

    setBuscandoComprador(false);

    if (!usuarioEncontrado) {
      setComprador(null);
      return;
    }

    setComprador(usuarioEncontrado);
    toast.success("Comprador encontrado correctamente.");
  };

  const cargarAsientosDisponibles = async (viaje: ViajeChofer) => {
    setCargandoAsientos(true);
    setAsientosSeleccionados([]);
    setVentaExitosa(null);

    try {
      const { data: asientosData, error: asientosError } = await supabase
        .from("asientos")
        .select("id, numero, fila, columna, tipo")
        .eq("bus_id", viaje.bus_id)
        .eq("activo", true)
        .order("numero", { ascending: true });

      if (asientosError) {
        console.error("Error al cargar asientos:", asientosError);
        toast.error("No se pudieron cargar los asientos.");
        return;
      }

      const { data: reservasData, error: reservasError } = await supabase
        .from("reservas")
        .select("id")
        .eq("viaje_id", viaje.id)
        .in("estado", ["pendiente_pago", "pago_en_verificacion", "confirmada"]);

      if (reservasError) {
        console.error("Error al cargar reservas ocupadas:", reservasError);
        toast.error("No se pudieron validar los asientos ocupados.");
        return;
      }

      const reservaIds = (reservasData ?? []).map((reserva) => reserva.id);

      let asientosOcupados: number[] = [];

      if (reservaIds.length > 0) {
        const { data: detalleData, error: detalleError } = await supabase
          .from("detalle_reserva")
          .select("asiento_id")
          .in("reserva_id", reservaIds);

        if (detalleError) {
          console.error("Error al cargar detalle de reservas:", detalleError);
          toast.error("No se pudieron validar los asientos ocupados.");
          return;
        }

      asientosOcupados = (detalleData ?? []).map((detalle) => detalle.asiento_id);
    }

    const disponibles = ((asientosData ?? []) as AsientoVenta[]).filter(
      (asiento) => !asientosOcupados.includes(asiento.id)
    );

    setAsientosDisponibles(disponibles);
  } finally {
    setCargandoAsientos(false);
  }
};

  const iniciarViaje = async () => {
    if (!viajeVenta) {
      toast.error("Selecciona un viaje.");
      return;
    }

    const ahora = new Date();
    const fechaSalida = new Date(viajeVenta.fecha_salida);

    if (ahora < fechaSalida) {
      toast.error("El viaje solo puede iniciarse a partir de la fecha de salida.");
     return;
    }

    const { error } = await supabase
      .from("viajes")
      .update({
        estado: "en_curso",
        fecha_inicio_real: ahora.toISOString(),
      })
      .eq("id", viajeVenta.id);

    if (error) {
      console.error("Error al iniciar viaje:", error);
      toast.error("No se pudo iniciar el viaje.");
      return;
    }

    setViajes((prev) =>
      prev.map((viaje) =>
       viaje.id === viajeVenta.id
          ? {
              ...viaje,
              estado: "en_curso",
              fecha_inicio_real: ahora.toISOString(),
            }
          : viaje
      )
    );

    toast.success("Viaje iniciado correctamente.");
  };

  const terminarViaje = async () => {
    if (!viajeVenta) {
      toast.error("Selecciona un viaje.");
      return;
    }

    const ahora = new Date().toISOString();

    const { error } = await supabase
      .from("viajes")
      .update({
        estado: "completado",
        fecha_fin_real: ahora,
        fecha_llegada_est: ahora,
      })
      .eq("id", viajeVenta.id);

    if (error) {
      console.error("Error al terminar viaje:", error);
      toast.error("No se pudo terminar el viaje.");
      return;
    }

    setViajes((prev) =>
      prev.map((viaje) =>
        viaje.id === viajeVenta.id
         ? {
            ...viaje,
            estado: "completado",
            fecha_fin_real: ahora,
            fecha_llegada_est: ahora,
          }
          : viaje
      )
    );

    setAsientosSeleccionados([]);
    setAsientosDisponibles([]);

    toast.success("Viaje terminado correctamente.");
  };

  const seleccionarAsientoVenta = (asiento: AsientoVenta) => {
    if (!viajeVenta) return;

    const yaSeleccionado = asientosSeleccionados.some(
      (item) => item.asiento.id === asiento.id
    );

    if (yaSeleccionado) {
      setAsientosSeleccionados((prev) =>
        prev.filter((item) => item.asiento.id !== asiento.id)
      );
      return;
    }

    setAsientosSeleccionados((prev) => [
      ...prev,
      {
        asiento,
        cedulaOcupante: comprador?.cedula ?? "",
        ocupante: comprador,
        tipo_descuento: "ninguno",
        precio_unitario: calcularPrecioPorAsiento(
          viajeVenta.precio_base,
          asiento.tipo,
          "ninguno"
        ),
      },
    ]);
  };

  const actualizarCedulaOcupante = (asientoId: number, cedula: string) => {
    setAsientosSeleccionados((prev) =>
      prev.map((item) =>
        item.asiento.id === asientoId
          ? {
              ...item,
              cedulaOcupante: cedula,
              ocupante: null,
              tipo_descuento: "ninguno",
              precio_unitario: viajeVenta
                ? calcularPrecioPorAsiento(viajeVenta.precio_base, item.asiento.tipo, "ninguno")
                : item.precio_unitario,
            }
          : item
      )
    );
  };

  const buscarOcupanteAsiento = async (asientoId: number) => {
    const item = asientosSeleccionados.find(
      (seleccionado) => seleccionado.asiento.id === asientoId
    );

    if (!item || !viajeVenta) return;

    const ocupanteEncontrado = await buscarUsuarioPorCedula(item.cedulaOcupante);

    if (!ocupanteEncontrado) return;

    setAsientosSeleccionados((prev) =>
      prev.map((seleccionado) =>
        seleccionado.asiento.id === asientoId
          ? {
              ...seleccionado,
              ocupante: ocupanteEncontrado,
              tipo_descuento: "ninguno",
              precio_unitario: calcularPrecioPorAsiento(
                viajeVenta.precio_base,
                seleccionado.asiento.tipo,
                "ninguno"
              ),
            }
          : seleccionado
      )
    );

    toast.success("Ocupante cargado correctamente.");
  };

  const cambiarDescuentoAsiento = (
    asientoId: number,
    tipoDescuento: "ninguno" | "menor" | "tercera_edad" | "discapacidad"
  ) => {
    if (!viajeVenta) return;

    setAsientosSeleccionados((prev) =>
      prev.map((item) => {
        if (item.asiento.id !== asientoId) return item;

        const descuentosPermitidos = obtenerDescuentosPermitidos(item.ocupante);

        if (!descuentosPermitidos.includes(tipoDescuento)) {
          toast.error("El ocupante no cumple con las condiciones para ese descuento.");
          return item;
        }

        return {
          ...item,
          tipo_descuento: tipoDescuento,
          precio_unitario: calcularPrecioPorAsiento(
            viajeVenta.precio_base,
            item.asiento.tipo,
            tipoDescuento
          ),
        };
      })
   );
  };

  const registrarVentaPresencial = async () => {
    if (!user?.id) {
      toast.error("No se pudo identificar al chofer.");
      return;
    }

    if (!viajeVenta) {
      toast.error("Selecciona un viaje.");
      return;
    }

    if (viajeVenta.estado !== "en_curso") {
      toast.error("Solo se pueden vender boletos si el viaje está en curso.");
      return;
    }

    if (viajeVenta.tipo_viaje !== "indirecto") {
      toast.error("Solo los viajes indirectos permiten venta presencial.");
      return;
    }

    if (!comprador) {
      toast.error("Primero busca el comprador por cédula.");
      return;
    }

    if (!ciudadParadaId) {
      toast.error("Selecciona la ciudad o parada donde se realiza la venta.");
      return;
    }

    if (asientosSeleccionados.length === 0) {
      toast.error("Selecciona al menos un asiento.");
      return;
    }

    const asientoSinOcupante = asientosSeleccionados.find((item) => !item.ocupante);

    if (asientoSinOcupante) {
      toast.error(`Busca el ocupante del asiento ${asientoSinOcupante.asiento.numero}.`);
      return;
    }

    if (efectivoNumero < totalVenta) {
      toast.error("El efectivo recibido no puede ser menor al total a pagar.");
     return;
    }

    setRegistrandoVenta(true);

    try {
      const { data: reservaData, error: reservaError } = await supabase
        .from("reservas")
        .insert({
          usuario_id: comprador.id,
          viaje_id: viajeVenta.id,
          tipo_descuento: "ninguno",
          precio_total: Number(totalVenta.toFixed(2)),
          estado: "confirmada",
        })
        .select("id")
        .single();

      if (reservaError || !reservaData) {
        console.error("Error al crear reserva:", reservaError);
        toast.error("No se pudo crear la reserva.");
        return;
      }

      const reservaId = reservaData.id;

      const detallesInsert = asientosSeleccionados.map((item) => ({
        reserva_id: reservaId,
        asiento_id: item.asiento.id,
        precio_unitario: item.precio_unitario,
        ocupante_id: item.ocupante!.id,
        tipo_descuento: item.tipo_descuento,
      }));

      const { data: detallesData, error: detallesError } = await supabase
        .from("detalle_reserva")
        .insert(detallesInsert)
        .select("id, asiento_id");

      if (detallesError || !detallesData) {
        console.error("Error al crear detalles de reserva:", detallesError);
        toast.error("No se pudieron registrar los asientos.");
        return;
      }

      const { error: pagoError } = await supabase.from("pagos").insert({
        reserva_id: reservaId,
        monto: Number(totalVenta.toFixed(2)),
        comprobante_url: null,
        estado: "verificado",
        verificado_por: user.id,
        fecha_verificacion: new Date().toISOString(),
        metodo_pago: "efectivo",
      });

      if (pagoError) {
        console.error("Error al crear pago:", pagoError);
        toast.error("No se pudo registrar el pago.");
        return;
      }

      const { error: ventaError } = await supabase.from("venta_presencial").insert({
        reserva_id: reservaId,
        viaje_id: viajeVenta.id,
        chofer_id: user.id,
        ciudad_parada_id: Number(ciudadParadaId),
        observacion: observacionVenta.trim() || null,
        precio_total: Number(totalVenta.toFixed(2)),
      });

      if (ventaError) {
        console.error("Error al registrar venta presencial:", ventaError);
        toast.error("No se pudo registrar la venta presencial.");
        return;
      }

      const fechaUso = new Date().toISOString();

      const boletosInsert = detallesData.map((detalle) => {
        const item = asientosSeleccionados.find(
          (seleccionado) => seleccionado.asiento.id === detalle.asiento_id
        );

        return {
          detalle_reserva_id: detalle.id,
          codigo_qr: generarCodigoBoletoVentaPresencial(reservaId, detalle.id),
          estado: "usado",
          emitido_at: fechaUso,
          usado_at: fechaUso,
          _asiento_numero: item?.asiento.numero ?? 0,
          _pasajero: item?.ocupante?.full_name ?? "Pasajero",
        };
      });

      const { error: boletosError } = await supabase
        .from("boletos")
        .insert(
          boletosInsert.map(({ _asiento_numero, _pasajero, ...boleto }) => boleto)
        );

      if (boletosError) {
        console.error("Error al crear boletos:", boletosError);
        toast.error("No se pudieron crear los boletos.");
        return;
      }

      setVentaExitosa({
        reservaId,
        total: Number(totalVenta.toFixed(2)),
        boletos: boletosInsert.map((boleto) => ({
          codigo_qr: boleto.codigo_qr,
          asiento: boleto._asiento_numero,
          pasajero: boleto._pasajero,
        })),
      });

      toast.success("Venta presencial registrada correctamente.");

      await cargarAsientosDisponibles(viajeVenta);

      setCedulaComprador("");
      setComprador(null);
      setAsientosSeleccionados([]);
      setEfectivoRecibido("");
      setObservacionVenta("");
    } finally {
      setRegistrandoVenta(false);
    }
  };

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
      toast.error(obtenerMensajeEstadoReserva(estadoReserva, t));
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
        <span>{t("chofer_loading")}</span>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">{t("chofer_title")}</h1>
        <p className="text-muted-foreground">
          {t("auth_welcome")}, {user?.name}. {t("chofer_desc")}
        </p>
      </section>

      <Tabs defaultValue="viajes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="viajes">{t("chofer_tab_trips")}</TabsTrigger>
          <TabsTrigger value="qr">{t("chofer_tab_qr")}</TabsTrigger>
          <TabsTrigger value="venta">{t("chofer_tab_sale")}</TabsTrigger>
        </TabsList>

        <TabsContent value="viajes" className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary grid place-items-center">
                  <Bus className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">{t("chofer_stat_assigned")}</p>
                  <p className="text-2xl font-bold">{viajesAsignadosActivos.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary grid place-items-center">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">{t("chofer_stat_next")}</p>
                  <p className="text-lg font-semibold">
                    {viajesDisponiblesVenta[0]
                      ? new Date(viajesDisponiblesVenta[0].fecha_salida).toLocaleDateString()
                      : t("chofer_stat_no_trips")}
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
                  <p className="text-sm text-muted-foreground">{t("chofer_stat_validation")}</p>
                  <p className="text-lg font-semibold">{t("chofer_stat_available")}</p>
                </div>
              </div>
            </Card>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t("chofer_trips_title")}</h2>

            {cargandoViajes ? (
              <Card className="p-6 flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t("chofer_trips_loading")}</span>
              </Card>
            ) : viajesAsignadosActivos.length === 0 ? (
              <Card className="p-6 text-muted-foreground">
                {t("chofer_trips_empty")}
              </Card>
            ) : (
              <div className="grid gap-4">
                {viajesAsignadosActivos.map((viaje) => (
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
                          {t("chofer_departure")} {new Date(viaje.fecha_salida).toLocaleString()}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          {t("chofer_arrival")}{" "}
                          {new Date(viaje.fecha_llegada_est).toLocaleString()}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          {t("chofer_bus_label")} {viaje.buses?.placa ?? t("chofer_bus_unassigned")}{" "}
                          {viaje.buses?.numero ? `- Nº ${viaje.buses.numero}` : ""}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          {t("chofer_bus_type")} {viaje.buses?.tipo ?? t("chofer_bus_type_undefined")}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 md:items-end">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                          {viaje.estado}
                        </span>

                        <Button variant="outline" disabled>
                          {t("chofer_see_passengers")}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
           <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t("chofer_history_title")}</h2>

            {cargandoViajes ? (
              <Card className="p-6 flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t("chofer_trips_loading")}</span>
              </Card>
            ) : viajesCompletados.length === 0 ? (
              <Card className="p-6 text-muted-foreground">
                {t("chofer_history_empty")}
              </Card>
            ) : (
              <div className="grid gap-4">
                {viajesCompletados.map((viaje) => (
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
                          {t("chofer_departure")} {new Date(viaje.fecha_salida).toLocaleString()}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          {t("chofer_arrival")}{" "}
                          {new Date(viaje.fecha_llegada_est).toLocaleString()}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          {t("chofer_bus_label")} {viaje.buses?.placa ?? t("chofer_bus_unassigned")}{" "}
                          {viaje.buses?.numero ? `- Nº ${viaje.buses.numero}` : ""}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          {t("chofer_bus_type")} {viaje.buses?.tipo ?? t("chofer_bus_type_undefined")}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 md:items-end">
                        <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                          {viaje.estado}
                        </span>

                        <Button variant="outline" disabled>
                          {t("chofer_see_passengers")}
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
                <h2 className="text-xl font-semibold">{t("chofer_qr_title")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("chofer_qr_desc")}
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
                    ? t("chofer_camera_starting")
                    : camaraActiva
                    ? t("chofer_camera_stop")
                    : t("chofer_camera_start")}
                </Button>

                <p className="text-sm text-muted-foreground flex items-center">
                  {t("chofer_camera_manual")}
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
                <Label htmlFor="codigoQR">{t("chofer_qr_label")}</Label>
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
                {t("chofer_search_ticket")}
              </Button>

              <Button variant="outline" onClick={limpiarBusquedaQR}>
                {t("chofer_clear")}
              </Button>
            </div>
          </Card>

          {boletoEncontrado && (
            <Card className="p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{t("chofer_ticket_result")}</h3>
                  <p className="text-sm text-muted-foreground break-all">
                    {t("chofer_ticket_code")} {boletoEncontrado.codigo_qr}
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
                    <p className="font-medium">{t("chofer_ticket_cannot_validate")}</p>
                    <p className="text-sm">
                      {t("chofer_ticket_state")} {boletoEncontrado.estado}
                      {boletoEncontrado.usado_at
                        ? ` — ${t("chofer_ticket_used_at")} ${new Date(
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
                        <p className="font-medium">{t("chofer_attendance_cannot")}</p>
                        <p className="text-sm">
                          {obtenerMensajeEstadoReserva(
                            boletoEncontrado.detalle_reserva?.reservas?.estado, t
                         )}
                       </p>
                      </div>
                    </div>
                )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-semibold">{t("chofer_passenger_data")}</h4>

                  <p className="text-sm">
                    <span className="font-medium">{t("chofer_field_name")}</span>{" "}
                    {boletoEncontrado.detalle_reserva?.reservas?.usuarios?.full_name ?? t("chofer_field_na")}
                  </p>

                  <p className="text-sm">
                    <span className="font-medium">{t("chofer_field_cedula")}</span>{" "}
                    {boletoEncontrado.detalle_reserva?.reservas?.usuarios?.cedula ?? t("chofer_field_na")}
                  </p>

                  <p className="text-sm">
                    <span className="font-medium">{t("chofer_field_phone")}</span>{" "}
                    {boletoEncontrado.detalle_reserva?.reservas?.usuarios?.phone ?? t("chofer_field_na")}
                  </p>

                  <p className="text-sm">
                    <span className="font-medium">{t("chofer_field_email")}</span>{" "}
                    {boletoEncontrado.detalle_reserva?.reservas?.usuarios?.email ?? t("chofer_field_na")}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">{t("chofer_trip_seat_data")}</h4>

                  <p className="text-sm">
                    <span className="font-medium">{t("chofer_field_route")}</span>{" "}
                    {boletoEncontrado.detalle_reserva?.reservas?.viajes?.rutas?.ciudad_origen ?? "Origen"}{" "}
                    →{" "}
                    {boletoEncontrado.detalle_reserva?.reservas?.viajes?.rutas?.ciudad_destino ?? "Destino"}
                  </p>

                  <p className="text-sm">
                    <span className="font-medium">{t("chofer_field_departure")}</span>{" "}
                    {boletoEncontrado.detalle_reserva?.reservas?.viajes?.fecha_salida
                      ? new Date(boletoEncontrado.detalle_reserva.reservas.viajes.fecha_salida).toLocaleString()
                      : t("chofer_field_na")}
                  </p>

                  <p className="text-sm">
                    <span className="font-medium">{t("chofer_field_seat")}</span>{" "}
                    {boletoEncontrado.detalle_reserva?.asientos?.numero ?? "N/D"} -{" "}
                    {boletoEncontrado.detalle_reserva?.asientos?.tipo ?? "N/D"}
                  </p>

                  <p className="text-sm">
                    <span className="font-medium">{t("chofer_field_price")}</span> $
                    {boletoEncontrado.detalle_reserva?.precio_unitario.toFixed(2) ?? "0.00"}
                  </p>

                  <p className="text-sm">
                    <span className="font-medium">{t("chofer_field_reservation")}</span>{" "}
                    {boletoEncontrado.detalle_reserva?.reservas?.estado ?? t("chofer_field_na")}
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
                {t("chofer_validate")}
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="venta" className="space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary grid place-items-center">
                <DollarSign className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-semibold">{t("chofer_sale_title")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("chofer_sale_desc")}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("chofer_sale_trip_label")}</Label>
              <select
                value={viajeVentaId}
                onChange={(e) => {
                  setViajeVentaId(e.target.value);
                  setComprador(null);
                  setCedulaComprador("");
                  setAsientosSeleccionados([]);
                  setVentaExitosa(null);
                  setEfectivoRecibido("");
                }}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{t("chofer_sale_trip_select")}</option>
                {viajesDisponiblesVenta.map((viaje) => (
                  <option key={viaje.id} value={viaje.id}>
                    Viaje #{viaje.id} - {viaje.rutas?.ciudad_origen} →{" "}
                    {viaje.rutas?.ciudad_destino} - {viaje.estado} - {viaje.tipo_viaje}
                  </option>
                ))}
              </select>
            </div>

            {viajeVenta && (
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="font-semibold">{t("chofer_trip_info")}</h3>

                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <p>
                    <span className="font-medium">{t("chofer_field_route")}</span>{" "}
                    {viajeVenta.rutas?.ciudad_origen} → {viajeVenta.rutas?.ciudad_destino}
                  </p>

                  <p>
                    <span className="font-medium">{t("chofer_field_status")}</span> {viajeVenta.estado}
                  </p>

                  <p>
                    <span className="font-medium">{t("chofer_field_type")}</span> {viajeVenta.tipo_viaje}
                  </p>

                  <p>
                    <span className="font-medium">{t("chofer_field_departure")}</span>{" "}
                    {new Date(viajeVenta.fecha_salida).toLocaleString()}
                  </p>

                  <p>
                    <span className="font-medium">{t("chofer_field_bus")}</span>{" "}
                    {viajeVenta.buses?.placa ?? t("chofer_bus_unassigned")}
                  </p>

                  <p>
                    <span className="font-medium">{t("chofer_field_base_price")}</span> $
                    {viajeVenta.precio_base.toFixed(2)}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={iniciarViaje}
                    disabled={
                      viajeVenta.estado !== "programado" ||
                      new Date() < new Date(viajeVenta.fecha_salida)
                    }
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    {t("chofer_start_trip")}
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={terminarViaje}
                    disabled={viajeVenta.estado !== "en_curso"}
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    {t("chofer_end_trip")}
                  </Button>
                </div>

                {viajeVenta.estado !== "en_curso" && (
                  <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
                    {t("chofer_need_in_progress")}
                  </div>
                )}

                {viajeVenta.estado === "en_curso" && viajeVenta.tipo_viaje === "directo" && (
                  <div className="rounded-lg border border-orange-300 bg-orange-50 p-3 text-sm text-orange-800">
                    {t("chofer_direct_no_sale")}
                  </div>
                )}
              </div>
            )}
          </Card>

          {viajeVenta &&
            viajeVenta.estado === "en_curso" &&
            viajeVenta.tipo_viaje === "indirecto" && (
              <>
                <Card className="p-6 space-y-5">
                  <h3 className="text-lg font-semibold">{t("chofer_sale_data_title")}</h3>

                  <div className="grid md:grid-cols-[1fr_auto] gap-3 md:items-end">
                    <div className="space-y-2">
                      <Label>{t("chofer_buyer_cedula")}</Label>
                      <Input
                        value={cedulaComprador}
                        onChange={(e) => setCedulaComprador(e.target.value)}
                        placeholder={t("chofer_buyer_placeholder")}
                      />
                    </div>

                    <Button onClick={buscarCompradorPorCedula} disabled={buscandoComprador}>
                      {buscandoComprador ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <UserSearch className="h-4 w-4 mr-2" />
                      )}
                      {t("chofer_search_buyer")}
                    </Button>
                  </div>

                  {comprador && (
                    <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
                      <p>
                        <span className="font-medium">{t("chofer_buyer_label")}</span> {comprador.full_name}
                      </p>
                      <p>
                        <span className="font-medium">{t("chofer_field_cedula")}</span> {comprador.cedula}
                      </p>
                      <p>
                        <span className="font-medium">{t("chofer_field_phone")}</span> {comprador.phone}
                      </p>
                      <p>
                        <span className="font-medium">{t("chofer_field_email")}</span> {comprador.email}
                      </p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{t("chofer_city_label")}</Label>
                      <select
                        value={ciudadParadaId}
                        onChange={(e) => setCiudadParadaId(e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">{t("chofer_city_select")}</option>
                        {ciudadesParadas.map((ciudad) => (
                          <option key={ciudad.id} value={ciudad.id}>
                            {ciudad.nombre}
                            {ciudad.provincia ? ` - ${ciudad.provincia}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("chofer_obs_label")}</Label>
                      <Input
                        value={observacionVenta}
                        onChange={(e) => setObservacionVenta(e.target.value)}
                        placeholder={t("chofer_obs_placeholder")}
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-6 space-y-5">
                  <div className="flex items-center gap-2">
                    <Armchair className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{t("chofer_seats_title")}</h3>
                  </div>

                  {cargandoAsientos ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("chofer_seats_loading")}
                    </div>
                  ) : asientosDisponibles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t("chofer_seats_empty")}
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                      {asientosDisponibles.map((asiento) => {
                        const seleccionado = asientosSeleccionados.some(
                          (item) => item.asiento.id === asiento.id
                        );

                        return (
                          <Button
                            key={asiento.id}
                            type="button"
                            variant={seleccionado ? "default" : "outline"}
                            onClick={() => seleccionarAsientoVenta(asiento)}
                            className="h-12"
                          >
                            {asiento.numero}
                         </Button>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {asientosSeleccionados.length > 0 && (
                  <Card className="p-6 space-y-5">
                    <h3 className="text-lg font-semibold">{t("chofer_occupants_title")}</h3>

                    <div className="space-y-4">
                      {asientosSeleccionados.map((item) => {
                        const descuentosPermitidos = obtenerDescuentosPermitidos(item.ocupante);

                        return (
                          <div key={item.asiento.id} className="rounded-lg border p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">
                                {t("chofer_seat_label")} {item.asiento.numero} - {item.asiento.tipo}
                              </h4>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => seleccionarAsientoVenta(item.asiento)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t("chofer_remove")}
                              </Button>
                            </div>

                            <div className="grid md:grid-cols-[1fr_auto] gap-3 md:items-end">
                              <div className="space-y-2">
                                <Label>{t("chofer_occupant_cedula")}</Label>
                                <Input
                                  value={item.cedulaOcupante}
                                  onChange={(e) =>
                                    actualizarCedulaOcupante(item.asiento.id, e.target.value)
                                  }
                                  placeholder={t("chofer_occupant_placeholder")}
                                />
                              </div>

                              <Button
                                variant="outline"
                                onClick={() => buscarOcupanteAsiento(item.asiento.id)}
                              >
                                {t("chofer_search_occupant")}
                              </Button>
                            </div>

                            {item.ocupante && (
                              <div className="text-sm rounded-lg bg-muted/30 p-3 space-y-1">
                                <p>
                                  <span className="font-medium">{t("chofer_occupant_label")}</span>{" "}
                                  {item.ocupante.full_name}
                                </p>
                                <p>
                                  <span className="font-medium">{t("chofer_field_cedula")}</span>{" "}
                                  {item.ocupante.cedula}
                                </p>
                                <p>
                                  <span className="font-medium">{t("chofer_field_age")}</span>{" "}
                                  {calcularEdad(item.ocupante.fecha_nacimiento) ?? t("chofer_age_not_registered")}
                                </p>
                                <p>
                                  <span className="font-medium">{t("chofer_disability")}</span>{" "}
                                  {item.ocupante.tiene_discapacidad ? "Sí" : "No"}
                                </p>
                              </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>{t("chofer_discount_label")}</Label>
                                <select
                                  value={item.tipo_descuento}
                                  onChange={(e) =>
                                    cambiarDescuentoAsiento(
                                      item.asiento.id,
                                      e.target.value as
                                        | "ninguno"
                                        | "menor"
                                        | "tercera_edad"
                                        | "discapacidad"
                                    )
                                  }
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                >
                                  <option value="ninguno">{t("chofer_discount_none")}</option>
                                  <option
                                    value="menor"
                                    disabled={!descuentosPermitidos.includes("menor")}
                                  >
                                    {t("chofer_discount_minor")}
                                  </option>
                                  <option
                                    value="tercera_edad"
                                    disabled={!descuentosPermitidos.includes("tercera_edad")}
                                  >
                                    {t("chofer_discount_elderly")}
                                  </option>
                                  <option
                                    value="discapacidad"
                                    disabled={!descuentosPermitidos.includes("discapacidad")}
                                  >
                                    {t("chofer_discount_disability")}
                                  </option>
                                </select>
                              </div>

                              <div className="space-y-2">
                                <Label>{t("chofer_seat_price")}</Label>
                                <Input value={`$${item.precio_unitario.toFixed(2)}`} readOnly />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                <Card className="p-6 space-y-5">
                  <h3 className="text-lg font-semibold">{t("chofer_payment_title")}</h3>

                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>{t("chofer_total_pay")}</Label>
                      <Input value={`$${totalVenta.toFixed(2)}`} readOnly />
                    </div>

                    <div className="space-y-2">
                      <Label>{t("chofer_cash_received")}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={efectivoRecibido}
                        onChange={(e) => setEfectivoRecibido(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t("chofer_change")}</Label>
                      <Input
                        value={efectivoNumero >= totalVenta ? `$${cambioVenta.toFixed(2)}` : "$0.00"}
                        readOnly
                      />
                    </div>
                  </div>

                 <Button
                    className="w-full"
                    onClick={registrarVentaPresencial}
                    disabled={registrandoVenta}
                  >
                    {registrandoVenta ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    {t("chofer_confirm_sale")}
                  </Button>
                </Card>

                {ventaExitosa && (
                  <Card className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold">{t("chofer_sale_success_title")}</h3>

                    <p className="text-sm">
                      <span className="font-medium">{t("chofer_sale_reservation")}</span> #{ventaExitosa.reservaId}
                    </p>

                    <p className="text-sm">
                      <span className="font-medium">{t("chofer_sale_total")}</span> ${ventaExitosa.total.toFixed(2)}
                    </p>

                    <div className="space-y-2">
                      <h4 className="font-semibold">{t("chofer_tickets_generated")}</h4>

                      {ventaExitosa.boletos.map((boleto) => (
                        <div key={boleto.codigo_qr} className="rounded-lg border p-3 text-sm">
                          <p>
                            <span className="font-medium">{t("chofer_ticket_passenger")}</span> {boleto.pasajero}
                          </p>
                          <p>
                            <span className="font-medium">{t("chofer_ticket_seat")}</span> {boleto.asiento}
                          </p>
                          <p className="break-all">
                            <span className="font-medium">{t("chofer_ticket_qr")}</span> {boleto.codigo_qr}
                          </p>
                       </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}