'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const ROLES = [
  { id: 'admin', label: 'Administrador', desc: 'Acceso total' },
  { id: 'evaluador_tecnico', label: 'Evaluador Técnico', desc: 'Analiza requisitos técnicos' },
  { id: 'evaluador_financiero', label: 'Evaluador Financiero', desc: 'Valida indicadores financieros' },
  { id: 'operador_proyecto', label: 'Operador de Proyecto', desc: 'Gestiona proyectos ganados' },
  { id: 'auditor', label: 'Auditor', desc: 'Solo lectura y auditoría' },
];

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<'empresa' | 'secop' | 'ia' | 'usuarios' | 'api'>('empresa');

  // ===== TAB EMPRESA =====
  const [empresa, setEmpresa] = useState<any>(null);
  const [empresaForm, setEmpresaForm] = useState<any>({});
  const [empresaMsg, setEmpresaMsg] = useState('');

  // ===== TAB API SECOP =====
  const [sodaEndpoint, setSodaEndpoint] = useState('https://www.datos.gov.co/resource');
  const [datasetProcesos, setDatasetProcesos] = useState('p6dx-8zbt');
  const [datasetContratos, setDatasetContratos] = useState('jbjy-vk9h');
  const [datasetTienda, setDatasetTienda] = useState('rgxm-mmea');
  const [appToken, setAppToken] = useState('');
  const [appTokenSet, setAppTokenSet] = useState(false);
  const [secopMsg, setSecopMsg] = useState('');
  // Áreas de interés (perfiles) + UNSPSC
  const [areas, setAreas] = useState<any[]>([]);
  const [unspscSeleccionados, setUnspscSeleccionados] = useState<string[]>([]);
  // Tabla de datos abiertos (investigación SECOP II)
  const [tablaDatos, setTablaDatos] = useState<any[]>([]);
  const [tablaLoading, setTablaLoading] = useState(false);
  const [tablaEntidad, setTablaEntidad] = useState('');
  const [tablaCuantia, setTablaCuantia] = useState('');

  // ===== TAB MODELOS DE IA =====
  const [iaProvider, setIaProvider] = useState('openrouter');
  const [openrouterModel, setOpenrouterModel] = useState('default');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [openrouterKeySet, setOpenrouterKeySet] = useState(false);
  const [geminiKeySet, setGeminiKeySet] = useState(false);
  const [iaMsg, setIaMsg] = useState('');
  const [iaLoading, setIaLoading] = useState(false);

  // ===== TAB USUARIOS Y ROLES =====
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [usuariosMsg, setUsuariosMsg] = useState('');
  const [userForm, setUserForm] = useState({ nombre: '', email: '', rol: 'evaluador_tecnico', password: '' });

  // ===== TAB API PROPIA =====
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [apiMsg, setApiMsg] = useState('');
  const [apiKeyName, setApiKeyName] = useState('');
  const [nuevaApiKey, setNuevaApiKey] = useState<string | null>(null);

  const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('prometeo_token')}` });

  useEffect(() => {
    loadEmpresa();
    loadSecop();
    loadIa();
    loadUsuarios();
    loadApiKeys();
  }, []);

  // ===== CARGAS =====
  async function loadEmpresa() {
    try {
      const r = await fetch(`${API_URL}/api/config/empresa`, { headers: auth() });
      const d = await r.json();
      setEmpresa(d);
      setEmpresaForm(d);
    } catch {}
  }
  async function loadSecop() {
    try {
      const [r, a] = await Promise.all([
        fetch(`${API_URL}/api/config/secop`, { headers: auth() }),
        fetch(`${API_URL}/api/search-profiles`, { headers: auth() }),
      ]);
      const d = await r.json();
      setSodaEndpoint(d.sodaEndpoint || 'https://www.datos.gov.co/resource');
      setDatasetProcesos(d.datasets?.procesos || 'p6dx-8zbt');
      setDatasetContratos(d.datasets?.contratos || 'jbjy-vk9h');
      setDatasetTienda(d.datasets?.tiendaVirtual || 'rgxm-mmea');
      setAppTokenSet(!!d.appTokenSet);
      setUnspscSeleccionados(d.unspscSeleccionados || []);
      const areasData = await a.json();
      setAreas(areasData.items || []);
    } catch {}
  }
  async function loadIa() {
    try {
      const r = await fetch(`${API_URL}/api/config/ia`, { headers: auth() });
      const d = await r.json();
      setIaProvider(d.defaultProvider || 'openrouter');
      setOpenrouterModel(d.openrouterModel || 'default');
      setGeminiModel(d.geminiModel || 'gemini-2.5-flash');
      setOpenrouterKeySet(!!d.openrouterApiKeySet);
      setGeminiKeySet(!!d.geminiApiKeySet);
    } catch {}
  }
  async function loadUsuarios() {
    try {
      const r = await fetch(`${API_URL}/api/config/users`, { headers: auth() });
      const d = await r.json();
      setUsuarios(d.items || []);
    } catch {}
  }
  async function loadApiKeys() {
    try {
      const r = await fetch(`${API_URL}/api/config/api-keys`, { headers: auth() });
      const d = await r.json();
      setApiKeys(d.items || []);
    } catch {}
  }

  // ===== ACCIONES =====
  async function guardarEmpresa(e: React.FormEvent) {
    e.preventDefault();
    setEmpresaMsg('');
    try {
      const r = await fetch(`${API_URL}/api/config/empresa`, {
        method: 'PUT', headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify(empresaForm),
      });
      const d = await r.json();
      setEmpresaMsg(d.message || (d.error || 'Guardado'));
    } catch { setEmpresaMsg('Error guardando empresa'); }
  }

  async function guardarSecop(e: React.FormEvent) {
    e.preventDefault();
    setSecopMsg('');
    try {
      const r = await fetch(`${API_URL}/api/config/secop`, {
        method: 'PUT', headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sodaEndpoint, datasets: { procesos: datasetProcesos, contratos: datasetContratos, tiendaVirtual: datasetTienda },
          appToken, filtros: { unspsc: unspscSeleccionados },
        }),
      });
      const d = await r.json();
      setSecopMsg(d.message || 'Guardado');
      setAppTokenSet(!!d.appTokenSet);
      setAppToken('');
    } catch { setSecopMsg('Error guardando SECOP'); }
  }

  async function consultarTabla(e: React.FormEvent) {
    e.preventDefault();
    setTablaLoading(true);
    try {
      let url = `${sodaEndpoint}/${datasetProcesos}.json?$limit=50&$order=precio_base DESC`;
      if (tablaEntidad) url += `&$where=lower(entidad) like '%${tablaEntidad.toLowerCase()}%'`;
      const r = await fetch(url);
      const d = await r.json();
      setTablaDatos(Array.isArray(d) ? d : []);
    } catch { setTablaDatos([]); }
    finally { setTablaLoading(false); }
  }

  async function guardarIa(e: React.FormEvent) {
    e.preventDefault();
    setIaMsg(''); setIaLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/config/ia`, {
        method: 'PUT', headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultProvider: iaProvider, openrouterModel, geminiModel,
          openrouterApiKey: openrouterKey, geminiApiKey: geminiKey,
        }),
      });
      const d = await r.json();
      setIaMsg(d.message || 'Guardado');
      setOpenrouterKey(''); setGeminiKey('');
      loadIa();
    } catch { setIaMsg('Error guardando IA'); }
    finally { setIaLoading(false); }
  }

  async function crearUsuario(e: React.FormEvent) {
    e.preventDefault();
    setUsuariosMsg('');
    try {
      const r = await fetch(`${API_URL}/api/config/users`, {
        method: 'POST', headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });
      const d = await r.json();
      if (d.error) setUsuariosMsg(d.error);
      else { setUsuariosMsg('Usuario creado'); setUserForm({ nombre: '', email: '', rol: 'evaluador_tecnico', password: '' }); }
      loadUsuarios();
    } catch { setUsuariosMsg('Error creando usuario'); }
  }

  async function toggleUsuario(u: any) {
    try {
      await fetch(`${API_URL}/api/config/users/${u.id}`, {
        method: 'PUT', headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id, isActive: !u.isActive }),
      });
      loadUsuarios();
    } catch {}
  }

  async function crearApiKey(e: React.FormEvent) {
    e.preventDefault();
    setApiMsg(''); setNuevaApiKey(null);
    try {
      const r = await fetch(`${API_URL}/api/config/api-keys`, {
        method: 'POST', headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: apiKeyName }),
      });
      const d = await r.json();
      if (d.error) setApiMsg(d.error);
      else { setNuevaApiKey(d.apiKey); setApiMsg(d.message); setApiKeyName(''); }
      loadApiKeys();
    } catch { setApiMsg('Error creando clave'); }
  }

  async function revocarApiKey(k: any) {
    try {
      await fetch(`${API_URL}/api/config/api-keys/${k.id}`, {
        method: 'DELETE', headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: k.id }),
      });
      loadApiKeys();
    } catch {}
  }

  const fmtCOP = (v: any) => v == null ? '—' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v));

  return (
    <div>
      <h1 className="text-2xl font-bold">Configuraciones</h1>
      <p className="mt-1 text-sm text-slate-500">Configuración de empresa, SECOP, IA, usuarios y API de tu organización.</p>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-slate-200">
        {[
          { id: 'empresa', label: '🏢 Empresa' },
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

      {/* ===== TAB EMPRESA ===== */}
      {tab === 'empresa' && (
        <form onSubmit={guardarEmpresa} className="mt-6 max-w-3xl space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold">🏢 Datos de la empresa</h3>
          <p className="text-sm text-slate-500">Información principal de tu organización (espejo de la registrada en SECOP).</p>
          {empresaMsg && <div className="rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-800">{empresaMsg}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Nombre comercial</label>
              <input value={empresaForm.nombreComercial || ''} onChange={(e) => setEmpresaForm({ ...empresaForm, nombreComercial: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">NIT</label>
              <input value={empresaForm.nit || ''} onChange={(e) => setEmpresaForm({ ...empresaForm, nit: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Sector / Actividad económica</label>
              <input value={empresaForm.sector || ''} onChange={(e) => setEmpresaForm({ ...empresaForm, sector: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none" placeholder="Ej: Servicios de TI, Consultoría..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Representante legal</label>
              <input value={empresaForm.representanteLegal || ''} onChange={(e) => setEmpresaForm({ ...empresaForm, representanteLegal: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Dirección</label>
              <input value={empresaForm.direccion || ''} onChange={(e) => setEmpresaForm({ ...empresaForm, direccion: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Ciudad</label>
              <input value={empresaForm.ciudad || ''} onChange={(e) => setEmpresaForm({ ...empresaForm, ciudad: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Teléfono</label>
              <input value={empresaForm.telefono || ''} onChange={(e) => setEmpresaForm({ ...empresaForm, telefono: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Correo de contacto</label>
              <input value={empresaForm.correoContacto || ''} onChange={(e) => setEmpresaForm({ ...empresaForm, correoContacto: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Sitio web</label>
              <input value={empresaForm.web || ''} onChange={(e) => setEmpresaForm({ ...empresaForm, web: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Descripción</label>
              <textarea value={empresaForm.descripcion || ''} onChange={(e) => setEmpresaForm({ ...empresaForm, descripcion: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none" />
            </div>
          </div>
          <button type="submit" className="rounded-lg bg-violet-700 px-6 py-2.5 font-semibold text-white hover:bg-violet-800">💾 Guardar datos de la empresa</button>
        </form>
      )}

      {/* ===== TAB API SECOP ===== */}
      {tab === 'secop' && (
        <div className="mt-6 space-y-6">
          {/* Configuración de conexión */}
          <form onSubmit={guardarSecop} className="max-w-3xl space-y-4 rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold">🔌 Conexión API SECOP</h3>
            <p className="text-sm text-slate-500">Coloca aquí las direcciones (endpoint + datasets) y el App Token que extraes de tu cuenta en Datos Abiertos Colombia.</p>
            {secopMsg && <div className="rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-800">{secopMsg}</div>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Endpoint SODA</label>
                <input value={sodaEndpoint} onChange={(e) => setSodaEndpoint(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Dataset Procesos</label>
                <input value={datasetProcesos} onChange={(e) => setDatasetProcesos(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none" placeholder="p6dx-8zbt" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Dataset Contratos</label>
                <input value={datasetContratos} onChange={(e) => setDatasetContratos(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none" placeholder="jbjy-vk9h" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Dataset Tienda Virtual</label>
                <input value={datasetTienda} onChange={(e) => setDatasetTienda(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none" placeholder="rgxm-mmea" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  App Token {appTokenSet && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">CONFIGURADO ✓</span>}
                </label>
                <input type="password" value={appToken} onChange={(e) => setAppToken(e.target.value)} placeholder={appTokenSet ? 'Dejar vacío para conservar' : 'App Token de datos.gov.co'} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none" />
              </div>
            </div>
            <button type="submit" className="rounded-lg bg-violet-700 px-6 py-2.5 font-semibold text-white hover:bg-violet-800">💾 Guardar conexión</button>
          </form>

          {/* Selector UNSPSC desde áreas de interés + tabla de datos abiertos */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold">🎯 Códigos UNSPSC activos (desde tus Áreas de Interés)</h3>
            <p className="mt-1 text-sm text-slate-500">
              Estos son los códigos UNSPSC que definiste en <b>Configuración → Áreas de Interés</b>. Selecciona cuáles usar
              como filtro espejo en el tablero de oportunidades.
            </p>

            {/* Selector de códigos */}
            {areas.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
                No hay áreas de interés definidas. Ve a <b>Configuración → Áreas de Interés</b> para crearlas con sus códigos UNSPSC.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {areas.map((a) => (
                  <div key={a.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-semibold">{a.nombre} <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${a.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{a.isActive ? 'ACTIVO' : 'INACTIVO'}</span></p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(a.unspsc || []).map((c: string) => {
                        const selected = unspscSeleccionados.includes(c);
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setUnspscSeleccionados((prev) => selected ? prev.filter((x) => x !== c) : [...prev, c])}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${selected ? 'bg-violet-700 text-white' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}
                          >
                            {c} {selected && '✓'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {unspscSeleccionados.length > 0 && (
                  <p className="text-xs text-slate-500">Seleccionados: <b className="text-violet-700">{unspscSeleccionados.join(', ')}</b> — guarda la conexión para aplicar el filtro.</p>
                )}
              </div>
            )}
          </div>

          {/* Tabla de Datos Abiertos (investigación SECOP II) */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold">📊 Tabla de procesos SECOP II (Datos Abiertos)</h3>
            <p className="mt-1 text-sm text-slate-500">Consulta en vivo el dataset SECOP II - Procesos de Contratación (Datos Abiertos Colombia) y aplica filtros.</p>
            <form onSubmit={consultarTabla} className="mt-4 flex flex-wrap gap-2">
              <input value={tablaEntidad} onChange={(e) => setTablaEntidad(e.target.value)} placeholder="Filtrar por entidad..." className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none min-w-[200px]" />
              <button type="submit" disabled={tablaLoading} className="rounded-lg bg-violet-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {tablaLoading ? 'Consultando...' : '🔍 Consultar tabla'}
              </button>
            </form>
            {tablaDatos.length > 0 && (
              <div className="mt-4 max-h-96 overflow-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-left uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Entidad</th>
                      <th className="px-3 py-2">Objeto</th>
                      <th className="px-3 py-2 text-right">Precio base</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Modalidad</th>
                      <th className="px-3 py-2">UNSPSC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tablaDatos.map((p: any, i: number) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{p.entidad}</td>
                        <td className="px-3 py-2 max-w-[220px] truncate" title={p.descripci_n_del_procedimiento || p.nombre_del_procedimiento}>{p.descripci_n_del_procedimiento || p.nombre_del_procedimiento}</td>
                        <td className="px-3 py-2 text-right">{fmtCOP(p.precio_base)}</td>
                        <td className="px-3 py-2">{p.estado_del_procedimiento}</td>
                        <td className="px-3 py-2">{p.modalidad_de_contratacion}</td>
                        <td className="px-3 py-2">{p.codigo_principal_de_categoria}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== TAB MODELOS DE IA ===== */}
      {tab === 'ia' && (
        <form onSubmit={guardarIa} className="mt-6 max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold">🧠 Modelos de Inteligencia Artificial</h3>
          <p className="text-sm text-slate-500">Conecta tu proveedor de IA (OpenRouter, Gemini) para el análisis de pliegos, Drafter y Copilot.</p>
          {iaMsg && <div className="rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-800">{iaMsg}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700">Proveedor por defecto</label>
            <select value={iaProvider} onChange={(e) => setIaProvider(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none">
              <option value="openrouter">OpenRouter</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Modelo OpenRouter</label>
            <select value={openrouterModel} onChange={(e) => setOpenrouterModel(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none">
              <option value="default">✨ Usar modelo por defecto</option>
              <option value="deepseek/deepseek-chat">DeepSeek Chat</option>
              <option value="deepseek/deepseek-v3">DeepSeek V3</option>
              <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
              <option value="openai/gpt-4o-mini">GPT-4o mini</option>
              <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              API Key OpenRouter {openrouterKeySet && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">CONFIGURADA ✓</span>}
            </label>
            <input type="password" value={openrouterKey} onChange={(e) => setOpenrouterKey(e.target.value)} placeholder={openrouterKeySet ? 'Dejar vacío para conservar la clave actual' : 'sk-or-...'} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Modelo Gemini</label>
            <select value={geminiModel} onChange={(e) => setGeminiModel(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none">
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              API Key Gemini {geminiKeySet && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">CONFIGURADA ✓</span>}
            </label>
            <input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} placeholder={geminiKeySet ? 'Dejar vacío para conservar la clave actual' : 'AIza...'} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none" />
          </div>
          <button type="submit" disabled={iaLoading} className="rounded-lg bg-violet-700 px-6 py-2.5 font-semibold text-white hover:bg-violet-800 disabled:opacity-50">
            {iaLoading ? 'Guardando...' : '💾 Guardar configuración IA'}
          </button>
        </form>
      )}

      {/* ===== TAB USUARIOS Y ROLES ===== */}
      {tab === 'usuarios' && (
        <div className="mt-6 space-y-6">
          <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold">👥 Usuarios y Roles</h3>
            <p className="mt-1 text-sm text-slate-500">Gestiona los usuarios del tenant y sus roles (estilo Argos-RMM).</p>
            {usuariosMsg && <div className="mt-3 rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-800">{usuariosMsg}</div>}
            <form onSubmit={crearUsuario} className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nombre</label>
                <input value={userForm.nombre} onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Correo</label>
                <input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Rol</label>
                <select value={userForm.rol} onChange={(e) => setUserForm({ ...userForm, rol: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Contraseña temporal</label>
                <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required minLength={6} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <button type="submit" className="rounded-lg bg-violet-700 px-5 py-2 text-sm font-semibold text-white">➕ Crear usuario</button>
            </form>
          </div>

          <div className="max-w-2xl space-y-2">
            {usuarios.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                <div>
                  <p className="font-medium">{u.nombre}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                    {ROLES.find((r) => r.id === u.rol)?.label || u.rol}
                  </span>
                  <button
                    onClick={() => toggleUsuario(u)}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {u.isActive ? 'ACTIVO' : 'INACTIVO'}
                  </button>
                </div>
              </div>
            ))}
            {usuarios.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">Sin usuarios.</div>
            )}
          </div>
        </div>
      )}

      {/* ===== TAB API PROPIA ===== */}
      {tab === 'api' && (
        <div className="mt-6 space-y-6">
          <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold">🔑 API Propia de Prometeo</h3>
            <p className="mt-1 text-sm text-slate-500">Genera API keys para integraciones con ERPs y CRMs externos (estilo Argos-RMM). Las claves se muestran una sola vez.</p>
            {apiMsg && <div className="mt-3 rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-800">{apiMsg}</div>}
            {nuevaApiKey && (
              <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4">
                <p className="text-xs font-bold text-emerald-700">⚠️ GUARDA ESTA CLAVE AHORA — no se mostrará de nuevo:</p>
                <code className="mt-2 block overflow-auto rounded bg-emerald-100 px-3 py-2 font-mono text-sm text-emerald-900">{nuevaApiKey}</code>
              </div>
            )}
            <form onSubmit={crearApiKey} className="mt-4 flex gap-2">
              <input value={apiKeyName} onChange={(e) => setApiKeyName(e.target.value)} placeholder="Nombre de la clave (ej. ERP, CRM...)" required className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <button type="submit" className="rounded-lg bg-violet-700 px-5 py-2 text-sm font-semibold text-white">➕ Crear clave</button>
            </form>
          </div>

          <div className="max-w-2xl space-y-2">
            {apiKeys.map((k) => (
              <div key={k.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                <div>
                  <p className="font-medium">{k.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{k.prefix}•••••••</p>
                  <p className="text-[10px] text-slate-400">Creada: {new Date(k.createdAt).toLocaleDateString('es-CO')}{k.lastUsedAt ? ` · Último uso: ${new Date(k.lastUsedAt).toLocaleDateString('es-CO')}` : ' · Sin uso'}</p>
                </div>
                <button onClick={() => revocarApiKey(k)} className="rounded bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200">Revocar</button>
              </div>
            ))}
            {apiKeys.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">Sin API keys creadas.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
