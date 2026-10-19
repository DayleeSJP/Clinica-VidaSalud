import { useState, type SubmitEvent } from "react";
import Mensaje from "../components/Mensaje";
import { mensajeError, registrarPaciente } from "../services/api";
import type { RegistroDatos } from "../types/clinica";

type Props = {
  onRegistrado: () => void;
  onIrALogin: () => void;
};

const campo = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none";

export default function Registro({ onRegistrado, onIrALogin }: Props) {
  const [form, setForm] = useState<RegistroDatos>({
    nombre: "", apellido: "", correo: "", telefono: "", password: ""
  });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  function actualizar(campo: keyof RegistroDatos, valor: string) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  }

  async function enviar(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (cargando) return;
    setCargando(true);
    setError("");

    try {
      await registrarPaciente({
        ...form,
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        correo: form.correo.trim().toLowerCase()
      });
      onRegistrado();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-semibold">Registrar paciente</h2>
      <form onSubmit={enviar} className="space-y-4">
        <div>
          <label htmlFor="registro-nombre" className="mb-1 block text-sm font-medium">Nombre</label>
          <input id="registro-nombre" className={campo} required value={form.nombre}
            onChange={(e) => actualizar("nombre", e.target.value)} />
        </div>
        <div>
          <label htmlFor="registro-apellido" className="mb-1 block text-sm font-medium">Apellido</label>
          <input id="registro-apellido" className={campo} required value={form.apellido}
            onChange={(e) => actualizar("apellido", e.target.value)} />
        </div>
        <div>
          <label htmlFor="registro-correo" className="mb-1 block text-sm font-medium">Correo electrónico</label>
          <input id="registro-correo" className={campo} required type="email" value={form.correo}
            onChange={(e) => actualizar("correo", e.target.value)} />
        </div>
        <div>
          <label htmlFor="registro-telefono" className="mb-1 block text-sm font-medium">Teléfono (opcional)</label>
          <input id="registro-telefono" className={campo} value={form.telefono}
            onChange={(e) => actualizar("telefono", e.target.value)} />
        </div>
        <div>
          <label htmlFor="registro-password" className="mb-1 block text-sm font-medium">Contraseña (mínimo 8 caracteres)</label>
          <input id="registro-password" className={campo} type="password" minLength={8} required
            value={form.password} onChange={(e) => actualizar("password", e.target.value)} />
        </div>
        <button type="submit" disabled={cargando}
          className="w-full rounded-lg bg-blue-700 px-4 py-2.5 font-medium text-white hover:bg-blue-800 disabled:opacity-50">
          {cargando ? "Registrando..." : "Crear cuenta"}
        </button>
      </form>
      <Mensaje texto={error} />
      <button type="button" onClick={onIrALogin}
        className="mt-4 text-sm font-medium text-blue-700 hover:underline">
        Ya tengo cuenta. Iniciar sesión
      </button>
    </section>
  );
}
