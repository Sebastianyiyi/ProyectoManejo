// Validación de placas vehiculares de Ecuador.
//
// Formato oficial para automóviles y buses: 3 letras + 4 números (ej. ABC-1234).
// La primera letra corresponde al código de provincia asignado por la ANT.

// Primera letra de la placa según la provincia de matriculación.
const LETRAS_PROVINCIA: Record<string, string> = {
  A: "Azuay",
  B: "Bolívar",
  U: "Cañar",
  C: "Carchi",
  H: "Chimborazo",
  X: "Cotopaxi",
  O: "El Oro",
  E: "Esmeraldas",
  W: "Galápagos",
  G: "Guayas",
  I: "Imbabura",
  L: "Loja",
  R: "Los Ríos",
  M: "Manabí",
  V: "Morona Santiago",
  N: "Napo",
  Q: "Orellana",
  S: "Pastaza",
  P: "Pichincha",
  Y: "Santa Elena",
  J: "Santo Domingo de los Tsáchilas",
  K: "Sucumbíos",
  T: "Tungurahua",
  Z: "Zamora Chinchipe",
};

/** Normaliza la placa: mayúsculas y sin espacios ni guiones. */
export function normalizarPlaca(placa: string): string {
  return placa.toUpperCase().replace(/[\s-]/g, "");
}

/**
 * Valida una placa ecuatoriana de auto/bus: 3 letras + 4 números,
 * con la primera letra correspondiente a una provincia válida.
 */
export function validarPlacaEcuador(placa: string): boolean {
  const limpia = normalizarPlaca(placa);
  if (!/^[A-Z]{3}\d{4}$/.test(limpia)) return false;
  return limpia[0] in LETRAS_PROVINCIA;
}

/** Devuelve la provincia asociada a la placa, o null si no es válida. */
export function provinciaDePlaca(placa: string): string | null {
  const limpia = normalizarPlaca(placa);
  if (!validarPlacaEcuador(limpia)) return null;
  return LETRAS_PROVINCIA[limpia[0]];
}
