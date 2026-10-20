import { useEffect, useState } from "react";
import IniciarSesion from "./pages/IniciarSesion";
import Registro from "./pages/Registro";
import ReservarCita from "./pages/ReservarCita";
import MisCitas from "./pages/MisCitas";
import { consultarPerfil } from "./services/api";
import type { Paciente, RespuestaLogin } from "./types/clinica";

type Vista = "login" | "registro";
type VistaPaciente = "reservar" | "mis-citas";

export default function App() {
  const [vista, setVista] = useState<Vista>("login");
  const [token, setToken] = useState(() => sessionStorage.getItem("clinica_token") || "");
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [comprobandoSesion, setComprobandoSesion] = useState(Boolean(token));
  const [aviso, setAviso] = useState("");
  const [vistaPaciente, setVistaPaciente] = useState<VistaPaciente>("reservar");
  const [citaReciente, setCitaReciente] = useState<number | null>(null);

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
    setVistaPaciente("reservar");
    setCitaReciente(null);
  }

  function cerrarSesion() {
    sessionStorage.removeItem("clinica_token");
    setToken("");
    setPaciente(null);
    setVista("login");
    setAviso("");
    setVistaPaciente("reservar");
    setCitaReciente(null);
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
          <div className="space-y-5">
            <nav aria-label="Secciones del paciente" className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <button
                type="button"
                onClick={() => { setVistaPaciente("reservar"); setCitaReciente(null); }}
                aria-current={vistaPaciente === "reservar" ? "page" : undefined}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${vistaPaciente === "reservar" ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-blue-50"}`}
              >
                Reservar cita
              </button>
              <button
                type="button"
                onClick={() => { setVistaPaciente("mis-citas"); setCitaReciente(null); }}
                aria-current={vistaPaciente === "mis-citas" ? "page" : undefined}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${vistaPaciente === "mis-citas" ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-blue-50"}`}
              >
                Mis citas
              </button>
            </nav>
            {vistaPaciente === "reservar" ? (
              <ReservarCita
                paciente={paciente}
                token={token}
                onCerrarSesion={cerrarSesion}
                onReservaConfirmada={(idCita) => {
                  setCitaReciente(idCita);
                  setVistaPaciente("mis-citas");
                }}
              />
            ) : (
              <MisCitas
                paciente={paciente}
                token={token}
                onCerrarSesion={cerrarSesion}
                citaReciente={citaReciente}
              />
            )}
          </div>
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
