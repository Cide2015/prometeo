'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const SIDEBAR = [
  { href: '/dashboard', label: 'Inventario de Oportunidades', icon: '📋' },
  { href: '/dashboard/invitaciones', label: 'Invitaciones RFI/RFP', icon: '✉️' },
  { href: '/dashboard/analisis', label: 'Análisis IA (Go/No-Go)', icon: '🧠' },
  { href: '/dashboard/ofertas', label: 'Generador de Ofertas', icon: '📝' },
  { href: '/dashboard/ganadas', label: 'Ganadas (Project Delivery)', icon: '🏆' },
  { href: '/dashboard/financiero', label: 'Control Financiero', icon: '💰' },
  { href: '/dashboard/insights', label: 'Insights & BI', icon: '📊' },
  { href: '/dashboard/configuracion', label: 'Configuraciones', icon: '⚙️' },
];

const ROLE_LABELS: Record<string, string> = {
  Admin: 'Administrador',
  'Evaluador Técnico': 'Evaluador Técnico',
  'Evaluador Financiero': 'Evaluador Financiero',
  'Operador de Proyecto': 'Operador de Proyecto',
  Auditor: 'Auditor',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('prometeo_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        // Cambio de contraseña obligatorio
        if (data.mustChangePassword) {
          setShowPasswordModal(true);
        }
      })
      .catch(() => {
        localStorage.removeItem('prometeo_token');
        router.push('/login');
      });
  }, []);

  async function changePassword(newPassword: string, currentPassword: string) {
    const token = localStorage.getItem('prometeo_token');
    const res = await fetch(`${API_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al cambiar la contraseña');
    setShowPasswordModal(false);
    setUser({ ...user, mustChangePassword: false });
  }

  function logout() {
    localStorage.removeItem('prometeo_token');
    localStorage.removeItem('prometeo_user');
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col bg-slate-900 text-slate-200">
        <div className="flex items-center gap-2 px-5 py-5 text-lg font-bold text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-600">🔥</span>
          Prometeo
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {SIDEBAR.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-800 ${
                pathname === item.href ? 'bg-slate-800 text-white' : ''
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-700 p-4 text-xs text-slate-400">
          {user?.tenant?.nombreComercial || 'CIDE SAS'} · Tenant
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        {/* Header (similar Argos-RMM) */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">
              {user?.tenant?.nombreComercial || 'Panel Prometeo'}
            </h2>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 rounded-full px-3 py-1.5 hover:bg-slate-100"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-600 text-sm font-bold text-white">
                {(user?.nombre || 'A').charAt(0).toUpperCase()}
              </span>
              <span className="text-left">
                <span className="block text-sm font-semibold text-slate-800">{user?.nombre || 'Usuario'}</span>
                <span className="block text-xs text-slate-500">
                  {ROLE_LABELS[user?.rol] || user?.rol || ''}
                </span>
              </span>
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                <div className="border-b px-4 py-2">
                  <p className="text-sm font-semibold">{user?.nombre}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setShowPasswordModal(true);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                >
                  🔑 Cambiar contraseña
                </button>
                <button
                  onClick={logout}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-8">{children}</main>
      </div>

      {/* Modal cambio de contraseña (obligatorio en primer ingreso) */}
      {showPasswordModal && (
        <ChangePasswordModal
          onChange={changePassword}
          onClose={() => {
            if (!user?.mustChangePassword) setShowPasswordModal(false);
          }}
          required={!!user?.mustChangePassword}
        />
      )}
    </div>
  );
}

function ChangePasswordModal({
  onChange,
  onClose,
  required,
}: {
  onChange: (newPassword: string, currentPassword: string) => Promise<void>;
  onClose: () => void;
  required: boolean;
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (next.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (next !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await onChange(next, current);
    } catch (err: any) {
      setError(err.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Cambiar contraseña</h3>
          {!required && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
          )}
        </div>
        {required && (
          <p className="mt-1 text-sm text-slate-500">
            Por seguridad, debes cambiar tu contraseña inicial antes de continuar.
          </p>
        )}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
        )}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Contraseña actual</label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Nueva contraseña</label>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Confirmar nueva contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-700 py-2.5 font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
