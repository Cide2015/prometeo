'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const DEFAULT_UNSPSC = [
  '93141808', '80101601', '80101505', '81111801', '80101510',
  '81111800', '81111811', '81112000', '81111500', '81112005',
  '81112003', '81111818', '81101701', '83101901', '83101806',
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    // ¿Existe la empresa registrada? Si no → modal de registro inicial
    fetch(`${API_URL}/api/setup/status`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.initialized) setShowRegister(true);
      })
      .catch(() => {});
  }, []);

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

      {/* Modal de registro de empresa (primer arranque) */}
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
    </main>
  );
}

function RegisterModal({ onClose }: { onClose: () => void }) {
  const [nombre, setNombre] = useState('');
  const [nit, setNit] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/setup/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreComercial: nombre,
          nit,
          email,
          password,
          unspsc: DEFAULT_UNSPSC,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Error al registrar la empresa');
        setLoading(false);
        return;
      }
      setDone(true);
    } catch (err) {
      setError('Error de conexión con el servidor');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {done ? (
          <div className="text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-2xl">✅</div>
            <h3 className="mt-4 text-lg font-bold">Empresa registrada</h3>
            <p className="mt-2 text-sm text-slate-500">
              Tu empresa fue creada. Ahora inicia sesión con tu correo y contraseña.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-violet-700 py-2.5 font-semibold text-white hover:bg-violet-800"
            >
              Continuar al login
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Registra tu empresa</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Crea el registro inicial de tu compañía y el usuario administrador para comenzar con Prometeo.
            </p>
            {error && (
              <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
            )}
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nombre de la empresa</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none"
                  placeholder="MI EMPRESA S.A.S."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">NIT</label>
                <input
                  type="text"
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none"
                  placeholder="900.000.000-0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Correo del administrador</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none"
                  placeholder="admin@miempresa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-violet-700 py-2.5 font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
              >
                {loading ? 'Registrando...' : 'Registrar empresa'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
