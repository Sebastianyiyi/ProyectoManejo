import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "es" | "en";

const T = {
  es: {
    // Navegación
    nav_search: "Buscar viajes",
    nav_reservations: "Mis reservas",
    nav_dashboard: "Panel de gestión",
    nav_login: "Ingresar",
    nav_signup: "Crear cuenta",
    nav_settings: "Configuración",
    nav_logout: "Cerrar sesión",
    nav_account: "Mi cuenta",
    // Configuración
    config_title: "Configuración",
    config_appearance: "Apariencia",
    config_dark: "Modo oscuro",
    config_dark_desc: "Cambia la apariencia de la plataforma",
    config_language: "Idioma",
    config_notifications: "Notificaciones",
    config_notif_desc: "Recibir alertas del sistema",
    config_profile: "Perfil",
    config_name: "Nombre completo",
    config_photo: "URL de foto de perfil",
    config_password: "Nueva contraseña",
    config_confirm_password: "Confirmar contraseña",
    config_save: "Guardar",
    config_saving: "Guardando...",
    config_saved: "Cambios guardados ✓",
    config_password_mismatch: "Las contraseñas no coinciden",
    config_name_required: "El nombre es obligatorio",
    // Index — Hero
    hero_badge: "✨ Boletos de bus en línea, Ecuador",
    hero_title: "Viaja seguro y rápido por Ecuador",
    hero_subtitle: "Reserva boletos de bus al instante. Pago seguro, asientos garantizados y boleto digital en tu celular.",
    hero_search_required: "Completa todos los campos para buscar",
    // Index — Buscador
    search_origin: "Origen",
    search_origin_placeholder: "¿De dónde sales?",
    search_destination: "Destino",
    search_destination_placeholder: "¿A dónde vas?",
    search_date: "Fecha",
    search_btn: "Buscar viajes",
    // Index — Beneficios
    benefits_title: "¿Por qué BusEcuador?",
    benefits_subtitle: "Una experiencia de compra moderna pensada para pasajeros y cooperativas.",
    benefit_seat_title: "Selección visual de asiento",
    benefit_seat_desc: "Elige tu lugar exacto en un mapa interactivo del bus.",
    benefit_pay_title: "Pago seguro con validación",
    benefit_pay_desc: "Sube tu comprobante de transferencia y un oficinista lo valida.",
    benefit_qr_title: "Boleto digital con QR",
    benefit_qr_desc: "Lleva tu boleto en el celular y aborda mostrando el QR.",
    benefit_discount_title: "Descuentos legales",
    benefit_discount_desc: "Aplicamos automáticamente menores, tercera edad y discapacidad.",
    benefit_multi_title: "Compra para varios",
    benefit_multi_desc: "Adquiere varios asientos en una sola reserva.",
    benefit_coop_title: "Cooperativas verificadas",
    benefit_coop_desc: "Trabajamos con operadoras autorizadas por la ANT.",
    // Index — CTA
    cta_title: "¿Listo para tu próximo viaje?",
    cta_subtitle: "Crea tu cuenta gratis y empieza a reservar boletos en segundos.",
    cta_signup: "Crear cuenta",
    cta_search: "Buscar viajes",
    // Buscar
    buscar_city: "Ciudad",
    buscar_bus_type: "Tipo de bus",
    buscar_all: "Todos",
    buscar_btn: "Buscar",
    buscar_empty_title: "No encontramos viajes",
    buscar_empty_desc: "Prueba ajustando los filtros o cambia la fecha.",
    buscar_discount_applied: "50% dto. aplicado",
    buscar_select_seats: "Elegir asientos",
    // Compra — etapa asientos
    compra_loading: "Cargando disponibilidad...",
    compra_error: "Error",
    compra_trip_selected: "Viaje seleccionado",
    compra_price_per_seat: "Precio por asiento",
    compra_base_price: "precio base",
    compra_available: "Disponible",
    compra_selected: "Seleccionado",
    compra_occupied: "Ocupado",
    compra_bus_front: "Frente del bus",
    compra_floor1: "Piso 1",
    compra_floor2: "Piso 2 — Premium",
    compra_select_prompt_single: "Selecciona 1 asiento para continuar",
    compra_select_prompt_multi: "asientos seleccionados",
    compra_continue: "Continuar al pago →",
    // Compra — etapa pago
    compra_back: "← Volver a asientos",
    compra_summary_title: "Resumen de compra",
    compra_route: "Ruta",
    compra_bus_type: "Tipo de bus",
    compra_date: "Fecha",
    compra_passenger: "Pasajero",
    compra_seats: "Asientos",
    compra_discount: "Descuento",
    compra_total: "Total a pagar",
    compra_voucher_title: "Comprobante de pago",
    compra_voucher_desc: "Realiza la transferencia y sube el comprobante. Un oficinista verificará el pago.",
    compra_transfer_data: "Datos de transferencia:",
    compra_upload_label: "Subir comprobante (imagen o PDF)",
    compra_submit: "Confirmar reserva y enviar comprobante",
    compra_submitting: "Procesando reserva...",
    compra_no_discount: "Sin descuento",
    // Compra — etapa confirmación
    compra_confirmed_title: "Reserva confirmada",
    compra_confirmed_desc: "Tu comprobante fue recibido. El oficinista verificará el pago pronto.",
    compra_reservation_num: "Reserva #",
    compra_total_paid: "Total pagado",
    compra_qr_hint: "Muestra este QR al subir al bus",
    compra_print: "Imprimir boleto",
    compra_go_home: "Ir al inicio",
    // Footer
    footer_rights: "Sistema de venta de boletos.",
    footer_made_for: "Hecho para cooperativas de transporte del Ecuador.",
  },
  en: {
    // Navigation
    nav_search: "Search trips",
    nav_reservations: "My reservations",
    nav_dashboard: "Management panel",
    nav_login: "Log in",
    nav_signup: "Sign up",
    nav_settings: "Settings",
    nav_logout: "Sign out",
    nav_account: "My account",
    // Settings
    config_title: "Settings",
    config_appearance: "Appearance",
    config_dark: "Dark mode",
    config_dark_desc: "Change the platform appearance",
    config_language: "Language",
    config_notifications: "Notifications",
    config_notif_desc: "Receive system alerts",
    config_profile: "Profile",
    config_name: "Full name",
    config_photo: "Profile photo URL",
    config_password: "New password",
    config_confirm_password: "Confirm password",
    config_save: "Save",
    config_saving: "Saving...",
    config_saved: "Changes saved ✓",
    config_password_mismatch: "Passwords do not match",
    config_name_required: "Name is required",
    // Index — Hero
    hero_badge: "✨ Online bus tickets, Ecuador",
    hero_title: "Travel safe and fast across Ecuador",
    hero_subtitle: "Book bus tickets instantly. Secure payment, guaranteed seats and digital ticket on your phone.",
    hero_search_required: "Please fill in all fields to search",
    // Index — Search
    search_origin: "Origin",
    search_origin_placeholder: "Where are you departing from?",
    search_destination: "Destination",
    search_destination_placeholder: "Where are you going?",
    search_date: "Date",
    search_btn: "Search trips",
    // Index — Benefits
    benefits_title: "Why BusEcuador?",
    benefits_subtitle: "A modern booking experience designed for passengers and cooperatives.",
    benefit_seat_title: "Visual seat selection",
    benefit_seat_desc: "Choose your exact seat on an interactive bus map.",
    benefit_pay_title: "Secure payment with validation",
    benefit_pay_desc: "Upload your transfer receipt and an agent will validate it.",
    benefit_qr_title: "Digital ticket with QR",
    benefit_qr_desc: "Keep your ticket on your phone and board showing the QR.",
    benefit_discount_title: "Legal discounts",
    benefit_discount_desc: "We automatically apply minors, senior citizens and disability discounts.",
    benefit_multi_title: "Buy for multiple passengers",
    benefit_multi_desc: "Purchase several seats in a single reservation.",
    benefit_coop_title: "Verified cooperatives",
    benefit_coop_desc: "We work with ANT-authorized operators.",
    // Index — CTA
    cta_title: "Ready for your next trip?",
    cta_subtitle: "Create your free account and start booking tickets in seconds.",
    cta_signup: "Sign up",
    cta_search: "Search trips",
    // Search
    buscar_city: "City",
    buscar_bus_type: "Bus type",
    buscar_all: "All",
    buscar_btn: "Search",
    buscar_empty_title: "No trips found",
    buscar_empty_desc: "Try adjusting the filters or change the date.",
    buscar_discount_applied: "50% discount applied",
    buscar_select_seats: "Choose seats",
    // Purchase — seats step
    compra_loading: "Loading availability...",
    compra_error: "Error",
    compra_trip_selected: "Selected trip",
    compra_price_per_seat: "Price per seat",
    compra_base_price: "base price",
    compra_available: "Available",
    compra_selected: "Selected",
    compra_occupied: "Occupied",
    compra_bus_front: "Front of bus",
    compra_floor1: "Floor 1",
    compra_floor2: "Floor 2 — Premium",
    compra_select_prompt_single: "Select 1 seat to continue",
    compra_select_prompt_multi: "seats selected",
    compra_continue: "Continue to payment →",
    // Purchase — payment step
    compra_back: "← Back to seats",
    compra_summary_title: "Purchase summary",
    compra_route: "Route",
    compra_bus_type: "Bus type",
    compra_date: "Date",
    compra_passenger: "Passenger",
    compra_seats: "Seats",
    compra_discount: "Discount",
    compra_total: "Total to pay",
    compra_voucher_title: "Payment voucher",
    compra_voucher_desc: "Complete the transfer and upload the receipt. An agent will verify the payment.",
    compra_transfer_data: "Transfer details:",
    compra_upload_label: "Upload voucher (image or PDF)",
    compra_submit: "Confirm reservation and send voucher",
    compra_submitting: "Processing reservation...",
    compra_no_discount: "No discount",
    // Purchase — confirmation step
    compra_confirmed_title: "Reservation confirmed",
    compra_confirmed_desc: "Your voucher was received. The agent will verify the payment soon.",
    compra_reservation_num: "Reservation #",
    compra_total_paid: "Total paid",
    compra_qr_hint: "Show this QR when boarding the bus",
    compra_print: "Print ticket",
    compra_go_home: "Go to home",
    // Footer
    footer_rights: "Bus ticket sales system.",
    footer_made_for: "Built for Ecuador's transport cooperatives.",
  },
} as const;

export type TKey = keyof typeof T["es"];

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem("lang") as Lang) ?? "es"
  );

  const setLang = (l: Lang) => {
    localStorage.setItem("lang", l);
    setLangState(l);
  };

  const t = (key: TKey): string => T[lang][key];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang debe usarse dentro de LanguageProvider");
  return ctx;
}
