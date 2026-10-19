import { useEffect, useState, type SubmitEvent } from "react";
import Mensaje from "../components/Mensaje";
import {
  consultarHorarios, consultarMedicos, crearCita, ErrorAPI, mensajeError
} from "../services/api";
import type { Horario, Medico, Paciente } from "../types/clinica";

type Props = {
  paciente: Paciente;
  token: string;
  onCerrarSesion: () => void;
};

const campo = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none disabled:bg-slate-100";

export default function ReservarCita({ paciente, token, onCerrarSesion }: Props) {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [medicoId, setMedicoId] = useState("");
  const [horarioId, setHorarioId] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [consultando, setConsultando] = useState(false);

  async function cargarDatos() {
    setConsultando(true);
    try {
      const [listaMedicos, listaHorarios] = await Promise.all([
        consultarMedicos(), consultarHorarios()
      ]);
      setMedicos(listaMedicos);
      setHorarios(listaHorarios);
    } catch (err) {
      setExito(false);
      setMensaje(mensajeError(err));
    } finally {
      setConsultando(false);
    }
  }

  useEffect(() => {
    void cargarDatos();
  }, []);

  const horariosFiltrados = horarios.filter(
    (horario) => horario.medico_id === Number(medicoId)
  );

  async function reservar(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!horarioId || cargando) return;

    setCargando(true);
    setMensaje("");
    setExito(false);

    try {
      const resultado = await crearCita(token, Number(horarioId));
      setExito(true);
      setMensaje(`Cita confirmada. Número de reserva: ${resultado.cita.id}`);
      setHorarioId("");
    } catch (err) {
      if (err instanceof ErrorAPI && err.status === 401) {
        onCerrarSesion();
        return;
      }
      setMensaje(mensajeError(err));
      // En el caso HTTP 409, ya no debemos dejar seleccionado el horario ocupado.
      setHorarioId("");
    } finally {
      await cargarDatos();
      setCargando(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold">Bienvenido, {paciente.nombre} {paciente.apellido}</h2>
          <p className="text-sm text-slate-500">Paciente ID: {paciente.id} · {paciente.correo}</p>
        </div>
        <button type="button" onClick={onCerrarSesion}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
          Cerrar sesión
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Médicos registrados</p>
          <p className="mt-1 text-3xl font-bold text-blue-700">{medicos.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Horarios disponibles</p>
          <p className="mt-1 text-3xl font-bold text-green-700">{horarios.length}</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Reservar cita médica</h2>
          <button type="button" onClick={() => void cargarDatos()} disabled={consultando}
            className="rounded-lg border border-blue-300 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 disabled:opacity-50">
            {consultando ? "Actualizando..." : "Actualizar horarios"}
          </button>
        </div>
        <p className="mb-5 mt-2 text-sm text-slate-500">
          Para probar la concurrencia, abre esta página con dos cuentas en navegadores distintos.
        </p>
        <form className="space-y-4" onSubmit={reservar}>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="medico">Médico</label>
            <select id="medico" className={campo} required value={medicoId}
              onChange={(e) => { setMedicoId(e.target.value); setHorarioId(""); }}>
              <option value="">Seleccionar médico</option>
              {medicos.map((medico) => (
                <option key={medico.id} value={medico.id}>
                  {medico.nombre} {medico.apellido} — {medico.especialidad}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="horario">Horario disponible</label>
            <select id="horario" className={campo} required disabled={!medicoId} value={horarioId}
              onChange={(e) => setHorarioId(e.target.value)}>
              <option value="">Seleccionar horario</option>
              {horariosFiltrados.map((horario) => (
                <option key={horario.id} value={horario.id}>
                  {horario.fecha} — {horario.hora}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={cargando || !horarioId}
            className="rounded-lg bg-blue-700 px-5 py-2.5 font-medium text-white hover:bg-blue-800 disabled:opacity-50">
            {cargando ? "Reservando..." : "Reservar cita"}
          </button>
        </form>
        <Mensaje texto={mensaje} tipo={exito ? "exito" : "error"} />
      </section>
    </div>
  );
}
