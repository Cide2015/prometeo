'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Opportunity {
  id: string;
  secopId?: string;
  entidad?: string;
  objeto?: string;
  cuantiaCop?: string;
  fechaCierre?: string;
  estado: string;
  metadataJson?: any;
}

interface Stats {
  disponibles: number;
  aplicadas: number;
  descartadas: number;
}

export default function DashboardPage() {
  const [tenantId, setTenantId] = useState<string>('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<Opportunity[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // En este esqueleto el tenant se resuelve del setup (primer tenant)
    fetch(`${API_URL}/api/setup/status`)
      .then((r) => r.json())
      .then((d) => {
        if (d.initialized) {
          setTenantId(d.tenantId);
          loadData(d.tenantId);
        } else {
          setMessage('No hay empresa registrada. Ejecutar bootstrap.');
        }
      })
      .catch(() => setMessage('Error conectando con el backend'));
  }, []);

  async function loadData(tenant: string) {
    setLoading(true);
    try {
      const [s, o] = await Promise.all([
        fetch(`${API_URL}/api/opportunities/stats?tenantId=${tenant}`).then((r) => r.json()),
        fetch(`${API_URL}/api/opportunities?tenantId=${tenant}`).then((r) => r.json()),
      ]);
      setStats(s);
      setItems(o.items || []);
    } catch {
      setMessage('Error cargando datos');
    } finally {
      setLoading(false);
    }
  }

  async function syncSecop() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/api/opportunities/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      });
      const d = await res.json();
      setMessage(`Sincronización SECOP: ${d.ingested || 0} nuevas, ${d.totalDisponibles || 0} disponibles.`);
      loadData(tenantId);
    } catch {
      setMessage('Error sincronizando SECOP');
      setLoading(false);
    }
  }

  const fmtCOP = (v?: string) => {
    if (!v) return '—';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v));
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventario de Oportunidades</h1>
          <p className="mt-1 text-sm text-slate-500">
            Espejo de SECOP II vía Datos Abiertos (SODA API). Filtrado por UNSPSC de tu empresa.
          </p>
        </div>
        <button
          onClick={syncSecop}
          disabled={loading || !tenantId}
          className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
        >
          {loading ? 'Sincronizando...' : '↻ Sincronizar SECOP II'}
        </button>
      </div>

      {message && (
        <div className="mt-4 rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-800">{message}</div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Oportunidades disponibles', value: stats?.disponibles ?? 0, color: 'text-violet-700' },
          { label: 'Aplicadas', value: stats?.aplicadas ?? 0, color: 'text-sky-600' },
          { label: 'Descartadas', value: stats?.descartadas ?? 0, color: 'text-amber-600' },
          { label: 'UNSPSC configurados', value: 15, color: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Entidad</th>
              <th className="px-4 py-3">Objeto</th>
              <th className="px-4 py-3">Cuantía</th>
              <th className="px-4 py-3">Cierre</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  {loading ? 'Cargando...' : 'Sin oportunidades. Pulsa "Sincronizar SECOP II".'}
                </td>
              </tr>
            )}
            {items.map((o) => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{o.entidad || '—'}</td>
                <td className="max-w-md truncate px-4 py-3 text-slate-600">{o.objeto || '—'}</td>
                <td className="px-4 py-3">{fmtCOP(o.cuantiaCop)}</td>
                <td className="px-4 py-3">{o.fechaCierre ? new Date(o.fechaCierre).toLocaleDateString('es-CO') : '—'}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {o.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
