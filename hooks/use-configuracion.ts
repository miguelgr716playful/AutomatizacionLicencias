"use client";

import { useCallback, useEffect, useState } from "react";
import type { ConfiguracionResponse } from "@/application/dto/configuracion.dto";
import { container } from "@/infrastructure/di/container";

export function useConfiguracion() {
  const [data, setData] = useState<ConfiguracionResponse | null>(null);
  const [editField, setEditField] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const config = await container.obtenerConfiguracion.ejecutar();
    setData(config);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const actualizarPeriodicidad = useCallback(async (periodicidad: string) => {
    const programador =
      await container.actualizarPeriodicidad.ejecutar(periodicidad);
    setData((prev) =>
      prev ? { ...prev, programador } : prev
    );
  }, []);

  return {
    data,
    cargando,
    editField,
    setEditField,
    actualizarPeriodicidad,
  };
}
