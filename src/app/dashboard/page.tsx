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
  createdAt?: string;
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

const fmtCOP = (v?: string | number | null) => {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (isNaN(n)) return String(v);
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
};

const fmtFecha = (v?: string | null) => {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v).slice(0, 10);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function DashboardPage() {
  const [tenantId, setTenantId] = useState<string>('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<Opportunity[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [modalidades, setModalidades] = useState<string[]>([]);
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

  // Filtros
  const [filtroQ, setFiltroQ] = useState('');
  const [filtroEntidad, setFiltroEntidad] = useState('');
  const [filtroDepto, setFiltroDepto] = useState('');
  const [filtroMin, setFiltroMin] = useState('');
  const [filtroMax, setFiltroMax] = useState('');
  const [filtroModalidad, setFiltroModalidad] = useState('');
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroFavorito, setFiltroFavorito] = useState(false);
  const [useEspejo, setUseEspejo] = useState(true);

  // Modal de detalle
  const [detalle, setDetalle] = useState<Opportunity | null>(null);

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
      setModalidades(o.modalidades || []);
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
      const nuevo = { ...o, favorito: !o.favorito };
      setItems((prev) => prev.map((x) => (x.id === o.id ? nuevo : x)));
      if (detalle?.id === o.id) setDetalle(nuevo);
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

  const md = (o: Opportunity) => o.metadataJson || {};

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventario de Oportunidades</h1>
          <p className="mt-1 text-sm text-slate-500">
            Espejo de SECOP II vía Datos Abiertos (SODA API). Muestra las oportunidades activas que coinciden con tus{' '}
            <b>Áreas de Interés</b>. Doble clic en el <b>N° Proceso</b> para ver el detalle completo.
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

      {/* Filtros */}
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
            {modalidades.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
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
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600 sm:col-span-2">
          <input
            type="checkbox"
            checked={filtroFavorito}
            onChange={(e) => { setFiltroFavorito(e.target.checked); setPage(1); setTimeout(() => loadData(), 50); }}
            className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
          />
          ⭐ Solo favoritos para analizar
        </label>
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
      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="w-12 px-3 py-3 text-center">⭐</th>
              <th className="cursor-pointer select-none px-3 py-3 hover:text-violet-700" onClick={() => ordenar('secopId')}>
                N° Proceso {sortBy === 'secopId' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
              <th className="cursor-pointer select-none px-3 py-3 hover:text-violet-700" onClick={() => ordenar('entidad')}>
                Entidad {sortBy === 'entidad' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
              <th className="cursor-pointer select-none px-3 py-3 hover:text-violet-700" onClick={() => ordenar('objeto')}>
                Objeto {sortBy === 'objeto' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
              <th className="cursor-pointer select-none px-3 py-3 hover:text-violet-700" onClick={() => ordenar('cuantiaCop')}>
                Cuantía {sortBy === 'cuantiaCop' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
              <th className="px-3 py-3">Publicación</th>
              <th className="cursor-pointer select-none px-3 py-3 hover:text-violet-700" onClick={() => ordenar('fechaCierre')}>
                Últ. publicación {sortBy === 'fechaCierre' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
              <th className="px-3 py-3">Ingresado</th>
              <th className="px-3 py-3">Modalidad</th>
              <th className="px-3 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
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
                    className={`text-lg transition-transform hover:scale-125 ${o.favorito ? '' : 'grayscale opacity-40 hover:opacity-100'}`}
                  >
                    ⭐
                  </button>
                </td>
                <td className="px-3 py-3">
                  <button
                    onDoubleClick={() => setDetalle(o)}
                    title="Doble clic para ver detalle completo"
                    className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-violet-700 underline decoration-dotted hover:bg-violet-100"
                  >
                    {o.secopId || '—'}
                  </button>
                </td>
                <td className="max-w-[180px] truncate px-3 py-3 font-medium">{o.entidad || '—'}</td>
                <td className="max-w-md truncate px-3 py-3 text-slate-600">{o.objeto || '—'}</td>
                <td className="px-3 py-3 whitespace-nowrap font-semibold text-slate-800">{fmtCOP(o.cuantiaCop)}</td>
                <td className="px-3 py-3 whitespace-nowrap">{fmtFecha(md(o).fechaPublicacion)}</td>
                <td className="px-3 py-3 whitespace-nowrap">{fmtFecha(md(o).fechaUltimaPublicacion)}</td>
                <td className="px-3 py-3 whitespace-nowrap">{fmtFecha(o.createdAt)}</td>
                <td className="px-3 py-3">
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                    {md(o).modalidad || '—'}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    o.estado === 'disponible' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {o.estado}
                  </span>
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

      {/* ===== MODAL DE DETALLE (doble clic en N° Proceso) ===== */}
      {detalle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDetalle(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Detalle de la oportunidad</h3>
                <span className="font-mono text-sm text-violet-700">{detalle.secopId || '—'}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleFavorito(detalle)}
                  title={detalle.favorito ? 'Quitar de favoritos' : 'Marcar para analizar'}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    detalle.favorito
                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <span className={detalle.favorito ? '' : 'grayscale opacity-50'}>⭐</span>
                  {detalle.favorito ? 'Favorito para analizar' : 'Marcar favorito'}
                </button>
                <button
                  onClick={() => setDetalle(null)}
                  className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                >
                  ✕ Cerrar
                </button>
              </div>
            </div>

            {/* Cuerpo */}
            <div className="space-y-6 px-6 py-5">
              {/* Favorito + estado */}
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  detalle.estado === 'disponible' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {detalle.estado}
                </span>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
                  {md(detalle).modalidad || '—'}
                </span>
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
                  Fase: {md(detalle).fase || '—'}
                </span>
                {md(detalle).estadoResumen && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                    {md(detalle).estadoResumen}
                  </span>
                )}
              </div>

              {/* Datos clave */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-medium text-slate-500">Entidad</p>
                  <p className="mt-1 font-semibold">{detalle.entidad || '—'}</p>
                  {md(detalle).nitEntidad && (
                    <p className="mt-0.5 text-xs text-slate-500">NIT: {md(detalle).nitEntidad}</p>
                  )}
                  {md(detalle).codigoEntidad && (
                    <p className="text-xs text-slate-500">Código: {md(detalle).codigoEntidad}</p>
                  )}
                  {md(detalle).unidadCompra && (
                    <p className="mt-0.5 text-xs text-slate-500">Unidad de compra: {md(detalle).unidadCompra}</p>
                  )}
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-medium text-slate-500">Cuantía (COP)</p>
                  <p className="mt-1 text-xl font-bold text-violet-700">{fmtCOP(detalle.cuantiaCop)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Tipo: {md(detalle).tipoContrato || '—'}{md(detalle).subtipoContrato ? ` · ${md(detalle).subtipoContrato}` : ''}
                  </p>
                </div>
              </div>

              {/* Objeto completo (sin truncar) */}
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-500">Objeto del proceso</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {detalle.objeto || '—'}
                </p>
              </div>

              {/* Fechas importantes */}
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-500">Fechas importantes</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-400">Publicación</p>
                    <p className="text-sm font-semibold">{fmtFecha(md(detalle).fechaPublicacion)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Última publicación</p>
                    <p className="text-sm font-semibold">{fmtFecha(md(detalle).fechaUltimaPublicacion)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Fase 3</p>
                    <p className="text-sm font-semibold">{fmtFecha(md(detalle).fechaPublicacionFase3)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Ingresado a Prometeo</p>
                    <p className="text-sm font-semibold">{fmtFecha(detalle.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Ubicación y duración */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-medium text-slate-500">Ubicación</p>
                  <p className="mt-1 text-sm font-semibold">{md(detalle).ciudad || '—'}</p>
                  <p className="text-xs text-slate-500">{md(detalle).departamento || '—'}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-medium text-slate-500">Duración</p>
                  <p className="mt-1 text-sm font-semibold">
                    {md(detalle).duracion || '—'} {md(detalle).unidadDuracion ? md(detalle).unidadDuracion.toLowerCase() : ''}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-medium text-slate-500">Detalles</p>
                  <p className="mt-1 text-sm">
                    Lotes: {md(detalle).numeroLotes || '—'} · Respuestas: {md(detalle).respuestas || '—'}
                  </p>
                  <p className="text-xs text-slate-500">Vistas: {md(detalle).visualizaciones || '—'}</p>
                </div>
              </div>

              {/* UNSPSC */}
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-500">Códigos UNSPSC</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(md(detalle).unspsc || []).map((c: string) => (
                    <span key={c} className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Adjudicación y actividad */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-medium text-slate-500">Estado de actividad</p>
                  <p className="mt-1 text-sm">
                    Adjudicado: <b>{md(detalle).adjudicado || '—'}</b>
                  </p>
                  <p className="text-sm">
                    Apertura: <b>{md(detalle).estadoApertura || '—'}</b>
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-medium text-slate-500">Enlace SECOP</p>
                  {md(detalle).url?.url || md(detalle).url ? (
                    <a
                      href={typeof md(detalle).url === 'string' ? md(detalle).url : md(detalle).url?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block break-all text-sm font-medium text-violet-700 underline hover:text-violet-900"
                    >
                      Abrir en SECOP II →
                    </a>
                  ) : (
                    <p className="mt-1 text-sm text-slate-400">Sin enlace</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
