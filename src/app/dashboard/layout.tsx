import Link from "next/link";

const SIDEBAR = [
  { href: "/dashboard", label: "Inventario de Oportunidades", icon: "📋" },
  { href: "/dashboard/invitaciones", label: "Invitaciones RFI/RFP", icon: "✉️" },
  { href: "/dashboard/analisis", label: "Análisis IA (Go/No-Go)", icon: "🧠" },
  { href: "/dashboard/ofertas", label: "Generador de Ofertas", icon: "📝" },
  { href: "/dashboard/ganadas", label: "Ganadas (Project Delivery)", icon: "🏆" },
  { href: "/dashboard/financiero", label: "Control Financiero", icon: "💰" },
  { href: "/dashboard/configuracion", label: "Configuraciones", icon: "⚙️" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="flex w-64 flex-col bg-slate-900 text-slate-200">
        <div className="flex items-center gap-2 px-5 py-5 text-lg font-bold text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-600">🔥</span>
          Prometeo
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {SIDEBAR.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-800"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-700 p-4 text-xs text-slate-400">
          CIDE SAS · Tenant semilla
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
