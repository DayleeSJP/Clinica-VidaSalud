import { useEffect, useState } from "react";
import IniciarSesion from "./pages/IniciarSesion";
import Registro from "./pages/Registro";
import ReservarCita from "./pages/ReservarCita";
import MisCitas from "./pages/MisCitas";
import { consultarPerfil } from "./services/api";
import type { Paciente, RespuestaLogin } from "./types/clinica";

type Vista = "login" | "registro";
type VistaPaciente = "reservar" | "mis-citas";

function NavbarSuperior() {
  return (
    <header className="sticky top-0 z-50 border-b border-blue-600/30 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 px-5 py-3.5 text-white shadow-md backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Identidad de la Clínica */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 p-2 shadow-inner ring-1 ring-white/20">
            <svg viewBox="0 0 24 24" className="h-full w-full text-cyan-300" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2v20M2 12h20" className="opacity-40" strokeWidth="3" />
              <path d="M19 10h-4a1 1 0 0 1-1-1V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4a1 1 0 0 1-1 1H3a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4a1 1 0 0 1 1 1v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-4a1 1 0 0 1 1-1h4a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2Z" fill="currentColor" fillOpacity="0.2" />
              <path d="M7 12h2l1.5-3 3 6 1.5-3h2" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
              Clínica <span className="text-cyan-300">Vida y Salud</span>
            </h1>
          </div>
        </div>

        {/* Badge de Estado del Sistema */}
        <div className="hidden items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-sm sm:inline-flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Sistema En Línea
        </div>
      </div>
    </header>
  );
}

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
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-800">
      {/* Navbar Superior */}
      <NavbarSuperior />

      {/* Contenedor Principal Adaptativo de Ancho Completo */}
      <main className="flex w-full flex-1 flex-col">
        {comprobandoSesion ? (
          <div className="flex flex-1 items-center justify-center py-10">
            <p className="font-medium text-slate-600">Verificando sesión...</p>
          </div>
        ) : paciente && token ? (
          <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-8">
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
          <div className="flex w-full flex-1">
            <Registro
              onRegistrado={() => {
                setAviso("Cuenta creada correctamente. Ahora inicia sesión.");
                setVista("login");
              }}
              onIrALogin={() => setVista("login")}
            />
          </div>
        ) : (
          <div className="flex w-full flex-1">
            <IniciarSesion
              onLogin={completarLogin}
              onIrARegistro={() => { setVista("registro"); setAviso(""); }}
              aviso={aviso}
            />
          </div>
        )}
      </main>
    </div>
  );
}