import { useCallback, useEffect, useMemo, useState } from "react";
import Mensaje from "../components/Mensaje";
import { ErrorAPI, mensajeError } from "../services/api";
import { consultarMisCitas } from "../services/misCitas";
import type { CitaPaciente } from "../types/citas";
import type { Paciente } from "../types/clinica";

// Evita convertir YYYY-MM-DD a UTC: mantenemos la fecha local del calendario.
function fechaBonita(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const valor = new Date(anio, mes - 1, dia);
  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric", month: "long", year: "numeric"
  }).format(valor);
}

function horaBonita(hora: string): string {
  const [horas, minutos] = hora.split(":").map(Number);
  const turno = horas < 12 ? "a. m." : "p. m.";
  return `${String(horas % 12 || 12).padStart(2, "0")}:${String(minutos).padStart(2, "0")} ${turno}`;
}

function esCitaFutura(cita: CitaPaciente): boolean {
  const [anio, mes, dia] = cita.fecha.split("-").map(Number);
  const [hora, minuto] = cita.hora.split(":").map(Number);
  return new Date(anio, mes - 1, dia, hora, minuto).getTime() >= Date.now();
}

type Props = {
  paciente: Paciente;
  token: string;
  onCerrarSesion: () => void;
  citaReciente: number | null;
};

function TarjetaCita({ cita, destacada }: { cita: CitaPaciente; destacada: boolean }) {
  return (
    <article className={`rounded-xl border bg-white p-5 shadow-sm ${destacada ? "border-emerald-300" : "border-slate-200"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-semibold text-slate-800">{cita.especialidad}</h4>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cita.estado === "confirmada" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
          {cita.estado === "confirmada" ? "Confirmada" : cita.estado}
        </span>
      </div>
      <dl className="mt-3 space-y-2 text-sm text-slate-700">
        <div><dt className="inline font-medium">Médico: </dt><dd className="inline">{cita.medico_nombre} {cita.medico_apellido}</dd></div>
        <div><dt className="inline font-medium">Fecha: </dt><dd className="inline">{fechaBonita(cita.fecha)}</dd></div>
        <div><dt className="inline font-medium">Hora: </dt><dd className="inline">{horaBonita(cita.hora)}</dd></div>
        <div><dt className="inline font-medium">N.º de reserva: </dt><dd className="inline">{cita.id}</dd></div>
      </dl>
      {destacada && <p className="mt-3 text-sm font-medium text-emerald-700">Esta es tu reserva recién confirmada.</p>}
    </article>
  );
}

export default function MisCitas({ paciente, token, onCerrarSesion, citaReciente }: Props) {
  const [citas, setCitas] = useState<CitaPaciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarCitas = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const lista = await consultarMisCitas(token);
      setCitas(lista);
    } catch (err) {
      if (err instanceof ErrorAPI && err.status === 401) {
        onCerrarSesion();
        return;
      }
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }, [token, onCerrarSesion]);

  useEffect(() => {
    void cargarCitas();
  }, [cargarCitas]);

  const proximas = useMemo(
    () => citas.filter((cita) => cita.estado === "confirmada" && esCitaFutura(cita))
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`)),
    [citas]
  );
  const anteriores = useMemo(
    () => citas.filter((cita) => cita.estado !== "confirmada" || !esCitaFutura(cita))
      .sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`)),
    [citas]
  );

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold">Bienvenido, {paciente.nombre} {paciente.apellido}</h2>
          <p className="text-sm text-slate-500">Paciente ID: {paciente.id} · {paciente.correo}</p>
        </div>
        <button type="button" onClick={onCerrarSesion} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
          Cerrar sesión
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-blue-900">Mis citas médicas</h2>
            <p className="mt-1 text-sm text-slate-500">Aquí puedes consultar tus reservas guardadas en PostgreSQL.</p>
          </div>
          <button type="button" onClick={() => void cargarCitas()} disabled={cargando} className="rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50">
            {cargando ? "Actualizando..." : "Actualizar citas"}
          </button>
        </div>

        {citaReciente !== null && !error && (
          <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            Cita confirmada correctamente. Número de reserva: {citaReciente}.
          </p>
        )}
        <Mensaje texto={error} tipo="error" />

        {cargando ? (
          <p className="mt-6 text-sm text-slate-500">Consultando tus citas...</p>
        ) : !error && citas.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <p className="font-semibold text-slate-700">Todavía no tienes citas registradas.</p>
            <p className="mt-1 text-sm text-slate-500">Entra a «Reservar cita» para escoger un horario disponible.</p>
          </div>
        ) : !error ? (
          <div className="mt-6 space-y-7">
            <section>
              <h3 className="mb-3 text-lg font-semibold">Próximas citas ({proximas.length})</h3>
              {proximas.length === 0 ? (
                <p className="text-sm text-slate-500">No tienes próximas citas confirmadas.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {proximas.map((cita) => <TarjetaCita key={cita.id} cita={cita} destacada={cita.id === citaReciente} />)}
                </div>
              )}
            </section>
            {anteriores.length > 0 && (
              <section>
                <h3 className="mb-3 text-lg font-semibold">Historial de citas ({anteriores.length})</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {anteriores.map((cita) => <TarjetaCita key={cita.id} cita={cita} destacada={cita.id === citaReciente} />)}
                </div>
              </section>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
