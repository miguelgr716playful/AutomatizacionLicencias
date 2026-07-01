"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    router.push("/dashboard");
  };

  return (
    <div className="relative z-10 w-full max-w-md">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-8">
          <h1 className="text-page-title">
            Automatización de Licencias
          </h1>
          <p className="text-page-subtitle mt-1">
            Ingresa tus credenciales institucionales
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground block mb-1.5"
            >
              Correo institucional
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@tecmilenio.edu.mx"
              required
              className="w-full text-base sm:text-sm px-3 py-3 sm:py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground block mb-1.5"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full text-base sm:text-sm px-3 py-3 sm:py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 min-h-11 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-70"
          >
            <LogIn className="w-4 h-4" />
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="text-xs text-center text-muted-foreground mt-6">
          Acceso restringido a personal autorizado de Tecmilenio
        </p>
      </div>
    </div>
  );
}
