'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Credenciales inválidas');
        setLoading(false);
        return;
      }
      // Guardar token y tenantId (en producción: cookie httpOnly vía backend)
      localStorage.setItem('prometeo_token', data.accessToken);
      localStorage.setItem('prometeo_user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err) {
      setError('Error de conexión con el servidor');
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-2 text-xl font-bold text-violet-700">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-100">🔥</span>
          Prometeo
        </div>
        <h1 className="mt-6 text-2xl font-bold">Inicia sesión</h1>
        <p className="mt-1 text-sm text-slate-500">Accede a tu panel de oportunidades SECOP II / TVEC.</p>
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="admin@cidesas.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-700 py-2.5 font-semibold text-white transition hover:bg-violet-800 disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Aún no tienes cuenta?{' '}
          <Link href="/" className="font-medium text-violet-700 hover:underline">
            Conoce Prometeo
          </Link>
        </p>
      </div>
    </main>
  );
}
