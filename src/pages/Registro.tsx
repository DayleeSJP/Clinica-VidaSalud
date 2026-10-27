import { useState, type FormEvent } from "react";
import Mensaje from "../components/Mensaje";
import { mensajeError, registrarPaciente } from "../services/api";
import type { RegistroDatos } from "../types/clinica";

type Props = {
  onRegistrado: () => void;
  onIrALogin: () => void;
};

const ESTILO_CAMPO =
  "w-full rounded-2xl border border-slate-200/90 bg-white/95 py-3 pl-11 pr-11 text-sm font-medium text-slate-800 placeholder:text-slate-400 shadow-sm transition duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:opacity-50";

const ICONO_CLASE = "pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-600";

function LogoClinica() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      {/* Insignia / Badge Superior */}
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-300 bg-sky-100/90 px-3.5 py-1 text-xs font-bold text-sky-800 shadow-sm">
        <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
        Portal del Paciente
      </div>

      {/* Isotipo + Nombre */}
      <div className="flex items-center gap-3.5">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-sky-500 to-cyan-400 p-3 shadow-lg shadow-sky-500/40 ring-4 ring-white">
          <svg viewBox="0 0 24 24" className="h-full w-full text-white drop-shadow" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2v20M2 12h20" className="opacity-30" strokeWidth="4" />
            <path d="M19 10h-4a1 1 0 0 1-1-1V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4a1 1 0 0 1-1 1H3a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4a1 1 0 0 1 1 1v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-4a1 1 0 0 1 1-1h4a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2Z" fill="currentColor" fillOpacity="0.25" />
            <path d="M7 12h2l1.5-3 3 6 1.5-3h2" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="text-left">
          <span className="block text-xs font-bold tracking-widest text-slate-400 uppercase">Clínica</span>
          <h1 className="bg-gradient-to-r from-blue-700 via-sky-600 to-cyan-500 bg-clip-text text-2xl font-black tracking-tight text-transparent drop-shadow-sm">
            Vida y Salud
          </h1>
        </div>
      </div>
    </div>
  );
}

function FondoDecorativo() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {/* Fondo estático cian/celeste */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-sky-400 to-blue-600" />

      {/* SVG con cruces y electrocardiograma estático */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none">
        <g fill="white" opacity="0.22">
          <path d="M120 100 h30 v-30 h30 v30 h30 v30 h-30 v30 h-30 v-30 h-30 Z" />
          <path d="M1250 140 h40 v-40 h40 v40 h40 v40 h-40 v40 h-40 v-40 h-40 Z" />
          <path d="M80 720 h45 v-45 h45 v45 h45 v45 h-45 v45 h-45 v-45 h-45 Z" />
          <path d="M1280 680 h50 v-50 h50 v50 h50 v50 h-50 v50 h-50 v-50 h-50 Z" />
          <path d="M550 80 h25 v-25 h25 v25 h25 v25 h-25 v25 h-25 v-25 h-25 Z" />
          <path d="M980 600 h30 v-30 h30 v30 h30 v30 h-30 v30 h-30 v-30 h-30 Z" />
        </g>

        <g stroke="white" strokeWidth="2" opacity="0.35" fill="none">
          <path d="M380 180 h20 v-20 h20 v20 h20 v20 h-20 v20 h-20 v-20 h-20 Z" />
          <path d="M1080 200 h25 v-25 h25 v25 h25 v25 h-25 v25 h-25 v-25 h-25 Z" />
          <path d="M220 500 h18 v-18 h18 v18 h18 v18 h-18 v18 h-18 v-18 h-18 Z" />
          <path d="M1150 800 h22 v-22 h22 v22 h22 v22 h-22 v22 h-22 v-22 h-22 Z" />
        </g>

        <path 
          d="M0 450 L300 450 L320 420 L335 480 L355 350 L380 540 L400 420 L420 450 L600 450 L615 430 L630 470 L645 450 L800 450 L820 320 L845 560 L870 380 L890 470 L910 450 L1200 450 L1215 420 L1230 480 L1245 450 L1440 450" 
          stroke="white" 
          strokeWidth="3.5" 
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />
      </svg>

      {/* Resplandores fijos */}
      <div className="absolute left-[15%] top-[20%] h-80 w-80 rounded-full bg-cyan-200/35 blur-[100px]" />
      <div className="absolute right-[10%] bottom-[15%] h-96 w-96 rounded-full bg-white/25 blur-[120px]" />
      <div className="absolute left-[55%] top-[10%] h-72 w-72 rounded-full bg-sky-200/35 blur-[90px]" />

      {/* Puntos de luz fijos */}
      <span className="absolute left-[24%] top-[38%] h-3 w-3 rounded-full bg-white opacity-90 shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
      <span className="absolute right-[28%] top-[34%] h-2.5 w-2.5 rounded-full bg-white opacity-80 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
      <span className="absolute left-[12%] bottom-[25%] h-2 w-2 rounded-full bg-cyan-100 opacity-80" />
      <span className="absolute right-[10%] top-[18%] h-3 w-3 rounded-full bg-white opacity-90" />
    </div>
  );
}

export default function Registro({ onRegistrado, onIrALogin }: Props) {
  const [form, setForm] = useState<RegistroDatos>({
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
    password: "",
  });
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  function actualizar(campo: keyof RegistroDatos, valor: string) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  }

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (cargando) return;
    setCargando(true);
    setError("");

    try {
      await registrarPaciente({
        ...form,
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        correo: form.correo.trim().toLowerCase(),
      });
      onRegistrado();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="relative flex flex-1 w-full min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <FondoDecorativo />

      {/* Tarjeta Glassmorphism de Registro */}
      <section className="relative z-10 w-full max-w-lg rounded-3xl border border-white/95 bg-white/95 p-7 shadow-[0_25px_60px_-15px_rgba(3,105,161,0.35)] ring-1 ring-slate-900/10 backdrop-blur-xl sm:p-9">
        <LogoClinica />

        <div className="mt-6 text-center">
          <h2 className="text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">Crear Cuenta</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Regístrate para gestionar tus citas médicas</p>
        </div>

        <form onSubmit={enviar} className="mt-6 space-y-3.5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {/* Nombre */}
            <div>
              <label htmlFor="registro-nombre" className="sr-only">Nombre</label>
              <div className="relative">
                <svg className={ICONO_CLASE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="registro-nombre"
                  className={ESTILO_CAMPO}
                  required
                  disabled={cargando}
                  placeholder="Nombre"
                  value={form.nombre}
                  onChange={(e) => actualizar("nombre", e.target.value)}
                />
              </div>
            </div>

            {/* Apellido */}
            <div>
              <label htmlFor="registro-apellido" className="sr-only">Apellido</label>
              <div className="relative">
                <svg className={ICONO_CLASE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="registro-apellido"
                  className={ESTILO_CAMPO}
                  required
                  disabled={cargando}
                  placeholder="Apellido"
                  value={form.apellido}
                  onChange={(e) => actualizar("apellido", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Correo Electrónico */}
          <div>
            <label htmlFor="registro-correo" className="sr-only">Correo electrónico</label>
            <div className="relative">
              <svg className={ICONO_CLASE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              <input
                id="registro-correo"
                className={ESTILO_CAMPO}
                required
                type="email"
                disabled={cargando}
                placeholder="Correo electrónico"
                value={form.correo}
                onChange={(e) => actualizar("correo", e.target.value)}
              />
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="registro-telefono" className="sr-only">Teléfono</label>
            <div className="relative">
              <svg className={ICONO_CLASE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <input
                id="registro-telefono"
                className={ESTILO_CAMPO}
                disabled={cargando}
                placeholder="Teléfono (opcional)"
                value={form.telefono}
                onChange={(e) => actualizar("telefono", e.target.value)}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label htmlFor="registro-password" className="sr-only">Contraseña</label>
            <div className="relative">
              <svg className={ICONO_CLASE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              <input
                id="registro-password"
                className={ESTILO_CAMPO}
                type={verPassword ? "text" : "password"}
                minLength={8}
                required
                disabled={cargando}
                placeholder="Contraseña (mínimo 8 caracteres)"
                value={form.password}
                onChange={(e) => actualizar("password", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setVerPassword((v) => !v)}
                aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600 focus:outline-none"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {verPassword ? (
                    <>
                      <path d="M3 3l18 18" />
                      <path d="M10.6 6.1A10.5 10.5 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.2 3.9M6.6 6.6A17 17 0 0 0 2.5 12S6 18 12 18c1.6 0 3-.4 4.3-1" />
                    </>
                  ) : (
                    <>
                      <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Botón de Enviar */}
          <button
            type="submit"
            disabled={cargando}
            aria-busy={cargando}
            className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/35 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/45 active:translate-y-0 disabled:translate-y-0 disabled:opacity-60"
          >
            {cargando ? (
              <>
                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                Crear cuenta
                <svg className="h-4 w-4 transition duration-200 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4">
            <Mensaje texto={error} />
          </div>
        )}

        <p className="mt-6 text-center text-sm font-medium text-slate-500">
          ¿Ya tienes una cuenta?{" "}
          <button type="button" onClick={onIrALogin} className="font-bold text-blue-600 transition hover:text-blue-800 hover:underline">
            Iniciar sesión
          </button>
        </p>
      </section>
    </div>
  );
}