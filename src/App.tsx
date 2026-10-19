import { useEffect, useState } from "react";
import IniciarSesion from "./pages/IniciarSesion";
import Registro from "./pages/Registro";
import ReservarCita from "./pages/ReservarCita";
import { consultarPerfil } from "./services/api";
import type { Paciente, RespuestaLogin } from "./types/clinica";

type Vista = "login" | "registro";

export default function App() {
  const [vista, setVista] = useState<Vista>("login");
  const [token, setToken] = useState(() => sessionStorage.getItem("clinica_token") || "");
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [comprobandoSesion, setComprobandoSesion] = useState(Boolean(token));
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    if (!token) {
      setComprobandoSesion(false);
      return;
    }

    let cancelado = false;
    setComprobandoSesion(true);

    consultarPerfil(token)
      .then((datos) => {
        if (!cancelado) setPaciente(datos);
      })
      .catch(() => {
        if (cancelado) return;
        sessionStorage.removeItem("clinica_token");
        setToken("");
        setPaciente(null);
        setVista("login");
      })
      .finally(() => {
        if (!cancelado) setComprobandoSesion(false);
      });

    return () => { cancelado = true; };
  }, [token]);

  function completarLogin(respuesta: RespuestaLogin) {
    sessionStorage.setItem("clinica_token", respuesta.token);
    setToken(respuesta.token);
    setPaciente(respuesta.paciente);
    setAviso("");
  }

  function cerrarSesion() {
    sessionStorage.removeItem("clinica_token");
    setToken("");
    setPaciente(null);
    setVista("login");
    setAviso("");
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="bg-blue-700 px-5 py-5 text-white">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold">Clínica Vida y Salud</h1>
          <p className="text-sm text-blue-100">Sistema de gestión de citas médicas</p>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        {comprobandoSesion ? (
          <p className="text-center text-slate-600">Verificando sesión...</p>
        ) : paciente && token ? (
          <ReservarCita paciente={paciente} token={token} onCerrarSesion={cerrarSesion} />
        ) : vista === "registro" ? (
          <Registro
            onRegistrado={() => {
              setAviso("Cuenta creada correctamente. Ahora inicia sesión.");
              setVista("login");
            }}
            onIrALogin={() => setVista("login")}
          />
        ) : (
          <IniciarSesion
            onLogin={completarLogin}
            onIrARegistro={() => { setVista("registro"); setAviso(""); }}
            aviso={aviso}
          />
        )}
      </main>
    </div>
  );
}
