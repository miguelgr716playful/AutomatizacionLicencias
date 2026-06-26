"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-100 font-sans">
      <aside className="hidden md:flex shrink-0 h-full">
        <Sidebar />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="p-0 w-72 max-w-[85vw] border-0 bg-[#0B4D3C] [&>button]:text-white [&>button]:opacity-90"
        >
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <Sidebar
            className="w-full"
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col min-w-0">
        <header
          className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-white shrink-0"
          style={{ backgroundColor: "#0B4D3C" }}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex items-center justify-center min-w-10 min-h-10 rounded-lg text-white hover:bg-white/10 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-white truncate">
            Automatización de Licencias
          </span>
        </header>

        <main
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ backgroundColor: "#F5F5F5" }}
        >
          <div className="px-4 py-4 sm:px-6 sm:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
