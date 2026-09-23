"use client";

import type { ReactNode } from "react";
import { useRole } from "@/components/layout/role-provider";

export function AuthGate({ children }: { children: ReactNode }) {
  const { samlActivo, cargando, user } = useRole();

  if (!samlActivo) {
    return <>{children}</>;
  }

  if (cargando) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-gray-100 text-sm text-muted-foreground">
        Validando sesión...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-gray-100 text-sm text-muted-foreground">
        Redirigiendo al login...
      </div>
    );
  }

  return <>{children}</>;
}
