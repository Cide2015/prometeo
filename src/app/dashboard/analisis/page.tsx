'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Analysis {
  id: string;
  pWin?: string;
  decision: string;
  justificacion?: string;
  financieroJson?: any;
  costosJson?: any;
  createdAt: string;
  opportunity?: { entidad?: string; objeto?: string } | null;
  rfiRfp?: { entidad?: string; asunto?: string } | null;
}

export default function AnalisisPage() {
  const [items, setItems] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [form, setForm] = useState({ opportunityId: '', cuantiaCop: '', cumplimientoTecnico: '70', margenObjetivoPct: '0.2', capacidad: '70' });

  useEffect(() => {
    load();
    loadOpps();
  }, []);

  async function load() {
    const token = localStorage.getItem('prometeo_token');
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/analysis`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setItems(d.items || []);
    } finally { setLoading(false); }
  }

  async function loadOpps() {
    const token = localStorage.getItem('prometeo_token');
    try {
      const r = await fetch(`${API_URL}/api/opportunities`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setOpportunities((d.items || []).filter((o: any) => o.estado === 'disponible'));
    } catch {}
  }

  async function analizar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const token = localStorage.getItem('prometeo_token');
    try {
      const r = await fetch(`${API_URL}/api/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          opportunityId: form.opportunityId || undefined,
          cuantiaCop: form.cuantiaCop ? Number(form.cuantiaCop) : undefined,
          cumplimientoTecnico: Number(form.cumplimientoTecnico),
          capacidad: Number(form.capacidad),
          margenObjetivoPct: Number(form.margenObjetivoPct),
        }),
      });
      const d = await r.json();
      if (d.success) {
        setMessage(`Análisis completado: ${d.decision.toUpperCase()} · P_win ${d.pWin}%`);
        load();
      } else {
        setMessage(d.error || d.message || 'Error al analizar');
      }
    } catch { setMessage('Error de conexión'); }
    finally { setLoading(false); }
  }

  const badge = (d: string) =>
    d === 'go'
      ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">GO</span>
      : d === 'nogo'
        ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">NO-GO</span>
        : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{d}</span>;

  const fmtCOP = (v: any) => {
    if (v == null) return '—';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v));
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Análisis IA (Go / No-Go)</h1>
          <p className="mt-1 text-sm text-slate-500">
            Motor de decisión: matriz técnica, validación financiera (liquidez, endeudamiento, ROE, ROA) y P_win.
          </p>
        </div>
      </div>

      {message && <div className="mt-4 rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-800">{message}</div>}

      <form onSubmit={analizar} className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-semibold">Analizar oportunidad</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Oportunidad (SECOP)</label>
            <select value={form.opportunityId} onChange={(e) => setForm({ ...form, opportunityId: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Sin oportunidad (ingresar cuantía)</option>
              {opportunities.map((o) => (
                <option key={o.id} value={o.id}>{o.entidad || o.objeto} — {fmtCOP(o.cuantiaCop)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Cuantía (COP) si no hay oportunidad</label>
            <input type="number" value={form.cuantiaCop} onChange={(e) => setForm({ ...form, cuantiaCop: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="100.000.000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Cumplimiento técnico (0-100)</label>
            <input type="number" value={form.cumplimientoTecnico} onChange={(e) => setForm({ ...form, cumplimientoTecnico: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Capacidad operativa (0-100)</label>
            <input type="number" value={form.capacidad} onChange={(e) => setForm({ ...form, capacidad: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Margen objetivo (fracción)</label>
            <input type="number" step="0.05" value={form.margenObjetivoPct} onChange={(e) => setForm({ ...form, margenObjetivoPct: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="mt-4 rounded-lg bg-violet-700 px-5 py-2.5 font-semibold text-white hover:bg-violet-800 disabled:opacity-50">
          {loading ? 'Analizando...' : '🧠 Ejecutar análisis Go/No-Go'}
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {items.length === 0 && !loading && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
            Sin análisis aún. Ejecuta el primero.
          </div>
        )}
        {items.map((a) => (
          <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">
                  {a.opportunity?.entidad || a.rfiRfp?.entidad || 'Análisis'}
                </h3>
                <p className="mt-1 text-sm text-slate-600">{a.opportunity?.objeto || a.rfiRfp?.asunto || ''}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  {badge(a.decision)}
                  <span className="text-lg font-bold text-violet-700">{a.pWin}%</span>
                </div>
              </div>
            </div>
            {a.justificacion && <p className="mt-2 text-sm text-slate-600">{a.justificacion}</p>}
            {a.costosJson && (
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-xs sm:grid-cols-5">
                <div><span className="block text-slate-500">Cuantía</span><b>{fmtCOP(a.costosJson.cuantia)}</b></div>
                <div><span className="block text-slate-500">Personal</span><b>{fmtCOP(a.costosJson.personal)}</b></div>
                <div><span className="block text-slate-500">Viáticos</span><b>{fmtCOP(a.costosJson.viaticos)}</b></div>
                <div><span className="block text-slate-500">Infra</span><b>{fmtCOP(a.costosJson.infrastructure)}</b></div>
                <div><span className="block text-slate-500">Margen neto</span><b>{fmtCOP(a.costosJson.margenNeto)}</b></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
