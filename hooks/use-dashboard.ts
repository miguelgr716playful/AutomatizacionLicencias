"use client";

import { useCallback, useEffect, useState } from "react";
import type { DashboardData } from "@/application/dto/dashboard.dto";
import { container } from "@/infrastructure/di/container";

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const resumen = await container.obtenerDashboard.ejecutar();
    setData(resumen);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { data, cargando, recargar: cargar };
}
