import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NEW_SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Sitio en nuevo dominio | Automatización de Licencias",
  description:
    "Este sitio cambió de dominio. Visita la nueva dirección de Automatización de Licencias.",
};

export default function HomePage() {
  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/tecMilenioFondo.jpeg')" }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(11, 77, 60, 0.55), rgba(11, 77, 60, 0.75))",
        }}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl p-6 sm:p-8 text-center">
          <h1 className="text-page-title">Automatización de Licencias</h1>
          <p className="text-page-subtitle mt-2">
            Este sitio cambió de dominio
          </p>

          <div className="mt-6 space-y-4 text-left">
            <p className="text-sm text-muted-foreground leading-relaxed">
              La plataforma de Automatización de Licencias ahora está disponible
              en una nueva dirección. Guarda el enlace y utiliza únicamente el
              nuevo dominio para acceder al sistema.
            </p>

            <div className="rounded-xl border border-border bg-muted/60 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                Nuevo dominio
              </p>
              <a
                href={NEW_SITE_URL}
                className="text-sm font-medium text-primary break-all hover:underline"
              >
                {NEW_SITE_URL}
              </a>
            </div>
          </div>

          <Button asChild className="w-full mt-6" size="lg">
            <a href={NEW_SITE_URL}>
              Ir al nuevo sitio
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>

          <p className="text-xs text-muted-foreground mt-6">
            Acceso restringido a personal autorizado de Tecmilenio
          </p>
        </div>
      </div>
    </div>
  );
}
