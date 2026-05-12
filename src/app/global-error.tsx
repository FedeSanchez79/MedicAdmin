'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ fontFamily: 'sans-serif', padding: '2rem', background: '#F9FAFB' }}>
        <h1 style={{ color: '#DC2626' }}>Error global</h1>
        <pre style={{ background: '#fff', padding: '1rem', borderRadius: '8px', fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {error.message}{'\n\n'}{error.stack}
        </pre>
        <button onClick={reset} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#1A5CFF', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Reintentar
        </button>
      </body>
    </html>
  );
}
