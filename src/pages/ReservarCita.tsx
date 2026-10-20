import { useCallback, useEffect, useMemo, useState } from "react";
import Mensaje from "../components/Mensaje";
import SelectorHorarios from "../components/SelectorHorarios";
import {
  consultarHorarios,
  consultarMedicos,
  crearCita,
  ErrorAPI,
  mensajeError
} from "../services/api";
import type { Horario, Medico, Paciente } from "../types/clinica";
import { fechaHorario, fechaLocal, horarioEsFuturo } from "../utils/fechas";

type Props = {
  paciente: Paciente;
  token: string;
  onCerrarSesion: () => void;
  onReservaConfirmada?: (idCita: number) => void;
};

const campo =
  "w-full rounded-xl border border-sky-200 bg-white/80 px-4 py-3 text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-100";

export default function ReservarCita({ paciente, token, onCerrarSesion, onReservaConfirmada }: Props) {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [especialidad, setEspecialidad] = useState("");
  const [medicoId, setMedicoId] = useState("");
  const [fecha, setFecha] = useState("");
  const [horarioId, setHorarioId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [consultando, setConsultando] = useState(false);

  const cargarDatos = useCallback(async (mostrarCarga = true) => {
    if (mostrarCarga) setConsultando(true);
    try {
      const [listaMedicos, listaHorarios] = await Promise.all([
        consultarMedicos(),
        consultarHorarios()
      ]);
      setMedicos(listaMedicos);
      setHorarios(listaHorarios);
      // Si otra persona ocupó un horario, dejamos de mostrarlo como seleccionado.
      setHorarioId((anterior) =>
        anterior !== null && !listaHorarios.some((horario) => horario.id === anterior)
          ? null
          : anterior
      );
    } catch (err) {
      if (mostrarCarga) {
        setExito(false);
        setMensaje(mensajeError(err));
      }
    } finally {
      if (mostrarCarga) setConsultando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
    // Actualización periódica: no reemplaza la restricción UNIQUE en PostgreSQL.
    const intervalo = window.setInterval(() => void cargarDatos(false), 20_000);
    return () => window.clearInterval(intervalo);
  }, [cargarDatos]);

  const hoy = fechaLocal();
  const ultimoDia = new Date();
  ultimoDia.setDate(ultimoDia.getDate() + 29);
  const fechaMaxima = fechaLocal(ultimoDia);

  const especialidades = useMemo(
    () => [...new Set(medicos.map((medico) => medico.especialidad))].sort((a, b) => a.localeCompare(b, "es")),
    [medicos]
  );

  const medicosFiltrados = useMemo(
    () => medicos.filter((medico) => medico.especialidad === especialidad),
    [medicos, especialidad]
  );

  const horariosFuturos = horarios.filter((horario) => horarioEsFuturo(horario));

  const horariosDia = horariosFuturos
    .filter((horario) => horario.medico_id === Number(medicoId) && fechaHorario(horario) === fecha)
    .sort((a, b) => a.hora.localeCompare(b.hora));

  const mensajeSinHorarios = !especialidad
    ? "Primero selecciona una especialidad."
    : !medicoId
      ? "Selecciona un médico para consultar sus horarios."
      : !fecha
        ? "Selecciona una fecha en el calendario."
        : "No hay horarios disponibles para este médico en la fecha seleccionada. Prueba otro día hábil.";

  async function reservar() {
    if (horarioId === null || cargando || consultando) return;

    // Evita enviar una selección que ya no corresponde al médico/fecha actual.
    if (!horariosDia.some((horario) => horario.id === horarioId)) {
      setExito(false);
      setMensaje("Ese horario ya no está disponible. Actualiza la lista e intenta de nuevo.");
      setHorarioId(null);
      await cargarDatos();
      return;
    }

    setCargando(true);
    setMensaje("");
    setExito(false);

    try {
      const resultado = await crearCita(token, horarioId);
      setExito(true);
      setMensaje(`Cita confirmada correctamente. Número de reserva: ${resultado.cita.id}`);
      setHorarioId(null);
      onReservaConfirmada?.(resultado.cita.id);
    } catch (err) {
      if (err instanceof ErrorAPI && err.status === 401) {
        onCerrarSesion();
        return;
      }
      setMensaje(
        err instanceof ErrorAPI && err.status === 409
          ? "Ese horario acaba de ser reservado por otro paciente. Elige otro horario."
          : mensajeError(err)
      );
      setHorarioId(null);
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
        <button
          type="button"
          onClick={onCerrarSesion}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Cerrar sesión
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Médicos registrados</p>
          <p className="mt-1 text-3xl font-bold text-blue-700">{medicos.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Horarios futuros disponibles</p>
          <p className="mt-1 text-3xl font-bold text-emerald-700">{horariosFuturos.length}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-sky-50 via-cyan-50 to-teal-50 p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-sky-900">Elige tu atención</h2>
            <p className="mt-1 text-sm text-sky-700">
              Agenda automática: lunes a viernes, de 9:00 a 11:00 a. m. y de 2:00 a 4:00 p. m. (próximos 30 días).
            </p>
          </div>
          <button
            type="button"
            disabled={consultando || cargando}
            onClick={() => void cargarDatos()}
            className="rounded-lg border border-sky-300 bg-white/70 px-3 py-2 text-sm font-medium text-sky-800 hover:bg-white disabled:opacity-50"
          >
            {consultando ? "Actualizando..." : "Actualizar horarios"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="especialidad" className="mb-1.5 block text-sm font-semibold text-sky-900">
              Especialidad
            </label>
            <select
              id="especialidad"
              className={campo}
              value={especialidad}
              onChange={(e) => {
                setEspecialidad(e.target.value);
                setMedicoId("");
                setHorarioId(null);
                setMensaje("");
              }}
            >
              <option value="">Seleccionar especialidad</option>
              {especialidades.map((opcion) => (
                <option key={opcion} value={opcion}>{opcion}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="medico" className="mb-1.5 block text-sm font-semibold text-sky-900">
              Médico
            </label>
            <select
              id="medico"
              className={campo}
              disabled={!especialidad}
              value={medicoId}
              onChange={(e) => {
                setMedicoId(e.target.value);
                setHorarioId(null);
                setMensaje("");
              }}
            >
              <option value="">Seleccionar médico</option>
              {medicosFiltrados.map((medico) => (
                <option key={medico.id} value={medico.id}>
                  {medico.nombre} {medico.apellido}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fecha" className="mb-1.5 block text-sm font-semibold text-sky-900">
              Fecha
            </label>
            <input
              id="fecha"
              type="date"
              min={hoy}
              max={fechaMaxima}
              value={fecha}
              onChange={(e) => {
                setFecha(e.target.value);
                setHorarioId(null);
                setMensaje("");
              }}
              className={campo}
            />
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold text-sky-900">Horarios disponibles</p>
          <SelectorHorarios
            horarios={horariosDia}
            horarioSeleccionado={horarioId}
            onSeleccionar={(id) => {
              setHorarioId(id);
              setMensaje("");
            }}
            deshabilitado={cargando || consultando}
            mensajeVacio={mensajeSinHorarios}
          />
          <p className="mt-2 text-xs text-slate-500">
            Disponibilidad consultada desde PostgreSQL. Se actualiza automáticamente cada 20 segundos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void reservar()}
          disabled={horarioId === null || cargando || consultando}
          className="mt-6 rounded-xl bg-sky-700 px-6 py-3 font-semibold text-white shadow-sm hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cargando ? "Reservando..." : "Reservar cita →"}
        </button>

        <Mensaje texto={mensaje} tipo={exito ? "exito" : "error"} />
      </section>
    </div>
  );
}
