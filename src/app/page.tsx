import Link from "next/link";

const MODULES = [
  { n: "01", t: "Inventario de Oportunidades", d: "Espejo SECOP II / TVEC con filtros UNSPSC, presupuestales y geográficos." },
  { n: "02", t: "Invitaciones RFI/RFP", d: "Bandeja comercial con ingesta por correo y rechazo elegante (Smart Decline)." },
  { n: "03", t: "Análisis IA Go / No-Go", d: "Matriz de cumplimiento técnico, validación financiera automática y P_win." },
  { n: "04", t: "Generador de Ofertas", d: "Funnel Kanban, anexos oficiales Colombia Compra Eficiente y firma digital." },
  { n: "05", t: "Ganadas (Project Delivery)", d: "Gobernanza post-adjudicación, entregables, hitos y SLAs." },
  { n: "06", t: "Control Financiero", d: "Flujo de caja, liquidación impositiva territorial y márgenes reales vs proyectados." },
  { n: "07", t: "Configuraciones", d: "Conectores API, modelos de IA, usuarios/roles RBAC y biblioteca documental." },
];

const AGENTS = [
  { n: "Scout", d: "Filtra oportunidades por UNSPSC del tenant" },
  { n: "Auditor", d: "Analiza pliegos PDF con RAG" },
  { n: "Costing", d: "Estructura propuesta económica y margen" },
  { n: "Drafter", d: "Redacta propuestas y formatos oficiales" },
  { n: "Commander", d: "Orquesta el funnel con Human-in-the-Loop" },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-violet-700 via-violet-800 to-sky-800 text-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2 text-xl font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15">🔥</span>
            Prometeo
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="#modulos" className="hover:underline">Módulos</a>
            <a href="#agentes" className="hover:underline">Agentes</a>
            <Link href="/login" className="rounded-lg bg-white px-4 py-2 font-semibold text-violet-800">
              Ingresar
            </Link>
          </div>
        </nav>
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <p className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1 text-sm">CIDE SAS · SECOP II · TVEC</p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Inteligencia de licitaciones públicas y privadas con agentes de IA
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/85">
            Prospecta, analiza, estructura y controla tus ofertas en SECOP II y el sector corporativo.
            Automatiza el ciclo completo con un equipo de agentes de IA.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/login" className="rounded-xl bg-white px-8 py-3 font-bold text-violet-800 shadow-lg">
              Comenzar ahora
            </Link>
            <a href="#modulos" className="rounded-xl border border-white/40 px-8 py-3 font-semibold">
              Ver módulos
            </a>
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section id="modulos" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-extrabold">Los 7 módulos de tu operación licitatoria</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-500">
          Un panel de navegación integral para todo el ciclo de vida de la propuesta.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <div key={m.n} className="rounded-2xl border border-slate-200 p-6 transition hover:border-violet-400 hover:shadow-md">
              <div className="text-sm font-bold text-violet-600">Módulo {m.n}</div>
              <h3 className="mt-2 text-lg font-bold">{m.t}</h3>
              <p className="mt-2 text-sm text-slate-500">{m.d}</p>
            </div>
          ))}
          <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-sky-600 p-6 text-white">
            <h3 className="text-lg font-bold">+ Agentes de IA</h3>
            <p className="mt-2 text-sm text-white/85">Un swarm de 5 agentes orquesta todo el ciclo, con validación humana.</p>
          </div>
        </div>
      </section>

      {/* Agentes */}
      <section id="agentes" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-extrabold">Swarm Core de agentes</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {AGENTS.map((a) => (
              <div key={a.n} className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-violet-100 text-xl">🤖</div>
                <h3 className="mt-3 font-bold">{a.n}</h3>
                <p className="mt-1 text-xs text-slate-500">{a.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CIDE */}
      <footer className="bg-slate-900 py-12 text-slate-300">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-lg font-bold text-white">CIDE SAS</p>
          <p className="mt-1 text-sm">Tecnología para tu operación · Licitaciones, Continuidad, Monitoreo y Gestión</p>
          <p className="mt-6 text-xs text-slate-500">© {new Date().getFullYear()} CIDE SAS · prometeo.cidesolutions.com</p>
        </div>
      </footer>
    </main>
  );
}
