'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface RfiRfp {
  id: string;
  entidad: string;
  emailOrigen?: string;
  asunto: string;
  descripcion?: string;
  fechaRecibido: string;
  fechaLimite?: string;
  estado: string;
  motivoRechazo?: string;
}

export default function InvitacionesPage() {
  const [items, setItems] = useState<RfiRfp[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ entidad: '', emailOrigen: '', asunto: '', descripcion: '', fechaLimite: '' });
  const [rechazando, setRechazando] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('Capacidad operativa actual');

  useEffect(() => { load(); }, []);

  async function load() {
    const token = localStorage.getItem('prometeo_token');
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/rfi-rfp`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setItems(d.items || []);
    } finally { setLoading(false); }
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('prometeo_token');
    const r = await fetch(`${API_URL}/api/rfi-rfp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    if (d.success) {
      setShowForm(false);
      setForm({ entidad: '', emailOrigen: '', asunto: '', descripcion: '', fechaLimite: '' });
      load();
    } else setMessage(d.message || 'Error al crear');
  }

  async function aplicar(id: string) {
    const token = localStorage.getItem('prometeo_token');
    const r = await fetch(`${API_URL}/api/rfi-rfp/${id}/aplicar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    const d = await r.json();
    setMessage(d.message || (d.error || 'Error'));
    load();
  }

  async function rechazar(id: string) {
    const token = localStorage.getItem('prometeo_token');
    const r = await fetch(`${API_URL}/api/rfi-rfp/${id}/rechazar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, motivoRechazo: motivo }),
    });
    const d = await r.json();
    setMessage(d.message || (d.error || 'Error'));
    setRechazando(null);
    load();
  }

  const estadoBadge = (e: string) => {
    const colors: Record<string, string> = {
      recibida: 'bg-amber-100 text-amber-700',
      aplicada: 'bg-sky-100 text-sky-700',
      rechazada: 'bg-red-100 text-red-700',
      cotizada: 'bg-emerald-100 text-emerald-700',
    };
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[e] || 'bg-slate-100 text-slate-600'}`}>{e}</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invitaciones RFI/RFP</h1>
          <p className="mt-1 text-sm text-slate-500">
            Solicitudes directas de cotización de entidades y empresas privadas (ingesta por correo / manual).
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800">
          + Registrar invitación
        </button>
      </div>

      {message && <div className="mt-4 rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-800">{message}</div>}

      {showForm && (
        <form onSubmit={crear} className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold">Nueva invitación RFI/RFP</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Entidad / Empresa</label>
              <input value={form.entidad} onChange={(e) => setForm({ ...form, entidad: e.target.value })} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email origen</label>
              <input value={form.emailOrigen} onChange={(e) => setForm({ ...form, emailOrigen: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Asunto</label>
              <input value={form.asunto} onChange={(e) => setForm({ ...form, asunto: e.target.value })} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Fecha límite</label>
              <input type="date" value={form.fechaLimite} onChange={(e) => setForm({ ...form, fechaLimite: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white">Guardar</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {items.length === 0 && !loading && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
            Sin invitaciones. Registra la primera.
          </div>
        )}
        {items.map((r) => (
          <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{r.entidad}</h3>
                <p className="mt-1 text-sm text-slate-600">{r.asunto}</p>
                {r.descripcion && <p className="mt-1 text-sm text-slate-500">{r.descripcion}</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                {estadoBadge(r.estado)}
                <span className="text-xs text-slate-400">
                  {new Date(r.fechaRecibido).toLocaleDateString('es-CO')}
                </span>
              </div>
            </div>
            {r.motivoRechazo && (
              <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Motivo rechazo: {r.motivoRechazo}
              </p>
            )}
            {(r.estado === 'recibida') && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => aplicar(r.id)} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700">
                  Aplicar → costeo
                </button>
                <button onClick={() => setRechazando(r.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                  Rechazar con elegancia
                </button>
              </div>
            )}
            {rechazando === r.id && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <label className="block text-sm font-medium text-red-700">Motivo de rechazo</label>
                <input value={motivo} onChange={(e) => setMotivo(e.target.value)} className="mt-1 w-full rounded-lg border border-red-300 px-3 py-2 text-sm" />
                <div className="mt-2 flex gap-2">
                  <button onClick={() => rechazar(r.id)} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">Confirmar rechazo</button>
                  <button onClick={() => setRechazando(null)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs">Cancelar</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
