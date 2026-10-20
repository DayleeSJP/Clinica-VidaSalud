import type { Horario } from "../types/clinica";
import { mostrarHora } from "../utils/fechas";

type Props = {
  horarios: Horario[];
  horarioSeleccionado: number | null;
  onSeleccionar: (id: number) => void;
  deshabilitado?: boolean;
  mensajeVacio: string;
};

/** La lista de botones visual. Los horarios reales los determina PostgreSQL. */
export default function SelectorHorarios({
  horarios,
  horarioSeleccionado,
  onSeleccionar,
  deshabilitado = false,
  mensajeVacio
}: Props) {
  if (horarios.length === 0) {
    return (
      <p className="rounded-xl border border-sky-100 bg-white/70 px-4 py-5 text-sm text-slate-600">
        {mensajeVacio}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="group" aria-label="Horarios disponibles">
      {horarios.map((horario) => {
        const seleccionado = horarioSeleccionado === horario.id;
        return (
          <button
            key={horario.id}
            type="button"
            aria-pressed={seleccionado}
            disabled={deshabilitado}
            onClick={() => onSeleccionar(horario.id)}
            className={`min-h-12 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              seleccionado
                ? "border-cyan-600 bg-cyan-200 text-cyan-900 ring-2 ring-cyan-500/20"
                : "border-sky-200 bg-white/70 text-sky-800 hover:border-cyan-400 hover:bg-cyan-50"
            }`}
          >
            {mostrarHora(horario.hora)}
          </button>
        );
      })}
    </div>
  );
}
