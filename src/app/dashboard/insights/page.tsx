'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function InsightsPage() {
  const [tab, setTab] = useState<'bi' | 'fechas' | 'competencia' | 'uniones' | 'adendas' | 'copilot' | 'perfiles' | 'notif'>('bi');

  const [bi, setBi] = useState<any>(null);
  const [fechas, setFechas] = useState<any>(null);
  const [competencia, setCompetencia] = useState<any>(null);
  const [uniones, setUniones] = useState<any>(null);
  const [adendas, setAdendas] = useState<any>(null);
  const [perfiles, setPerfiles] = useState<any[]>([]);
  const [notif, setNotif] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // formularios
  const [compEntidad, setCompEntidad] = useState('');
  const [unionCuantia, setUnionCuantia] = useState('');
  const [unionCapacidad, setUnionCapacidad] = useState('70');
  const [perfilForm, setPerfilForm] = useState({ nombre: '', palabrasClave: '', unspsc: '', departamento: '', modalidad: '' });
  const [copilotPregunta, setCopilotPregunta] = useState('');
  const [copilotRespuesta, setCopilotRespuesta] = useState<any>(null);

  const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('prometeo_token')}` });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [b, f, a, p, n] = await Promise.all([
        fetch(`${API_URL}/api/insights/bi`, { headers: auth() }).then((r) => r.json()),
        fetch(`${API_URL}/api/insights/fechas-clave`, { headers: auth() }).then((r) => r.json()),
        fetch(`${API_URL}/api/adendas`, { headers: auth() }).then((r) => r.json()),
        fetch(`${API_URL}/api/search-profiles`, { headers: auth() }).then((r) => r.json()),
        fetch(`${API_URL}/api/notifications`, { headers: auth() }).then((r) => r.json()),
      ]);
      setBi(b);
      setFechas(f);
      setAdendas(a);
      setPerfiles(p.items || []);
      setNotif(n || []);
    } catch (e) {
      setMessage('Error cargando insights');
    } finally {
      setLoading(false);
    }
  }

  async function consultarCompetencia(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const r = await fetch(`${API_URL}/api/insights/competencia?entidad=${encodeURIComponent(compEntidad)}`, { headers: auth() });
      setCompetencia(await r.json());
    } catch { setMessage('Error consultando competencia'); }
    finally { setLoading(false); }
  }

  async function consultarUnion(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const r = await fetch(`${API_URL}/api/insights/uniones-temporales`, {
        method: 'POST',
        headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuantiaCop: Number(unionCuantia), capacidad: Number(unionCapacidad) }),
      });
      setUniones(await r.json());
    } catch { setMessage('Error'); }
    finally { setLoading(false); }
  }

  async function crearPerfil(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    try {
      const r = await fetch(`${API_URL}/api/search-profiles`, {
        method: 'POST',
        headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: perfilForm.nombre,
          palabrasClave: perfilForm.palabrasClave,
          unspsc: perfilForm.unspsc ? perfilForm.unspsc.split(',').map((s) => s.trim()) : undefined,
          departamento: perfilForm.departamento,
          modalidad: perfilForm.modalidad,
        }),
      });
      const d = await r.json();
      if (d.error) setMessage(d.error);
      else { setMessage('Perfil creado'); setPerfilForm({ nombre: '', palabrasClave: '', unspsc: '', departamento: '', modalidad: '' }); }
      const pr = await fetch(`${API_URL}/api/search-profiles`, { headers: auth() });
      setPerfiles((await pr.json()).items || []);
    } catch { setMessage('Error creando perfil'); }
  }

  async function chatCopilot(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setCopilotRespuesta(null);
    try {
      const r = await fetch(`${API_URL}/api/pliegos/chat`, {
        method: 'POST',
        headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: copilotPregunta }),
      });
      setCopilotRespuesta(await r.json());
    } catch { setMessage('Error en Copilot'); }
  }

  async function generarDiaria() {
    setMessage('');
    try {
      const r = await fetch(`${API_URL}/api/notifications/diaria`, {
        method: 'POST', headers: { ...auth(), 'Content-Type': 'application/json' },
      });
      const d = await r.json();
      setMessage(`Resumen diario generado: ${d.oportunidades} oportunidades relevantes`);
      const n = await fetch(`${API_URL}/api/notifications`, { headers: auth() });
      setNotif((await n.json()) || []);
    } catch { setMessage('Error generando resumen'); }
  }

  const fmtCOP = (v: any) => v == null ? '—' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v));

  return (
    <div>
      <h1 className="text-2xl font-bold">Insights & BI</h1>
      <p className="mt-1 text-sm text-slate-500">
        Inteligencia competitiva, fechas clave, Copilot RAG, perfiles de búsqueda y analítica ejecutiva.
      </p>

      {message && <div className="mt-4 rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-800">{message}</div>}

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200">
        {[
          { id: 'bi', label: '📊 BI Ejecutivo' },
          { id: 'fechas', label: '📅 Fechas Clave' },
          { id: 'competencia', label: '🕵️ Competencia' },
          { id: 'uniones', label: '🤝 Uniones' },
          { id: 'copilot', label: '💬 Copilot' },
          { id: 'perfiles', label: '🎯 Perfiles' },
          { id: 'adendas', label: '🔔 Adendas' },
          { id: 'notif', label: '📬 Notificaciones' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`rounded-t-lg px-3 py-2 text-sm font-medium ${
              tab === t.id ? 'border-b-2 border-violet-600 text-violet-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* BI Ejecutivo */}
      {tab === 'bi' && bi && (
        <div className="mt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Pipeline (valor total)</p>
              <p className="mt-1 text-2xl font-bold text-violet-700">{fmtCOP(bi.pipeline?.valorTotal)}</p>
              <p className="text-xs text-slate-400">{bi.pipeline?.oportunidades} oportunidades disponibles</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Win-rate</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{bi.winRate}%</p>
              <p className="text-xs text-slate-400">{bi.proyectosGanados} ganadas / {bi.funnel?.presentadas || 0} presentadas</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Margen real</p>
              <p className="mt-1 text-2xl font-bold text-sky-600">{fmtCOP(bi.rentabilidad?.margen)}</p>
              <p className="text-xs text-slate-400">Ingresos {fmtCOP(bi.rentabilidad?.ingresos)}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Funnel de ofertas</p>
              <div className="mt-2 space-y-1 text-sm">
                <p>📝 Borrador: <b>{bi.funnel?.borrador}</b></p>
                <p>🧠 Análisis: <b>{bi.funnel?.analisis}</b></p>
                <p>📄 Documental: <b>{bi.funnel?.documental}</b></p>
                <p>✍️ Firma: <b>{bi.funnel?.firma}</b></p>
                <p>🚀 Presentadas: <b>{bi.funnel?.presentadas}</b></p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Decisiones Go/No-Go</p>
              <div className="mt-2 space-y-1 text-sm">
                <p>✅ GO: <b className="text-emerald-600">{bi.analisis?.go}</b></p>
                <p>❌ NO-GO: <b className="text-red-600">{bi.analisis?.nogo}</b></p>
                <p>🎯 P_win promedio: <b>{bi.analisis?.pWinPromedio}%</b></p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Operación</p>
              <div className="mt-2 space-y-1 text-sm">
                <p>✉️ RFI/RFP recibidas: <b>{bi.rfiRecibidas}</b></p>
                <p>🏆 Proyectos ganados: <b>{bi.proyectosGanados}</b></p>
                <p>💰 Egresos: {fmtCOP(bi.rentabilidad?.egresos)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fechas Clave */}
      {tab === 'fechas' && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Procesos con cierre en los próximos 30 días.</p>
            {fechas?.proximas24h > 0 && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                ⚠️ {fechas.proximas24h} cierran en 24h
              </span>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {(fechas?.items || []).length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
                Sin procesos con cierre próximo.
              </div>
            )}
            {(fechas?.items || []).map((o: any) => (
              <div key={o.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                <div>
                  <p className="font-medium">{o.entidad}</p>
                  <p className="text-sm text-slate-500 truncate max-w-md">{o.objeto}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">
                    📅 {o.fechaCierre ? new Date(o.fechaCierre).toLocaleDateString('es-CO') : 'N/A'}
                  </p>
                  <p className="text-xs text-slate-400">{fmtCOP(o.cuantiaCop)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competencia */}
      {tab === 'competencia' && (
        <div className="mt-6">
          <form onSubmit={consultarCompetencia} className="flex gap-2 rounded-xl border border-slate-200 bg-white p-4">
            <input
              value={compEntidad}
              onChange={(e) => setCompEntidad(e.target.value)}
              placeholder="Entidad compradora (ej. DANE, ICBF...)"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button type="submit" disabled={loading} className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {loading ? 'Consultando...' : 'Analizar competencia'}
            </button>
          </form>
          {competencia && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">
                {competencia.total} contratos · {competencia.entidad}
              </p>
              <table className="mt-3 w-full text-sm">
                <thead className="border-b text-xs uppercase text-slate-500">
                  <tr><th className="py-2 text-left">Proveedor</th><th className="text-right">Contratos</th><th className="text-right">Total</th><th className="text-right">Promedio</th></tr>
                </thead>
                <tbody>
                  {(competencia.competidores || []).map((c: any) => (
                    <tr key={c.proveedor} className="border-b last:border-0">
                      <td className="py-2 font-medium">{c.proveedor}</td>
                      <td className="text-right">{c.contratos}</td>
                      <td className="text-right">{fmtCOP(c.totalAdjudicado)}</td>
                      <td className="text-right">{fmtCOP(c.promedio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!competencia.competidores || competencia.competidores.length === 0) && (
                <p className="mt-3 text-sm text-slate-400">Sin datos. Intenta con otra entidad.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Uniones temporales */}
      {tab === 'uniones' && (
        <div className="mt-6">
          <form onSubmit={consultarUnion} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-500">Cuantía del proceso (COP)</label>
              <input type="number" value={unionCuantia} onChange={(e) => setUnionCuantia(e.target.value)} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Capacidad operativa actual (0-100)</label>
              <input type="number" value={unionCapacidad} onChange={(e) => setUnionCapacidad(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={loading} className="w-full rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Evaluar unión temporal
              </button>
            </div>
          </form>
          {uniones && (
            <div className={`mt-4 rounded-xl border p-5 ${uniones.sugerida ? 'border-amber-300 bg-amber-50' : 'border-emerald-300 bg-emerald-50'}`}>
              <p className="font-semibold">{uniones.message}</p>
              {uniones.sugerida && (
                <div className="mt-3">
                  <p className="text-sm text-slate-600">
                    Cubres el <b>{uniones.porcentajeCubierto}%</b>; falta <b>{uniones.porcentajeFaltante}%</b>.
                  </p>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
                    {(uniones.estrategias || []).map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                  {uniones.finanzasCumplen && <p className="mt-2 text-xs text-slate-500">Finanzas: {String(uniones.finanzasCumplen)}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Copilot RAG */}
      {tab === 'copilot' && (
        <div className="mt-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold">💬 Copilot de pliegos</h3>
            <p className="mt-1 text-sm text-slate-500">
              Pregunta sobre los pliegos indexados de tus procesos. Ej: "¿Qué experiencia técnica exigen?", "¿Cuál es el objeto?".
            </p>
            <form onSubmit={chatCopilot} className="mt-4 flex gap-2">
              <input
                value={copilotPregunta}
                onChange={(e) => setCopilotPregunta(e.target.value)}
                placeholder="Escribe tu pregunta sobre el pliego..."
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white">Preguntar</button>
            </form>
            {copilotRespuesta && (
              <div className="mt-4 rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">{copilotRespuesta.respuesta}</p>
                <p className="mt-1 text-xs text-slate-500">{copilotRespuesta.documentosIndexados} documentos indexados</p>
                {(copilotRespuesta.fuentes || []).map((f: any, i: number) => (
                  <div key={i} className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs font-bold text-violet-700">{f.fuente} · relevancia {f.score}%</p>
                    <p className="mt-1 text-xs text-slate-600">{f.texto}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Perfiles de búsqueda */}
      {tab === 'perfiles' && (
        <div className="mt-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold">🎯 Perfiles de búsqueda</h3>
            <p className="mt-1 text-sm text-slate-500">Hasta 3 perfiles por empresa según líneas de negocio (benchmark Alicia).</p>
            <form onSubmit={crearPerfil} className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-500">Nombre del perfil</label>
                <input value={perfilForm.nombre} onChange={(e) => setPerfilForm({ ...perfilForm, nombre: e.target.value })} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Línea SG-SST" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">Palabras clave (separadas por coma)</label>
                <input value={perfilForm.palabrasClave} onChange={(e) => setPerfilForm({ ...perfilForm, palabrasClave: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="seguridad industrial, SST, salud ocupacional" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">UNSPSC (separados por coma)</label>
                <input value={perfilForm.unspsc} onChange={(e) => setPerfilForm({ ...perfilForm, unspsc: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="93141808, 80101601" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">Departamento</label>
                <input value={perfilForm.departamento} onChange={(e) => setPerfilForm({ ...perfilForm, departamento: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Bogotá D.C." />
              </div>
              <button type="submit" className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white">Crear perfil</button>
            </form>
          </div>
          <div className="mt-4 space-y-2">
            {perfiles.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                <div>
                  <p className="font-medium">{p.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {p.palabrasClave && <>🔑 {p.palabrasClave.slice(0, 80)}</>}
                    {p.unspsc && <> · 📦 {Array.isArray(p.unspsc) ? p.unspsc.join(',') : ''}</>}
                    {p.departamento && <> · 📍 {p.departamento}</>}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {p.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            ))}
            {perfiles.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400">
                Sin perfiles. Crea el primero para filtrar mejor tus oportunidades.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Adendas */}
      {tab === 'adendas' && (
        <div className="mt-6">
          <p className="text-sm text-slate-500">
            Alertas de cambios en procesos seguidos (monitor cada 30 min para evitar descalificaciones).
          </p>
          <div className="mt-4 space-y-2">
            {(adendas?.items || []).length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
                Sin alertas de adenda. El monitor está activo.
              </div>
            )}
            {(adendas?.items || []).map((a: any) => (
              <div key={a.id} className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">⚠️ Cambio detectado en proceso {a.procesoId}</p>
                {a.cambioDetectado?.fecha && (
                  <p className="mt-1 text-xs text-amber-700">📅 Fecha: {a.cambioDetectado.fecha.anterior} → {a.cambioDetectado.fecha.actual}</p>
                )}
                {a.cambioDetectado?.estado && (
                  <p className="text-xs text-amber-700">🔄 Estado: {a.cambioDetectado.estado.anterior} → {a.cambioDetectado.estado.actual}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notificaciones */}
      {tab === 'notif' && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Resúmenes diarios de oportunidades por perfil (correo).</p>
            <button onClick={generarDiaria} className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white">📬 Generar resumen diario</button>
          </div>
          <div className="mt-4 space-y-2">
            {notif.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
                Sin notificaciones generadas.
              </div>
            )}
            {notif.map((n) => (
              <div key={n.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{n.asunto}</p>
                  <span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleDateString('es-CO')}</span>
                </div>
                {n.contenido && <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{n.contenido.slice(0, 300)}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
