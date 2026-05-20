import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "es" | "en";

const T = {
  es: {
    nav_search: "Buscar viajes",
    nav_reservations: "Mis reservas",
    nav_dashboard: "Panel de gestión",
    nav_login: "Ingresar",
    nav_signup: "Crear cuenta",
    nav_settings: "Configuración",
    nav_logout: "Cerrar sesión",
    nav_account: "Mi cuenta",
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
  },
  en: {
    nav_search: "Search trips",
    nav_reservations: "My reservations",
    nav_dashboard: "Management panel",
    nav_login: "Log in",
    nav_signup: "Sign up",
    nav_settings: "Settings",
    nav_logout: "Sign out",
    nav_account: "My account",
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
