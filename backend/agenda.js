// Agenda de demostración: seis turnos por día, lunes a viernes, próximos 30 días.
// Cada backend la completa cuando se necesita; PostgreSQL evita duplicados.
const HORAS_ATENCION = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
const ZONA_HORARIA = "America/Lima";
let ultimoDiaCompletado = "";
let generacionEnCurso = null;

function diaActualLima() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const dato = (tipo) => partes.find((item) => item.type === tipo).value;
  return `${dato("year")}-${dato("month")}-${dato("day")}`;
}

async function asegurarAgenda(pool) {
  const hoy = diaActualLima();
  if (ultimoDiaCompletado === hoy) return;
  if (generacionEnCurso) return generacionEnCurso;

  // La agenda se repone al llegar un día nuevo. En arranques simultáneos,
  // ON CONFLICT evita repetir franjas y conserva las citas existentes.
  generacionEnCurso = pool.query(
    `WITH dias AS (
       SELECT (NOW() AT TIME ZONE $1)::date + serie.n AS fecha
       FROM generate_series(0, 29) AS serie(n)
     )
     INSERT INTO horarios (medico_id, fecha, hora)
     SELECT medico.id, dia.fecha, turno.hora
     FROM medicos AS medico
     CROSS JOIN dias AS dia
     CROSS JOIN unnest($2::time[]) AS turno(hora)
     WHERE EXTRACT(ISODOW FROM dia.fecha) BETWEEN 1 AND 5
     ON CONFLICT (medico_id, fecha, hora) DO NOTHING`,
    [ZONA_HORARIA, HORAS_ATENCION]
  ).then(() => {
    ultimoDiaCompletado = hoy;
  }).finally(() => {
    generacionEnCurso = null;
  });

  return generacionEnCurso;
}

module.exports = { asegurarAgenda, HORAS_ATENCION, ZONA_HORARIA };
