export type Paciente = {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
};

export type Medico = {
  id: number;
  nombre: string;
  apellido: string;
  especialidad: string;
};

export type Horario = {
  id: number;
  medico_id: number;
  fecha: string;
  hora: string;
};

export type RegistroDatos = {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  password: string;
};

export type RespuestaLogin = {
  mensaje: string;
  token: string;
  paciente: Paciente;
};

export type RespuestaCita = {
  mensaje: string;
  cita: {
    id: number;
    paciente_id: number;
    horario_id: number;
    estado: string;
  };
};
