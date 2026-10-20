/**
 * Instalador conservador de GET /api/mis-citas.
 * Se ejecuta desde la carpeta raíz del proyecto: node activar-mis-citas.cjs
 * No modifica reservas, usuarios, horarios ni datos de PostgreSQL.
 * Mantiene intacta la agenda automática.
 */
const fs = require("node:fs");
const path = require("node:path");

const raiz = __dirname;
const servidor = path.join(raiz, "backend", "server.js");
const modulo = path.join(raiz, "backend", "mis-citas.js");
const docker = path.join(raiz, "backend", "Dockerfile");
const ignore = path.join(raiz, ".gitignore");

for (const ruta of [servidor, modulo, docker]) {
  if (!fs.existsSync(ruta)) {
    console.error(`Falta el archivo ${path.relative(raiz, ruta)}. Extrae el ZIP en la carpeta raíz.`);
    process.exit(1);
  }
}

const codigo = fs.readFileSync(servidor, "utf8");
const dockerfile = fs.readFileSync(docker, "utf8");
const instruccion = 'require("./mis-citas")(app, pool, verificarToken);';
const faltaRuta = !codigo.includes(instruccion);
const faltaDocker = !dockerfile.includes("COPY mis-citas.js ./");

// Validar antes de tocar ningún archivo.
if (faltaRuta) {
  if (!/\bapp\s*=\s*express\s*\(\s*\)/.test(codigo) ||
      !/\b(?:const|let|var)\s+pool\s*=\s*require\s*\(\s*["']\.\/database["']\s*\)/.test(codigo) ||
      !/\bfunction\s+verificarToken\s*\(/.test(codigo) ||
      !/\bapp\.listen\s*\(/.test(codigo)) {
    console.error("El código del backend no tiene la estructura esperada. No se modificó ningún archivo.");
    process.exit(1);
  }
  if (/app\.get\s*\(\s*["']\/api\/mis-citas["']/.test(codigo)) {
    console.error("Ya existe una ruta /api/mis-citas en server.js. No se modificó el archivo.");
    process.exit(1);
  }
}
if (faltaDocker && !dockerfile.includes("COPY server.js ./")) {
  console.error("No encuentro 'COPY server.js ./' en backend/Dockerfile. No se modificó nada.");
  process.exit(1);
}

if (faltaRuta) {
  // Registrar antes de app.listen, después de definir verificarToken.
  const posicion = codigo.search(/\bapp\.listen\s*\(/);
  const actualizado = codigo.slice(0, posicion) +
    `// MIS CITAS: consulta protegida con JWT e identidad del paciente.\n${instruccion}\n\n` +
    codigo.slice(posicion);
  fs.writeFileSync(servidor + ".antes-mis-citas.bak", codigo, "utf8");
  fs.writeFileSync(servidor, actualizado, "utf8");
  console.log("Ruta /api/mis-citas registrada en backend/server.js.");
} else {
  console.log("La ruta /api/mis-citas ya estaba instalada.");
}

if (faltaDocker) {
  const actualizado = dockerfile.replace(
    "COPY server.js ./",
    "COPY server.js ./\nCOPY mis-citas.js ./"
  );
  fs.writeFileSync(docker + ".antes-mis-citas.bak", dockerfile, "utf8");
  fs.writeFileSync(docker, actualizado, "utf8");
  console.log("Dockerfile actualizado para copiar mis-citas.js a los tres backends.");
} else {
  console.log("Dockerfile ya incluye mis-citas.js.");
}

if (fs.existsSync(ignore)) {
  const actual = fs.readFileSync(ignore, "utf8");
  if (!actual.includes("*.antes-mis-citas.bak")) {
    fs.appendFileSync(ignore, "\n# Respaldo local del instalador de Mis citas\n*.antes-mis-citas.bak\n", "utf8");
  }
}
console.log("Instalación finalizada. Reconstruye los backends Docker para activar la ruta.");
