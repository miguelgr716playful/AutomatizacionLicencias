"use client";

import { useCallback, useEffect, useState } from "react";
import { PAGE_SIZE, type ReportesResponse } from "@/application/dto/reportes.dto";
import { container } from "@/infrastructure/di/container";
import { descargarReportesCsv } from "@/lib/export-reportes-csv";

export function useReportes() {
  const [filterSoftware, setFilterSoftware] = useState("Todo software");
  const [filterAccion, setFilterAccion] = useState("Aprovisionar/Desaprovisionar");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReportesResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);

  const filtrosActuales = useCallback(
    () => ({
      software: filterSoftware,
      accion: filterAccion,
      origen: "ETL + Manual",
      busqueda: search,
    }),
    [filterSoftware, filterAccion, search]
  );

  const cargar = useCallback(async () => {
    setCargando(true);
    const resultado = await container.obtenerReportes.ejecutar({
      ...filtrosActuales(),
      page,
    });
    setData(resultado);
    setCargando(false);
  }, [filtrosActuales, page]);

  const exportarCsv = useCallback(async () => {
    if (!data?.total) return;

    setExportando(true);
    try {
      const resultado = await container.obtenerReportes.ejecutar({
        ...filtrosActuales(),
        page: 1,
        pageSize: data.total,
      });
      const fecha = new Date().toISOString().slice(0, 10);
      descargarReportesCsv(
        resultado.items,
        `reporte-asignaciones-${fecha}.csv`
      );
    } finally {
      setExportando(false);
    }
  }, [data?.total, filtrosActuales]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleFilterChange = (setter: (v: string) => void) => (val: string) => {
    setter(val);
    setPage(1);
  };

  const setSearchAndReset = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return {
    filterSoftware,
    setFilterSoftware: handleFilterChange(setFilterSoftware),
    filterAccion,
    setFilterAccion: handleFilterChange(setFilterAccion),
    search,
    setSearch: setSearchAndReset,
    page,
    setPage,
    data,
    cargando,
    exportando,
    exportarCsv,
    pageSize: PAGE_SIZE,
  };
}
