'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Project {
  id: string;
  numeroContrato?: string;
  fechaInicio?: string;
  fechaFin?: string;
  valorTotal?: string;
  estado: string;
  bid?: { opportunity?: { entidad?: string; objeto?: string } | null; rfiRfp?: { entidad?: string; asunto?: string } | null } | null;
  milestones: any[];
  documents: any[];
  ledgers: any[];
}

export default function GanadasPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bidId: '', numeroContrato: '', fechaInicio: '', fechaFin: '', valorTotal: '' });

  useEffect(() => { load(); loadBids(); }, []);

  async function load() {
    const token = localStorage.getItem('prometeo_token');
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/projects`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setItems(d.items || []);
    } finally { setLoading(false); }
  }

  async function loadBids() {
    const token = localStorage.getItem('prometeo_token');
    try {
      const r = await fetch(`${API_URL}/api/bids`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setBids((d.items || []).filter((b: any) => b.faseFunnel === 'presentada'));
    } catch {}
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('prometeo_token');
    const r = await fetch(`${API_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, valorTotal: form.valorTotal ? Number(form.valorTotal) : undefined }),
    });
    const d = await r.json();
    setMessage(d.success ? 'Proyecto ganado creado con hitos iniciales' : (d.message || 'Error'));
    setShowForm(false);
    setForm({ bidId: '', numeroContrato: '', fechaInicio: '', fechaFin: '', valorTotal: '' });
    load();
  }

  const fmtCOP = (v?: string) => {
    if (!v) return '—';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v));
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ganadas (Project Delivery)</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gobernanza post-adjudicación: proyectos, entregables, hitos y documentación contractual.
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800">
          + Crear proyecto ganado
        </button>
      </div>

      {message && <div className="mt-4 rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-800">{message}</div>}

      {showForm && (
        <form onSubmit={crear} className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold">Nuevo proyecto (oferta adjudicada)</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Oferta presentada</label>
              <select value={form.bidId} onChange={(e) => setForm({ ...form, bidId: e.target.value })} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Seleccionar...</option>
                {bids.map((b) => (
                  <option key={b.id} value={b.id}>{b.opportunity?.entidad || b.rfiRfp?.entidad || 'Oferta'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Nº contrato</label>
              <input value={form.numeroContrato} onChange={(e) => setForm({ ...form, numeroContrato: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Valor total (COP)</label>
              <input type="number" value={form.valorTotal} onChange={(e) => setForm({ ...form, valorTotal: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Fecha inicio</label>
              <input type="date" value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Fecha fin</label>
              <input type="date" value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white">Crear proyecto</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-4">
        {items.length === 0 && !loading && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
            Sin proyectos ganados aún.
          </div>
        )}
        {items.map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{p.bid?.opportunity?.entidad || p.bid?.rfiRfp?.entidad || 'Proyecto'}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {p.bid?.opportunity?.objeto || p.bid?.rfiRfp?.asunto || ''}
                  {p.numeroContrato && <span className="ml-2 text-xs text-slate-400">Contrato: {p.numeroContrato}</span>}
                </p>
              </div>
              <div className="text-right">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">{p.estado}</span>
                <p className="mt-1 text-sm font-bold text-slate-700">{fmtCOP(p.valorTotal)}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Hitos / Entregables ({p.milestones.length})</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-4">
                {p.milestones.map((m) => (
                  <div key={m.id} className="rounded-lg border border-slate-200 p-2 text-xs">
                    <p className="font-medium">{m.nombre}</p>
                    {m.fechaPrevista && <p className="text-slate-400">📅 {new Date(m.fechaPrevista).toLocaleDateString('es-CO')}</p>}
                    <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">{m.estado}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Documentos contractuales ({p.documents.length})</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {p.documents.map((d) => (
                  <span key={d.id} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{d.tipo}</span>
                ))}
                {p.documents.length === 0 && <span className="text-xs text-slate-400">Sin documentos</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
