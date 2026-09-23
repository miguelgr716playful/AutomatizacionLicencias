"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Shield } from "lucide-react";
import { getDefaultHrefForRole } from "@/lib/constants";
import {
  getSamlLoginUrl,
  isSamlLoginEnabled,
} from "@/lib/api-config";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const samlEnabled = isSamlLoginEnabled();
  const unauthorized = searchParams.get("error") === "unauthorized";

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    router.push(getDefaultHrefForRole("admin"));
  };

  const handleSamlLogin = () => {
    const url = getSamlLoginUrl("/dashboard");
    if (!url) return;
    setLoading(true);
    window.location.href = url;
  };

  return (
    <div className="relative z-10 w-full max-w-md">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-8">
          <h1 className="text-page-title">Automatización de Licencias</h1>
          <p className="text-page-subtitle mt-1">
            {samlEnabled
              ? "Accede con tu cuenta institucional (AMFS)"
              : "Ingresa tus credenciales institucionales"}
          </p>
        </div>

        {unauthorized && (
          <div
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
            role="alert"
          >
            Tu cuenta autenticó en AMFS, pero no tiene permiso para esta
            aplicación. Solicita acceso al administrador del sistema.
          </div>
        )}

        {samlEnabled ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleSamlLogin}
              disabled={loading}
              className="btn-primary w-full px-4 py-3 sm:py-2.5 min-h-11"
            >
              <Shield className="w-4 h-4" />
              {loading ? "Redirigiendo..." : "Iniciar sesión con cuenta Tec"}
            </button>
            <p className="text-xs text-center text-muted-foreground">
              Serás redirigido a AMFS para autenticarte.
            </p>
          </div>
        ) : (
          <form onSubmit={handleDemoSubmit} className="space-y-5">
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
              className="btn-primary w-full px-4 py-3 sm:py-2.5 min-h-11"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>
        )}

        <p className="text-xs text-center text-muted-foreground mt-6">
          Acceso restringido a personal autorizado de Tecmilenio
        </p>
      </div>
    </div>
  );
}
