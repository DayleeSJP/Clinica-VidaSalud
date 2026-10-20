/**
 * GET /api/mis-citas
 * Lista únicamente las citas del paciente autenticado.
 * Se conecta a la misma base de datos desde los tres servidores Docker.
 */
module.exports = function registrarMisCitas(app, pool, verificarToken) {
  app.get("/api/mis-citas", verificarToken, async (req, res) => {
    // Nunca tomamos el ID del paciente desde req.query ni req.body.
    const pacienteId = req.usuario?.id;
    if (req.usuario?.rol !== "paciente" || !Number.isInteger(pacienteId)) {
      return res.status(403).json({ mensaje: "Acceso no autorizado" });
    }

    try {
      const resultado = await pool.query(
        `SELECT
           c.id,
           c.estado,
           TO_CHAR(c.fecha_registro, 'YYYY-MM-DD HH24:MI') AS fecha_registro,
           TO_CHAR(h.fecha, 'YYYY-MM-DD') AS fecha,
           TO_CHAR(h.hora, 'HH24:MI') AS hora,
           m.id AS medico_id,
           m.nombre AS medico_nombre,
           m.apellido AS medico_apellido,
           m.especialidad
         FROM citas c
         INNER JOIN horarios h ON h.id = c.horario_id
         INNER JOIN medicos m ON m.id = h.medico_id
         WHERE c.paciente_id = $1
         ORDER BY h.fecha DESC, h.hora DESC, c.id DESC`,
        [pacienteId]
      );
      return res.json(resultado.rows);
    } catch (error) {
      console.error("Error al consultar mis citas:", error.message);
      return res.status(500).json({ mensaje: "No se pudieron consultar tus citas" });
    }
  });
};
