/**
 * Integración segura de la agenda automática con el server.js existente.
 * Ejecutar UNA VEZ desde la raíz del proyecto: node activar-agenda.cjs
 * Mantiene registro, login, JWT, POST /api/citas y demás rutas intactas.
 */
const fs = require("node:fs");
const path = require("node:path");

const raiz = __dirname;
const rutaServer = path.join(raiz, "backend", "server.js");
const rutaAgenda = path.join(raiz, "backend", "agenda.js");
const rutaDocker = path.join(raiz, "backend", "Dockerfile");
const rutaIgnore = path.join(raiz, ".gitignore");

if (!fs.existsSync(rutaServer) || !fs.existsSync(rutaAgenda) || !fs.existsSync(rutaDocker)) {
  console.error("Falta backend/server.js, backend/agenda.js o backend/Dockerfile. Extrae el ZIP en la raíz de Clinica_VidaSalud.");
  process.exit(1);
}

const dockerOriginal = fs.readFileSync(rutaDocker, "utf8");
if (!dockerOriginal.includes("COPY server.js ./")) {
  console.error("No encuentro COPY server.js ./ en el Dockerfile. No se ha modificado nada.");
  process.exit(1);
}
const original = fs.readFileSync(rutaServer, "utf8");
const antiguo = original.replace(/\r\n/g, "\n");
if (antiguo.includes("// AGENDA AUTOMATICA VIDA SALUD")) {
  console.log("La agenda automática ya está instalada. No es necesario repetirlo.");
  process.exit(0);
}

const importPool = 'const pool = require("./database");';
const rutaInicio = 'app.get("/api/horarios-disponibles", async (req, res) => {';
const marcaReserva = '    // Registrar cita con la identidad del token';
const consultaVieja = '"SELECT id FROM horarios WHERE id = $1"';

// Validamos TODO antes de escribir para no modificar una versión incompatible.
for (const [nombre, texto] of [
  ["importación de pool", importPool],
  ["ruta de horarios", rutaInicio],
  ["marca de reserva", marcaReserva],
  ["consulta del horario", consultaVieja]
]) {
  if (!antiguo.includes(texto)) {
    console.error(`No se encontró ${nombre} en backend/server.js. No se ha modificado el archivo.`);
    process.exit(1);
  }
}

const inicio = antiguo.indexOf(rutaInicio);
const resto = antiguo.slice(inicio);
const cierre = /^\}\);[\t ]*$/m.exec(resto);
if (!cierre) {
  console.error("No se pudo identificar el final de la ruta /api/horarios-disponibles. No se ha modificado nada.");
  process.exit(1);
}
const final = inicio + cierre.index + cierre[0].length;

const nuevaRuta = `// AGENDA AUTOMATICA VIDA SALUD: 30 días, L-V, con franjas fijas.
app.get("/api/horarios-disponibles", async (req, res) => {
  try {
    // Todas las instancias pueden ejecutar esto: ON CONFLICT evita duplicados.
    await asegurarAgenda(pool);
    const resultado = await pool.query(\`
      SELECT h.id, h.medico_id,
             TO_CHAR(h.fecha, 'YYYY-MM-DD') AS fecha,
             TO_CHAR(h.hora, 'HH24:MI') AS hora
      FROM horarios h
      WHERE h.fecha >= (NOW() AT TIME ZONE 'America/Lima')::date
        AND h.fecha < ((NOW() AT TIME ZONE 'America/Lima')::date + 30)
        AND (h.fecha + h.hora) > (NOW() AT TIME ZONE 'America/Lima')
        AND NOT EXISTS (
          SELECT 1 FROM citas c
          WHERE c.horario_id = h.id AND c.estado = 'confirmada'
        )
      ORDER BY h.fecha, h.hora, h.medico_id
    \`);
    res.json(resultado.rows);
  } catch (error) {
    console.error("Error al generar o consultar la agenda:", error.message);
    res.status(500).json({ mensaje: "No se pudieron obtener los horarios" });
  }
});`;

let actualizado = antiguo.slice(0, inicio) + nuevaRuta + antiguo.slice(final);
actualizado = actualizado.replace(
  importPool,
  importPool + '\nconst { asegurarAgenda } = require("./agenda");'
);

// También protegemos el POST contra reservas pasadas o fuera de 30 días:
// el frontend no basta, porque un usuario puede llamar directamente a la API.
actualizado = actualizado.replace(
  consultaVieja,
  `\`SELECT id,
              (fecha + hora) > (NOW() AT TIME ZONE 'America/Lima') AS es_futuro,
              fecha < ((NOW() AT TIME ZONE 'America/Lima')::date + 30) AS dentro_rango
       FROM horarios WHERE id = $1\``
);
actualizado = actualizado.replace(
  marcaReserva,
  `    if (!horario.rows[0].es_futuro || !horario.rows[0].dentro_rango) {
      await cliente.query("ROLLBACK");
      return res.status(409).json({
        mensaje: "El horario ya pasó o está fuera de la agenda disponible"
      });
    }

` + marcaReserva
);

const rutaBackup = path.join(raiz, "backend", "server.js.antes-agenda.bak");
fs.writeFileSync(rutaBackup, original, "utf8");
fs.writeFileSync(rutaServer, actualizado, "utf8");
// El nuevo módulo tiene que estar dentro de la imagen de los tres backends.
let dockerActualizado = dockerOriginal;
const agregar = ["database.js", "agenda.js"].filter(
  archivo => !dockerOriginal.includes(`COPY ${archivo} ./`)
);
if (agregar.length > 0) {
  fs.writeFileSync(path.join(raiz, "backend", "Dockerfile.antes-agenda.bak"), dockerOriginal, "utf8");
  const copias = agregar.map(archivo => `COPY ${archivo} ./`).join("\n");
  dockerActualizado = dockerOriginal.replace("COPY server.js ./", `COPY server.js ./\n${copias}`);
  fs.writeFileSync(rutaDocker, dockerActualizado, "utf8");
}
if (fs.existsSync(rutaIgnore)) {
  const ignore = fs.readFileSync(rutaIgnore, "utf8");
  if (!ignore.includes("*.antes-agenda.bak")) {
    fs.appendFileSync(rutaIgnore, "\n# Copias del instalador local\n*.antes-agenda.bak\n");
  }
}
console.log("Agenda automática instalada correctamente.");
console.log("Se conservó una copia: backend/server.js.antes-agenda.bak");
console.log("Dockerfile revisado: agenda.js quedará dentro de los tres contenedores.");
console.log("Ahora reconstruye los backends Docker y actualiza la web.");
