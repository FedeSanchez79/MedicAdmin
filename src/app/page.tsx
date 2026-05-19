'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type View = 'login' | 'forgot' | 'sent';

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = e.currentTarget;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      if (!res.ok) {
        const data = await res.json();
        setForgotError(data.error || 'Error al enviar el email');
        return;
      }

      setView('sent');
    } catch {
      setForgotError('Error de conexión. Intentá de nuevo.');
    } finally {
      setForgotLoading(false);
    }
  }

  const cardHeader = (
    <div className="flex flex-col items-center mb-8">
      <div className="w-12 h-12 bg-azul-suave rounded-xl flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-azul" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-texto">MedicAdmin</h1>
      <p className="text-sm text-gris mt-1">Panel de administración</p>
    </div>
  );

  if (view === 'sent') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fondo px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-md border border-borde p-8">
            {cardHeader}
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-texto">
                Si el email ingresado está registrado, recibirás un link para restablecer tu contraseña.
              </p>
              <p className="text-xs text-gris">El link expira en 1 hora.</p>
              <button
                onClick={() => { setView('login'); setForgotEmail(''); }}
                className="text-sm text-azul hover:underline mt-2"
              >
                Volver al login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'forgot') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fondo px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-md border border-borde p-8">
            {cardHeader}

            <form onSubmit={handleForgot} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="forgot-email" className="text-sm font-medium text-texto">
                  Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-borde bg-white text-texto text-sm
                             focus:outline-none focus:ring-2 focus:ring-azul focus:border-transparent
                             placeholder:text-gris-claro transition"
                  placeholder="Ingresá tu email"
                />
              </div>

              {forgotError && (
                <p className="text-sm text-error bg-error-bg rounded-lg px-3 py-2">{forgotError}</p>
              )}

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full py-2.5 bg-azul hover:bg-azul-hover text-white font-semibold rounded-lg
                           transition disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-1"
              >
                {forgotLoading ? 'Enviando...' : 'Enviar link de recuperación'}
              </button>

              <button
                type="button"
                onClick={() => { setView('login'); setForgotError(''); }}
                className="text-sm text-gris hover:text-texto text-center transition"
              >
                Volver al login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-fondo px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-md border border-borde p-8">
          {cardHeader}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-sm font-medium text-texto">
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                className="w-full px-3 py-2.5 rounded-lg border border-borde bg-white text-texto text-sm
                           focus:outline-none focus:ring-2 focus:ring-azul focus:border-transparent
                           placeholder:text-gris-claro transition"
                placeholder="Ingresá tu usuario"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-texto">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg border border-borde bg-white text-texto text-sm
                             focus:outline-none focus:ring-2 focus:ring-azul focus:border-transparent
                             placeholder:text-gris-claro transition"
                  placeholder="Ingresá tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gris hover:text-texto transition"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => { setView('forgot'); setError(''); }}
                className="self-end text-xs text-azul hover:underline mt-0.5"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {error && (
              <p className="text-sm text-error bg-error-bg rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-azul hover:bg-azul-hover text-white font-semibold rounded-lg
                         transition disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-1"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
