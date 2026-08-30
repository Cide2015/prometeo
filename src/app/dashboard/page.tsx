'use client';

import { useEffect, useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Opportunity {
  id: string;
  secopId?: string;
  entidad?: string;
  objeto?: string;
  cuantiaCop?: string;
  fechaCierre?: string;
  estado: string;
  favorito?: boolean;
  metadataJson?: any;
}

interface Area {
  id: string;
  nombre: string;
  codigos: string[];
}

interface Stats {
  disponibles: number;
  aplicadas: number;
  descartadas: number;
  favoritas: number;
}

const COLS: { key: string; label: string; sortable: boolean }[] = [
  { key: 'secopId', label: 'N° Proceso', sortable: true },
  { key: 'entidad', label: 'Entidad', sortable: true },
  { key: 'objeto', label: 'Objeto', sortable: true },
  { key: 'cuantiaCop', label: 'Cuantía', sortable: true },
  { key: 'fechaCierre', label: 'Cierre', sortable: true },
  { key: 'estado', label: 'Estado', sortable: true },
  { key: 'metadataJson', label: 'UNSPSC / Modalidad', sortable: false },
];

export default function DashboardPage() {
  const [tenantId, setTenantId] = useState<string>('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<Opportunity[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Ordenamiento
  const [sortBy, setSortBy] = useState('cuantiaCop');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtros de negocio del usuario
  const [filtroQ, setFiltroQ] = useState('');
  const [filtroEntidad, setFiltroEntidad] = useState('');
  const [filtroDepto, setFiltroDepto] = useState('');
  const [filtroMin, setFiltroMin] = useState('');
  const [filtroMax, setFiltroMax] = useState('');
  const [filtroModalidad, setFiltroModalidad] = useState('');
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroFavorito, setFiltroFavorito] = useState(false);
  const [useEspejo, setUseEspejo] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('prometeo_token') : null;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', pageSize === 0 ? 'all' : String(pageSize));
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      if (filtroQ) params.set('q', filtroQ);
      if (filtroEntidad) params.set('entidad', filtroEntidad);
      if (filtroDepto) params.set('departamento', filtroDepto);
      if (filtroMin) params.set('cuantiaMin', filtroMin);
      if (filtroMax) params.set('cuantiaMax', filtroMax);
      if (filtroModalidad) params.set('modalidad', filtroModalidad);
      if (filtroArea) params.set('areaId', filtroArea);
      if (filtroFavorito) params.set('favorito', 'true');
      if (useEspejo) params.set('useProfiles', 'true');

      const [s, o] = await Promise.all([
        fetch(`${API_URL}/api/opportunities/stats`, { headers: authHeaders }).then((r) => r.json()),
        fetch(`${API_URL}/api/opportunities?${params}`, { headers: authHeaders }).then((r) => r.json()),
      ]);
      setStats(s);
      setItems(o.items || []);
      setAreas(o.areas || []);
      setTotal(o.total || 0);
      setTotalPages(o.totalPages || 1);
    } catch {
      setMessage('Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, [tenantId, page, pageSize, sortBy, sortOrder, filtroQ, filtroEntidad, filtroDepto, filtroMin, filtroMax, filtroModalidad, filtroArea, filtroFavorito, useEspejo]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.tenantId) setTenantId(d.tenantId);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tenantId) loadData();
  }, [tenantId, loadData]);

  async function syncSecop() {
    setLoading(true);
    setMessage('');
    try {
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
      loadData();
    } catch {
      setMessage('Error sincronizando SECOP');
      setLoading(false);
    }
  }

  function aplicarFiltros(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadData();
  }

  async function toggleFavorito(o: Opportunity) {
    const res = await fetch(`${API_URL}/api/opportunities/${o.id}/favorito`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ favorito: !o.favorito }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((x) => (x.id === o.id ? { ...x, favorito: !o.favorito } : x)));
      const s = await fetch(`${API_URL}/api/opportunities/stats`, { headers: authHeaders }).then((r) => r.json());
      setStats(s);
    }
  }

  function ordenar(col: string) {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
    setPage(1);
  }

  const fmtCOP = (v?: string) => {
    if (!v) return '—';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v));
  };

  const renderPagina = (n: number) => (
    <button
      key={n}
      onClick={() => setPage(n)}
      className={`min-w-8 rounded-md px-2 py-1 text-sm ${
        n === page ? 'bg-violet-700 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
      }`}
    >
      {n}
    </button>
  );

  const paginas = () => {
    const arr: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventario de Oportunidades</h1>
          <p className="mt-1 text-sm text-slate-500">
            Espejo de SECOP II vía Datos Abiertos (SODA API). Muestra las oportunidades activas que coinciden con tus{' '}
            <b>Áreas de Interés</b>. Marca ⭐ las de interés para analizarlas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              checked={useEspejo}
              onChange={(e) => { setUseEspejo(e.target.checked); setTimeout(() => loadData(), 50); }}
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
          <label className="block text-xs font-medium text-slate-500">🔍 Palabras clave (objeto / entidad / N° proceso)</label>
          <input
            type="text"
            value={filtroQ}
            onChange={(e) => setFiltroQ(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            placeholder="Ej: consultoría, energía, CO1.NTC..."
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
          <label className="block text-xs font-medium text-slate-500">🎯 Área de interés</label>
          <select
            value={filtroArea}
            onChange={(e) => setFiltroArea(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
          >
            <option value="">Todas las áreas</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
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
            <option>Concurso de Méritos</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="w-full rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800">
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={() => {
              setFiltroQ(''); setFiltroEntidad(''); setFiltroDepto(''); setFiltroMin('');
              setFiltroMax(''); setFiltroModalidad(''); setFiltroArea(''); setFiltroFavorito(false);
              setPage(1); setTimeout(() => loadData(), 50);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Limpiar
          </button>
        </div>
      </form>

      {/* Resumen */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Disponibles', value: stats?.disponibles ?? 0, color: 'text-violet-700' },
          { label: '⭐ Favoritos para analizar', value: stats?.favoritas ?? 0, color: 'text-amber-500' },
          { label: 'Aplicadas', value: stats?.aplicadas ?? 0, color: 'text-sky-600' },
          { label: 'Áreas de interés', value: areas.length, color: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Controles de paginación */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Mostrar:</span>
          {[10, 20, 30, 0].map((n) => (
            <button
              key={n}
              onClick={() => { setPageSize(n); setPage(1); }}
              className={`rounded-md px-2 py-1 text-sm ${
                pageSize === n ? 'bg-violet-700 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {n === 0 ? 'Todo' : n}
            </button>
          ))}
          <span className="ml-2 text-slate-400">{total} oportunidades</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          >
            ‹
          </button>
          {paginas().map(renderPagina)}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          >
            ›
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="w-10 px-3 py-3"></th>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  onClick={() => c.sortable && ordenar(c.key)}
                  className={`px-3 py-3 ${c.sortable ? 'cursor-pointer select-none hover:text-violet-700' : ''}`}
                >
                  {c.label}
                  {sortBy === c.key && <span className="ml-1">{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={COLS.length + 1} className="px-4 py-10 text-center text-slate-400">
                  {loading ? 'Cargando...' : 'Sin resultados. Ajusta los filtros o pulsa "Sincronizar SECOP II".'}
                </td>
              </tr>
            )}
            {items.map((o) => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-3 py-3 text-center">
                  <button
                    onClick={() => toggleFavorito(o)}
                    title={o.favorito ? 'Quitar de favoritos' : 'Marcar para analizar'}
                    className={`text-lg transition-transform hover:scale-125 ${o.favorito ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
                  >
                    ⭐
                  </button>
                </td>
                <td className="px-3 py-3">
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">{o.secopId || '—'}</span>
                </td>
                <td className="max-w-[180px] truncate px-3 py-3 font-medium">{o.entidad || '—'}</td>
                <td className="max-w-md truncate px-3 py-3 text-slate-600">{o.objeto || '—'}</td>
                <td className="px-3 py-3">{fmtCOP(o.cuantiaCop)}</td>
                <td className="px-3 py-3">{o.fechaCierre ? new Date(o.fechaCierre).toLocaleDateString('es-CO') : '—'}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    o.estado === 'disponible' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {o.estado}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                      {((o.metadataJson?.unspsc) || []).join(', ')}
                    </span>
                    {o.metadataJson?.modalidad && (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                        {o.metadataJson.modalidad}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación inferior */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          >
            ‹ Anterior
          </button>
          {paginas().map(renderPagina)}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          >
            Siguiente ›
          </button>
        </div>
      )}
    </div>
  );
}
