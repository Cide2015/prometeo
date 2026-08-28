'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Ledger {
  id: string;
  tipoMovimiento: string;
  concepto: string;
  montoCop: string;
  fechaRegistro: string;
  project?: { numeroContrato?: string; bid?: any } | null;
}

export default function FinancieroPage() {
  const [items, setItems] = useState<Ledger[]>([]);
  const [resumen, setResumen] = useState<any>(null);
  const [impuestos, setImpuestos] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ projectId: '', tipoMovimiento: 'ingreso', concepto: '', montoCop: '' });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const token = localStorage.getItem('prometeo_token');
    setLoading(true);
    try {
      const [l, r, i, p] = await Promise.all([
        fetch(`${API_URL}/api/financiero`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        fetch(`${API_URL}/api/financiero/resumen`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        fetch(`${API_URL}/api/financiero/impuestos`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        fetch(`${API_URL}/api/projects`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      ]);
      setItems(l.items || []);
      setResumen(r);
      setImpuestos(i);
      setProjects(p.items || []);
    } finally { setLoading(false); }
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('prometeo_token');
    const r = await fetch(`${API_URL}/api/financiero`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, montoCop: Number(form.montoCop) }),
    });
    const d = await r.json();
    setMessage(d.success ? 'Movimiento registrado' : (d.message || 'Error'));
    setShowForm(false);
    setForm({ projectId: '', tipoMovimiento: 'ingreso', concepto: '', montoCop: '' });
    loadAll();
  }

  const fmtCOP = (v: any) => {
    if (v == null) return '—';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v));
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Control Financiero Contractual</h1>
          <p className="mt-1 text-sm text-slate-500">
            Flujo de caja, facturación por hitos y liquidación impositiva territorial.
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800">
          + Registrar movimiento
        </button>
      </div>

      {message && <div className="mt-4 rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-800">{message}</div>}

      {/* Resumen de márgenes */}
      {resumen && (
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Ingresos facturados', value: fmtCOP(resumen.totalIngresos), color: 'text-emerald-600' },
            { label: 'Egresos', value: fmtCOP(resumen.totalEgresos), color: 'text-red-600' },
            { label: 'Margen real', value: fmtCOP(resumen.margenReal), color: 'text-violet-700' },
            { label: 'Margen proyectado', value: fmtCOP(resumen.margenProyectado), color: 'text-sky-600' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
              <p className={`mt-1 text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={crear} className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold">Nuevo movimiento</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Proyecto</label>
              <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Seleccionar...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.numeroContrato || p.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Tipo</label>
              <select value={form.tipoMovimiento} onChange={(e) => setForm({ ...form, tipoMovimiento: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Concepto</label>
              <input value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Factura hito 1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Monto (COP)</label>
              <input type="number" value={form.montoCop} onChange={(e) => setForm({ ...form, montoCop: e.target.value })} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white">Registrar</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
          </div>
        </form>
      )}

      {/* Impuestos territoriales */}
      {impuestos && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold">Liquidación impositiva territorial</h3>
          <p className="mt-1 text-xs text-slate-500">{impuestos.nota}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              { name: 'Retefuente', base: impuestos.retefuente.base, d: impuestos.retefuente.descripcion },
              { name: 'ReteICA', base: impuestos.reteIca.base, d: impuestos.reteIca.descripcion },
              { name: 'ReteIVA', base: impuestos.reteIva.base, d: impuestos.reteIva.descripcion },
            ].map((t) => (
              <div key={t.name} className="rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-bold text-slate-700">{t.name} · {(t.base * 100).toFixed(1)}%</p>
                <p className="mt-1 text-xs text-slate-500">{t.d}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de movimientos */}
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Proyecto</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Concepto</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Sin movimientos registrados.</td></tr>
            )}
            {items.map((l) => (
              <tr key={l.id} className="border-b last:border-0">
                <td className="px-4 py-3">{l.project?.numeroContrato || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${l.tipoMovimiento === 'ingreso' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {l.tipoMovimiento}
                  </span>
                </td>
                <td className="px-4 py-3">{l.concepto}</td>
                <td className={`px-4 py-3 font-medium ${l.tipoMovimiento === 'ingreso' ? 'text-emerald-700' : 'text-red-700'}`}>{fmtCOP(l.montoCop)}</td>
                <td className="px-4 py-3">{new Date(l.fechaRegistro).toLocaleDateString('es-CO')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
