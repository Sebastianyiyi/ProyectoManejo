// Cooperativa activa: la cooperativa con la que opera el panel actualmente.
// Se guarda en localStorage para que los servicios (buses, estadísticas) la lean
// sin depender del contexto de React.

const LS_KEY = "cooperativa_activa_id";

export function getCooperativaActivaId(): number | null {
  const valor = localStorage.getItem(LS_KEY);
  return valor ? Number(valor) : null;
}

export function setCooperativaActivaId(id: number): void {
  localStorage.setItem(LS_KEY, String(id));
}
