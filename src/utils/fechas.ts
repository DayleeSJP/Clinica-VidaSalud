import type { Horario } from "../types/clinica";

/** Devuelve YYYY-MM-DD con la fecha LOCAL del navegador (sin cambiar de zona horaria). */
export function fechaLocal(fecha: Date = new Date()): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

/** Acepta fechas de PostgreSQL expresadas como YYYY-MM-DD o ISO. */
export function fechaHorario(horario: Horario): string {
  return horario.fecha.slice(0, 10);
}

export function horarioEsFuturo(horario: Horario, ahora: Date = new Date()): boolean {
  const fecha = fechaHorario(horario);
  const hoy = fechaLocal(ahora);

  if (fecha > hoy) return true;
  if (fecha < hoy) return false;

  // PostgreSQL suele devolver HH:MM:SS; comparamos únicamente horas y minutos.
  const horaActual = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
  return horario.hora.slice(0, 5) > horaActual;
}

export function mostrarHora(hora: string): string {
  const [textoHoras = "0", textoMinutos = "00"] = hora.split(":");
  const horas24 = Number(textoHoras);
  const horas12 = horas24 % 12 || 12;
  const sufijo = horas24 < 12 ? "a. m." : "p. m.";
  return `${String(horas12).padStart(2, "0")}:${textoMinutos} ${sufijo}`;
}
