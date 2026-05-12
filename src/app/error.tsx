'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-fondo px-4">
      <div className="bg-white rounded-2xl border border-borde p-8 max-w-lg w-full">
        <h1 className="text-lg font-bold text-error mb-2">Error en la aplicación</h1>
        <pre className="text-xs text-gris bg-fondo rounded p-3 overflow-auto mb-4 whitespace-pre-wrap">
          {error.message}
          {'\n'}
          {error.stack}
        </pre>
        <button
          onClick={reset}
          className="px-4 py-2 bg-azul text-white rounded-lg text-sm font-semibold"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
