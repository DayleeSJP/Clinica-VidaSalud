

const express = require("express");
const cors = require("cors");
const pool = require("./database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

// Cargar las variables de entorno
require("dotenv").config({
  path: path.resolve(__dirname, "../.env")
});

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("Configura un JWT_SECRET seguro en .env");
}


const app = express();
const PORT = process.env.PORT || 8080;

// Configuración
app.use(cors());
app.use(express.json());

// Ruta principal
app.get("/", (req, res) => {
  res.json({
    proyecto: "Clinica Vida y Salud",
    mensaje: "Servidor funcionando correctamente"
  });
});

// Verificar el estado del servidor
app.get("/api/health", (req, res) => {
  res.json({
    estado: "activo",
    fecha: new Date().toISOString(),
    instancia: process.env.HOSTNAME || "local"
  });
});

// Consultar especialidades
app.get("/api/especialidades", (req, res) => {
  res.json([
    { id: 1, nombre: "Medicina General" },
    { id: 2, nombre: "Pediatria" },
    { id: 3, nombre: "Cardiologia" }
  ]);
});


// Consultar médicos registrados en PostgreSQL
app.get("/api/medicos", async (req, res) => {
  try {
    const resultado = await pool.query(
      "SELECT * FROM medicos ORDER BY id"
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error("Error al consultar médicos:", error.message);

    res.status(500).json({
      error: "No se pudieron consultar los médicos"
    });
  }
});

// Consultar horarios registrados en PostgreSQL
app.get("/api/horarios", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        h.id,
        h.medico_id,
        m.nombre,
        m.apellido,
        m.especialidad,
        h.fecha,
        h.hora
      FROM horarios h
      JOIN medicos m ON h.medico_id = m.id
      ORDER BY h.fecha, h.hora, m.id
    `);

    res.json(resultado.rows);
  } catch (error) {
    console.error("Error al consultar horarios:", error.message);

    res.status(500).json({
      error: "No se pudieron consultar los horarios"
    });
  }
});



app.post("/api/citas", verificarToken, async (req, res) => {
  const { horario_id } = req.body;
  const paciente_id = req.usuario.id;

  if (
    !Number.isInteger(Number(horario_id)) ||
    Number(horario_id) <= 0
  ) {
    return res.status(400).json({
      mensaje: "Selecciona un horario válido"
    });
  }

  let cliente;

  try {
    cliente = await pool.connect();
    await cliente.query("BEGIN");

    // Comprobar que el paciente existe
    const paciente = await cliente.query(
      "SELECT id FROM pacientes WHERE id = $1",
      [paciente_id]
    );

    if (paciente.rows.length === 0) {
      await cliente.query("ROLLBACK");

      return res.status(401).json({
        mensaje: "Paciente no autorizado"
      });
    }

    // Comprobar que el horario existe
    const horario = await cliente.query(
      "SELECT id FROM horarios WHERE id = $1",
      [Number(horario_id)]
    );

    if (horario.rows.length === 0) {
      await cliente.query("ROLLBACK");

      return res.status(404).json({
        mensaje: "El horario no existe"
      });
    }

    // Registrar cita con la identidad del token
    const cita = await cliente.query(
      `INSERT INTO citas (paciente_id, horario_id)
       VALUES ($1, $2)
       RETURNING id, paciente_id, horario_id, estado`,
      [paciente_id, Number(horario_id)]
    );

    await cliente.query("COMMIT");

    res.status(201).json({
      mensaje: "Cita reservada correctamente",
      cita: cita.rows[0]
    });

  } catch (error) {
    if (cliente) {
      await cliente.query("ROLLBACK").catch(() => {});
    }

    if (error.code === "23505") {
      return res.status(409).json({
        mensaje: "Este horario ya está reservado"
      });
    }

    console.error("Error al reservar:", error.message);

    res.status(500).json({
      mensaje: "No se pudo registrar la cita"
    });

  } finally {
    if (cliente) cliente.release();
  }
});



app.get("/api/horarios-disponibles", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        h.id,
        h.medico_id,
        TO_CHAR(h.fecha, 'YYYY-MM-DD') AS fecha,
        TO_CHAR(h.hora, 'HH24:MI') AS hora
      FROM horarios h
      WHERE NOT EXISTS (
        SELECT 1
        FROM citas c
        WHERE c.horario_id = h.id
        AND c.estado = 'confirmada'
      )
      ORDER BY h.fecha, h.hora, h.medico_id
    `);

    res.json(resultado.rows);

  } catch (error) {
    console.error("Error al consultar horarios:", error.message);

    res.status(500).json({
      mensaje: "No se pudieron obtener los horarios"
    });
  }
});


app.post("/api/registro", async (req, res) => {
  try {
    const { nombre, apellido, correo, telefono, password } = req.body;

    if (
      typeof nombre !== "string" || !nombre.trim() ||
      typeof apellido !== "string" || !apellido.trim() ||
      typeof correo !== "string" || !correo.includes("@") ||
      typeof password !== "string" || password.length < 8
    ) {
      return res.status(400).json({
        mensaje: "Completa los datos y utiliza una contraseña de al menos 8 caracteres"
      });
    }

    const correoNormalizado = correo.trim().toLowerCase();

    const passwordHash = await bcrypt.hash(password, 12);

    const resultado = await pool.query(
      `INSERT INTO pacientes
       (nombre, apellido, correo, telefono, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, apellido, correo`,
      [
        nombre.trim(),
        apellido.trim(),
        correoNormalizado,
        telefono || null,
        passwordHash
      ]
    );

    res.status(201).json({
      mensaje: "Paciente registrado correctamente",
      paciente: resultado.rows[0]
    });

  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        mensaje: "Este correo ya está registrado"
      });
    }

    console.error("Error en registro:", error.message);

    res.status(500).json({
      mensaje: "No se pudo registrar al paciente"
    });
  }
});


app.post("/api/login", async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (
      typeof correo !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        mensaje: "Ingresa correo y contraseña"
      });
    }

    const resultado = await pool.query(
      `SELECT id, nombre, apellido, correo, password_hash
       FROM pacientes
       WHERE correo = $1`,
      [correo.trim().toLowerCase()]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        mensaje: "Credenciales incorrectas"
      });
    }

    const paciente = resultado.rows[0];

    const passwordValida = paciente.password_hash
      ? await bcrypt.compare(password, paciente.password_hash)
      : false;

    if (!passwordValida) {
      return res.status(401).json({
        mensaje: "Credenciales incorrectas"
      });
    }

    const token = jwt.sign(
      {
        id: paciente.id,
        rol: "paciente"
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      mensaje: "Inicio de sesión exitoso",
      token,
      paciente: {
        id: paciente.id,
        nombre: paciente.nombre,
        apellido: paciente.apellido,
        correo: paciente.correo
      }
    });

  } catch (error) {
    console.error("Error en login:", error.message);

    res.status(500).json({
      mensaje: "Error al iniciar sesión"
    });
  }
});


function verificarToken(req, res, next) {
  const autorizacion = req.headers.authorization;

  if (!autorizacion?.startsWith("Bearer ")) {
    return res.status(401).json({
      mensaje: "Debes iniciar sesión"
    });
  }

  const token = autorizacion.substring(7);

  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({
      mensaje: "Sesión inválida o expirada"
    });
  }
}

app.get("/api/perfil", verificarToken, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, nombre, apellido, correo
       FROM pacientes
       WHERE id = $1`,
      [req.usuario.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Paciente no encontrado"
      });
    }

    res.json(resultado.rows[0]);

  } catch (error) {
    console.error("Error al consultar perfil:", error.message);

    res.status(500).json({
      mensaje: "No se pudo consultar el perfil"
    });
  }
});


// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
