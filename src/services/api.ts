import type {
  Horario,
  Medico,
  Paciente,
  RegistroDatos,
  RespuestaCita,
  RespuestaLogin
} from "../types/clinica";

// Durante el desarrollo usamos Express en localhost:8080.
// Más adelante podremos cambiarlo por NGINX (8082) con VITE_API_URL.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";


export class ErrorAPI extends Error {
  public status: number;

  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.name = "ErrorAPI";
    this.status = status;
  }
}


async function solicitar<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: {
      "Content-Type": "application/json",
      ...opciones.headers
    }
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new ErrorAPI(
      respuesta.status,
      datos.mensaje || `Error del servidor (${respuesta.status})`
    );
  }

  return datos as T;
}

export function mensajeError(error: unknown): string {
  if (error instanceof ErrorAPI) return error.message;
  if (error instanceof TypeError) return "No se pudo conectar con el servidor Express.";
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export function registrarPaciente(datos: RegistroDatos) {
  return solicitar<{ mensaje: string; paciente: Paciente }>("/api/registro", {
    method: "POST",
    body: JSON.stringify(datos)
  });
}

export function iniciarSesion(correo: string, password: string) {
  return solicitar<RespuestaLogin>("/api/login", {
    method: "POST",
    body: JSON.stringify({ correo, password })
  });
}

export function consultarPerfil(token: string) {
  return solicitar<Paciente>("/api/perfil", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function consultarMedicos() {
  return solicitar<Medico[]>("/api/medicos");
}

export function consultarHorarios() {
  return solicitar<Horario[]>("/api/horarios-disponibles");
}

export function crearCita(token: string, horarioId: number) {
  return solicitar<RespuestaCita>("/api/citas", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ horario_id: horarioId })
  });
}
