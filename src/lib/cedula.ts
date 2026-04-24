export function validarCedulaEcuador(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false;
  const provincia = parseInt(cedula.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) return false;
  const tercerDigito = parseInt(cedula[2], 10);
  if (tercerDigito >= 6) return false;

  const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let val = parseInt(cedula[i], 10) * coef[i];
    if (val >= 10) val -= 9;
    suma += val;
  }
  const verificador = (10 - (suma % 10)) % 10;
  return verificador === parseInt(cedula[9], 10);
}

export function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date();
  const fn = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - fn.getFullYear();
  const m = hoy.getMonth() - fn.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fn.getDate())) edad--;
  return edad;
}

export type TipoDescuento = 'ninguno' | 'menor' | 'tercera_edad' | 'discapacidad';

export const PORCENTAJES_DESCUENTO: Record<TipoDescuento, number> = {
  ninguno: 0,
  menor: 0.5,
  tercera_edad: 0.5,
  discapacidad: 0.5,
};

export const ETIQUETAS_DESCUENTO: Record<TipoDescuento, string> = {
  ninguno: 'Sin descuento',
  menor: 'Menor de edad (50%)',
  tercera_edad: 'Tercera edad (50%)',
  discapacidad: 'Discapacidad (50%)',
};
