import type { CitaPaciente } from "../types/citas";
import { ErrorAPI } from "./api";

// Igual que el resto del frontend: la web consulta NGINX en el puerto 8082.
// Cuando se despliegue, VITE_API_URL permitirá configurar el dominio público.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export async function consultarMisCitas(token: string): Promise<CitaPaciente[]> {
  const respuesta = await fetch(`${API_URL}/api/mis-citas`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const datos: unknown = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const mensaje =
      typeof datos === "object" && datos !== null && "mensaje" in datos &&
      typeof datos.mensaje === "string"
        ? datos.mensaje
        : `Error del servidor (${respuesta.status})`;
    throw new ErrorAPI(respuesta.status, mensaje);
  }

  if (!Array.isArray(datos)) {
    throw new Error("El servidor devolvió una respuesta de citas no válida.");
  }
  return datos as CitaPaciente[];
}
