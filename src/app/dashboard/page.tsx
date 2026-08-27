export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Inventario de Oportunidades</h1>
      <p className="mt-1 text-sm text-slate-500">
        Espejo de SECOP II y TVEC vía Datos Abiertos (SODA API). Filtrado por UNSPSC del tenant.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Oportunidades activas", value: "0", color: "text-violet-700" },
          { label: "Aplicadas", value: "0", color: "text-sky-600" },
          { label: "Descartadas", value: "0", color: "text-amber-600" },
          { label: "P_win promedio", value: "—", color: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-slate-400">
          La sincronización con SECOP II se activará en la Fase 2 (semana 4-6).
        </p>
      </div>
    </div>
  );
}
