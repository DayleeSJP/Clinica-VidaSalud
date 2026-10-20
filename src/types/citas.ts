/** Información que devuelve GET /api/mis-citas para el paciente autenticado. */
export type CitaPaciente = {
  id: number;
  estado: string;
  fecha_registro: string;
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:MM
  medico_id: number;
  medico_nombre: string;
  medico_apellido: string;
  especialidad: string;
};
