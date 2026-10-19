import { useState, type SubmitEvent } from "react";
import Mensaje from "../components/Mensaje";
import { iniciarSesion, mensajeError } from "../services/api";
import type { RespuestaLogin } from "../types/clinica";

type Props = {
  onLogin: (respuesta: RespuestaLogin) => void;
  onIrARegistro: () => void;
  aviso?: string;
};

const campo = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none";

export default function IniciarSesion({ onLogin, onIrARegistro, aviso }: Props) {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (cargando) return;
    setCargando(true);
    setError("");

    try {
      const respuesta = await iniciarSesion(correo.trim(), password);
      onLogin(respuesta);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-semibold">Iniciar sesión</h2>
      {aviso && <Mensaje texto={aviso} tipo="exito" />}

      <form onSubmit={enviar} className="space-y-4">
        <div>
          <label htmlFor="login-correo" className="mb-1 block text-sm font-medium">Correo electrónico</label>
          <input id="login-correo" className={campo} type="email" required
            value={correo} onChange={(e) => setCorreo(e.target.value)} />
        </div>
        <div>
          <label htmlFor="login-password" className="mb-1 block text-sm font-medium">Contraseña</label>
          <input id="login-password" className={campo} type="password" required
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={cargando}
          className="w-full rounded-lg bg-blue-700 px-4 py-2.5 font-medium text-white hover:bg-blue-800 disabled:opacity-50">
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <Mensaje texto={error} />
      <button type="button" onClick={onIrARegistro}
        className="mt-4 text-sm font-medium text-blue-700 hover:underline">
        ¿No tienes cuenta? Regístrate
      </button>
    </section>
  );
}
