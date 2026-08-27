'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<'secop' | 'ia' | 'usuarios' | 'api'>('secop');

  // Config SECOP
  const [sodaEndpoint, setSodaEndpoint] = useState('https://www.datos.gov.co/resource');
  const [datasetProcesos, setDatasetProcesos] = useState('p6dx-8zbt');
  const [datasetContratos, setDatasetContratos] = useState('jbjy-vk9h');
  const [datasetTienda, setDatasetTienda] = useState('rgxm-mmea');
  const [appToken, setAppToken] = useState('');
  const [appTokenSet, setAppTokenSet] = useState(false);
  const [unspscList, setUnspscList] = useState<string[]>([]);
  const [estados, setEstados] = useState('Abierto,Publicado');
  const [syncCron, setSyncCron] = useState('0 */6 * * *');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('prometeo_token');
    if (!token) return;
    fetch(`${API_URL}/api/config/secop`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.sodaEndpoint) setSodaEndpoint(d.sodaEndpoint);
        if (d.datasets?.procesos) setDatasetProcesos(d.datasets.procesos);
        if (d.datasets?.contratos) setDatasetContratos(d.datasets.contratos);
        if (d.datasets?.tiendaVirtual) setDatasetTienda(d.datasets.tiendaVirtual);
        setAppTokenSet(!!d.appTokenSet);
        if (d.filtros?.estados?.length) setEstados(d.filtros.estados.join(','));
        if (d.syncCron) setSyncCron(d.syncCron);
        if (d.unspsc?.length) setUnspscList(d.unspsc);
      })
      .catch(() => {});
  }, []);

  async function guardarSecop(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const token = localStorage.getItem('prometeo_token');
    try {
      const res = await fetch(`${API_URL}/api/config/secop`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          sodaEndpoint,
          datasets: { procesos: datasetProcesos, contratos: datasetContratos, tiendaVirtual: datasetTienda },
          appToken,
          filtros: { estados: estados.split(',').map((s) => s.trim()).filter(Boolean) },
          syncCron,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setMessage(`Error: ${d.message || 'no se pudo guardar'}`);
      } else {
        setMessage(d.message || 'Configuración guardada');
        setAppTokenSet(d.appTokenSet);
        setAppToken('');
      }
    } catch {
      setMessage('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Configuraciones</h1>
      <p className="mt-1 text-sm text-slate-500">
        Conectividad API externa, modelos de IA, usuarios y biblioteca documental.
      </p>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 border-b border-slate-200">
        {[
          { id: 'secop', label: 'API SECOP' },
          { id: 'ia', label: 'Modelos de IA' },
          { id: 'usuarios', label: 'Usuarios y Roles' },
          { id: 'api', label: 'API Propia' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium ${
              tab === t.id ? 'border-b-2 border-violet-600 text-violet-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab API SECOP */}
      {tab === 'secop' && (
        <form onSubmit={guardarSecop} className="mt-6 max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <h3 className="font-semibold">Conexión SECOP II (Datos Abiertos)</h3>
            <p className="mt-1 text-sm text-slate-500">
              Coloca aquí las direcciones que extraes de tu cuenta en Datos Abiertos Colombia
              (portal → conjunto de datos → Exportar → SODA API), tal como muestra el video guía.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Endpoint SODA</label>
            <input
              type="text"
              value={sodaEndpoint}
              onChange={(e) => setSodaEndpoint(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              placeholder="https://www.datos.gov.co/resource"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Dataset Procesos (SECOP II)</label>
              <input
                type="text"
                value={datasetProcesos}
                onChange={(e) => setDatasetProcesos(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Dataset Contratos</label>
              <input
                type="text"
                value={datasetContratos}
                onChange={(e) => setDatasetContratos(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Dataset Tienda Virtual</label>
              <input
                type="text"
                value={datasetTienda}
                onChange={(e) => setDatasetTienda(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              App Token (SODA){appTokenSet && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">✓ configurado</span>}
            </label>
            <input
              type="password"
              value={appToken}
              onChange={(e) => setAppToken(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              placeholder={appTokenSet ? '•••••••• (dejar vacío para conservar)' : 'Tu App Token de datos.gov.co'}
            />
            <p className="mt-1 text-xs text-slate-400">
              Se obtiene en tu cuenta de datos.gov.co → App Tokens. Requerido si el dataset es privado.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Estados del proceso a vigilar</label>
              <input
                type="text"
                value={estados}
                onChange={(e) => setEstados(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
                placeholder="Abierto,Publicado"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Frecuencia de sincronización (cron)</label>
              <input
                type="text"
                value={syncCron}
                onChange={(e) => setSyncCron(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Códigos UNSPSC activos ({unspscList.length})
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {unspscList.map((c) => (
                <span key={c} className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700">
                  {c}
                </span>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              La sincronización filtra las oportunidades por estos códigos (segmento).
            </p>
          </div>
          {message && (
            <div className="rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-800">{message}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-violet-700 px-5 py-2.5 font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar configuración SECOP'}
          </button>
        </form>
      )}

      {/* Placeholders de otros tabs */}
      {tab !== 'secop' && (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-400">
            Módulo en construcción. Disponible en una próxima fase de desarrollo.
          </p>
        </div>
      )}
    </div>
  );
}
