'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const FASES = [
  { id: 'borrador', label: 'Borrador', color: 'border-slate-300' },
  { id: 'analisis', label: 'Análisis Técnico', color: 'border-sky-400' },
  { id: 'documental', label: 'Generación Documental', color: 'border-violet-400' },
  { id: 'firma', label: 'Firma', color: 'border-amber-400' },
  { id: 'presentada', label: 'Presentada', color: 'border-emerald-400' },
];

interface Bid {
  id: string;
  faseFunnel: string;
  valorOfertado?: string;
  margenEstimado?: string;
  pWin?: string;
  opportunity?: { entidad?: string; objeto?: string } | null;
  rfiRfp?: { entidad?: string; asunto?: string } | null;
}

export default function OfertasPage() {
  const [items, setItems] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [opportunities, setOpportunities] = useState<any[]>([]);

  useEffect(() => {
    load();
    loadOpps();
  }, []);

  async function load() {
    const token = localStorage.getItem('prometeo_token');
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/bids`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setItems(d.items || []);
    } finally { setLoading(false); }
  }

  async function loadOpps() {
    const token = localStorage.getItem('prometeo_token');
    try {
      const r = await fetch(`${API_URL}/api/opportunities`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setOpportunities((d.items || []).filter((o: any) => o.estado === 'disponible' || o.estado === 'aplicada'));
    } catch {}
  }

  async function crear(opportunityId: string) {
    const token = localStorage.getItem('prometeo_token');
    const r = await fetch(`${API_URL}/api/bids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ opportunityId }),
    });
    const d = await r.json();
    setMessage(d.success ? 'Oferta creada en Borrador' : (d.error || 'Error'));
    load();
    loadOpps();
  }

  async function mover(id: string, fase: string) {
    const token = localStorage.getItem('prometeo_token');
    const r = await fetch(`${API_URL}/api/bids/${id}/fase`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, faseFunnel: fase }),
    });
    const d = await r.json();
    if (d.error) setMessage(d.error);
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
          <h1 className="text-2xl font-bold">Generador de Ofertas (Funnel)</h1>
          <p className="mt-1 text-sm text-slate-500">
            Embudo visual: Borrador → Análisis → Generación Documental → Firma → Presentada.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            onChange={(e) => e.target.value && crear(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value=""
          >
            <option value="">+ Crear oferta desde oportunidad</option>
            {opportunities.map((o) => (
              <option key={o.id} value={o.id}>{o.entidad} — {fmtCOP(o.cuantiaCop)}</option>
            ))}
          </select>
        </div>
      </div>

      {message && <div className="mt-4 rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-800">{message}</div>}

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        {FASES.map((fase) => {
          const ofertas = items.filter((b) => b.faseFunnel === fase.id);
          return (
            <div key={fase.id} className={`rounded-xl border-t-4 bg-white ${fase.color} p-3`}>
              <h3 className="px-1 text-sm font-semibold text-slate-700">
                {fase.label} <span className="text-xs text-slate-400">({ofertas.length})</span>
              </h3>
              <div className="mt-2 space-y-2">
                {ofertas.map((b) => (
                  <div key={b.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs font-medium text-slate-700">
                      {b.opportunity?.entidad || b.rfiRfp?.entidad || 'Oferta'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">
                      {b.opportunity?.objeto || b.rfiRfp?.asunto || ''}
                    </p>
                    {b.pWin && <p className="mt-1 text-xs font-bold text-violet-700">P_win {b.pWin}%</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-slate-500">{fmtCOP(b.valorOfertado)}</span>
                      {fase.id !== 'presentada' && (
                        <button
                          onClick={() => mover(b.id, FASES[FASES.findIndex((f) => f.id === fase.id) + 1].id)}
                          className="rounded bg-violet-100 px-2 py-1 text-[11px] font-semibold text-violet-700 hover:bg-violet-200"
                        >
                          → Siguiente
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {ofertas.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400">
                    Vacío
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
