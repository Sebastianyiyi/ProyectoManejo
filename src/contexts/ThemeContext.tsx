import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { cooperativaService } from "@/lib/cooperativaService";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Theme = "light" | "dark";

export interface ThemeColors {
  primary: string;
  secondary: string;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: ThemeColors;
  setColors: (colors: ThemeColors) => Promise<void>;
  savingColors: boolean;
}

// ─── Colores por defecto (coinciden con los defaults de la migración SQL) ─────

const DEFAULT_COLORS: ThemeColors = {
  primary: "#2563eb",
  secondary: "#64748b",
};

const CACHE_KEY = "cooperativa_colors";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyColorsToDOM(colors: ThemeColors) {
  const root = document.documentElement;
  root.style.setProperty("--primary", hexToHsl(colors.primary));
  root.style.setProperty("--secondary", hexToHsl(colors.secondary));
  // También actualiza ring y sidebar para consistencia
  root.style.setProperty("--ring", hexToHsl(colors.primary));
  // Mantén las variables propias por si las usas en otro lado
  root.style.setProperty("--color-brand-primary", colors.primary);
  root.style.setProperty("--color-brand-secondary", colors.secondary);
}

function cacheColors(colors: ThemeColors) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(colors));
}

function loadCachedColors(): ThemeColors | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ThemeColors;
    if (parsed.primary && parsed.secondary) return parsed;
    return null;
  } catch {
    return null;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) ?? "light"
  );

  // Inicializar con cache para evitar flash de colores (FOUC)
  const [colors, setColorsState] = useState<ThemeColors>(
    () => loadCachedColors() ?? DEFAULT_COLORS
  );

  const [savingColors, setSavingColors] = useState(false);

  // Modo claro/oscuro
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Aplicar colores al DOM siempre que cambien
  useEffect(() => {
    applyColorsToDOM(colors);
  }, [colors]);

  // Cargar colores desde Supabase al montar (actualiza sobre el cache)
  useEffect(() => {
    cooperativaService.get().then((coop) => {
      const loaded: ThemeColors = {
        primary: coop.color_primario,
        secondary: coop.color_secundario,
      };
      setColorsState(loaded);
      cacheColors(loaded);
    }).catch(() => {
      // Si falla, los colores del cache/default ya están aplicados
    });
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const setColors = useCallback(async (next: ThemeColors) => {
    setSavingColors(true);
    try {
      const coop = await cooperativaService.get();
      await cooperativaService.update(coop.id, {
        nombre: coop.nombre,
        ruc: coop.ruc,
        ciudad_principal: coop.ciudad_principal,
        logo_url: coop.logo_url,
        telefono: coop.telefono,
        direccion: coop.direccion,
        color_primario: next.primary,
        color_secundario: next.secondary,
      });
      setColorsState(next);
      cacheColors(next);
    } finally {
      setSavingColors(false);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors, setColors, savingColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return ctx;
}