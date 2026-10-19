type Props = {
  texto: string;
  tipo?: "exito" | "error";
};

export default function Mensaje({ texto, tipo = "error" }: Props) {
  if (!texto) return null;

  return (
    <div
      role="status"
      className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
        tipo === "exito"
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {texto}
    </div>
  );
}
