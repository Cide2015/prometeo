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

  // Filtros de negocio del usuario
  const [filtroEntidad, setFiltroEntidad] = useState('');
  const [filtroQ, setFiltroQ] = useState('');
  const [filtroMin, setFiltroMin] = useState('');
  const [filtroMax, setFiltroMax] = useState('');
  const [filtroModalidad, setFiltroModalidad] = useState('');
  const [filtroDepto, setFiltroDepto] = useState('');
  const [useEspejo, setUseEspejo] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('prometeo_token');
    if (!token) return;
    // Obtener tenant del usuario autenticado
    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.tenantId) {
          setTenantId(d.tenantId);
          loadData(d.tenantId);
        }
      })
      .catch(() => {});
  }, []);

  async function loadData(tenant: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tenantId: tenant });
      if (filtroEntidad) params.set('entidad', filtroEntidad);
      if (filtroQ) params.set('q', filtroQ);
      if (filtroMin) params.set('cuantiaMin', filtroMin);
      if (filtroMax) params.set('cuantiaMax', filtroMax);
      if (filtroModalidad) params.set('modalidad', filtroModalidad);
      if (filtroDepto) params.set('departamento', filtroDepto);
      if (useEspejo) params.set('useProfiles', 'true');
      const [s, o] = await Promise.all([
        fetch(`${API_URL}/api/opportunities/stats?tenantId=${tenant}`).then((r) => r.json()),
        fetch(`${API_URL}/api/opportunities?${params}`).then((r) => r.json()),
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
      const token = localStorage.getItem('prometeo_token');
      const res = await fetch(`${API_URL}/api/opportunities/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tenantId }),
      });
      const d = await res.json();
      if (!res.ok) {
        setMessage(`Error: ${d.message || 'no se pudo sincronizar'}`);
      } else {
        setMessage(`Sincronización SECOP: ${d.ingested || 0} nuevas, ${d.totalDisponibles || 0} disponibles.`);
      }
      loadData(tenantId);
    } catch {
      setMessage('Error sincronizando SECOP');
      setLoading(false);
    }
  }

  function aplicarFiltros(e: React.FormEvent) {
    e.preventDefault();
    loadData(tenantId);
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
            Espejo de SECOP II vía Datos Abiertos (SODA API). Muestra las oportunidades que coinciden con tus <b>Áreas de Interés</b>
            (códigos UNSPSC) — este es el segundo paso del flujo: <b>Registro → Áreas de Interés → Inventario → Análisis → Ofertas → Ganadas → Financiero</b>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              checked={useEspejo}
              onChange={(e) => { setUseEspejo(e.target.checked); setTimeout(() => loadData(tenantId), 50); }}
              className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
            />
            🎯 Solo mis áreas de interés
          </label>
          <button
            onClick={syncSecop}
            disabled={loading || !tenantId}
            className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
          >
            {loading ? 'Sincronizando...' : '↻ Sincronizar SECOP II'}
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-4 rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-800">{message}</div>
      )}

      {/* Filtros del usuario */}
      <form onSubmit={aplicarFiltros} className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-500">🔍 Palabras clave (objeto / entidad)</label>
          <input
            type="text"
            value={filtroQ}
            onChange={(e) => setFiltroQ(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            placeholder="Ej: consultoría, infraestructura, energía..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Entidad</label>
          <input
            type="text"
            value={filtroEntidad}
            onChange={(e) => setFiltroEntidad(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            placeholder="Buscar entidad..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Departamento</label>
          <input
            type="text"
            value={filtroDepto}
            onChange={(e) => setFiltroDepto(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            placeholder="Bogotá D.C., Antioquia..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Cuantía mínima (COP)</label>
          <input
            type="number"
            value={filtroMin}
            onChange={(e) => setFiltroMin(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            placeholder="50.000.000"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Cuantía máxima (COP)</label>
          <input
            type="number"
            value={filtroMax}
            onChange={(e) => setFiltroMax(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            placeholder="500.000.000"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Modalidad</label>
          <select
            value={filtroModalidad}
            onChange={(e) => setFiltroModalidad(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
          >
            <option value="">Todas</option>
            <option>Licitación Pública</option>
            <option>Selección Abreviada</option>
            <option>Mínima Cuantía</option>
            <option>Contratación Directa</option>
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="w-full rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800">
            Aplicar filtros
          </button>
        </div>
      </form>

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
              <th className="px-4 py-3">Modalidad</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
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
                <td className="px-4 py-3">{o.metadataJson?.modalidad || '—'}</td>
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
