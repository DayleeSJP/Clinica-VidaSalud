
const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

// Leer la configuración local desde la raíz del proyecto
dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

const pool = new Pool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 5433),
  user: "clinica_user",
  password: process.env.CLINICA_DB_PASSWORD,
  database: "clinica_db"
});

module.exports = pool;
