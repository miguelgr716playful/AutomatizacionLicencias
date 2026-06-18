"use client";

import { useCallback, useEffect, useState } from "react";
import { PAGE_SIZE, type ReportesResponse } from "@/application/dto/reportes.dto";
import { container } from "@/infrastructure/di/container";

export function useReportes() {
  const [filterSoftware, setFilterSoftware] = useState("Todo software");
  const [filterAccion, setFilterAccion] = useState("Alta y Baja");
  const [filterOrigen, setFilterOrigen] = useState("ETL + Manual");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReportesResponse | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const resultado = await container.obtenerReportes.ejecutar({
      software: filterSoftware,
      accion: filterAccion,
      origen: filterOrigen,
      busqueda: search,
      page,
    });
    setData(resultado);
    setCargando(false);
  }, [filterSoftware, filterAccion, filterOrigen, search, page]);

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
    filterOrigen,
    setFilterOrigen: handleFilterChange(setFilterOrigen),
    search,
    setSearch: setSearchAndReset,
    page,
    setPage,
    data,
    cargando,
    pageSize: PAGE_SIZE,
  };
}
