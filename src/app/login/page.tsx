import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-2 text-xl font-bold text-violet-700">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-100">🔥</span>
          Prometeo
        </div>
        <h1 className="mt-6 text-2xl font-bold">Inicia sesión</h1>
        <p className="mt-1 text-sm text-slate-500">Accede a tu panel de oportunidades SECOP II / TVEC.</p>
        <form className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Correo electrónico</label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="usuario@empresa.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Contraseña</label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-violet-700 py-2.5 font-semibold text-white transition hover:bg-violet-800"
          >
            Ingresar
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Aún no tienes cuenta?{" "}
          <Link href="/" className="font-medium text-violet-700 hover:underline">
            Conoce Prometeo
          </Link>
        </p>
      </div>
    </main>
  );
}
