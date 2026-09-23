"use client";

import type { RegistroBanner } from "@/application/dto/aprovisionar.dto";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RegistrosPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  registros: RegistroBanner[];
};

const COLUMNAS = [
  { key: "bannerId" as const, label: "Clave Banner" },
  { key: "asignatura" as const, label: "Asignatura" },
  { key: "email" as const, label: "Email" },
  { key: "nombres" as const, label: "Nombres" },
  { key: "apellidos" as const, label: "Apellidos" },
];

export function RegistrosPreviewDialog({
  open,
  onOpenChange,
  fileName,
  registros,
}: RegistrosPreviewDialogProps) {
  const columnasVisibles = COLUMNAS.filter((col) =>
    registros.some((r) => r[col.key])
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col gap-4 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>Vista previa de datos</DialogTitle>
          <DialogDescription>
            {fileName} · {registros.length}{" "}
            {registros.length === 1 ? "registro" : "registros"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-gray-50/80">
                {columnasVisibles.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-2.5 text-table-header text-left whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registros.map((registro, index) => (
                <tr
                  key={`${registro.bannerId}-${index}`}
                  className="border-b border-border last:border-0 hover:bg-gray-50/60"
                >
                  {columnasVisibles.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-2.5 text-foreground truncate max-w-[200px] ${
                        col.key === "bannerId" ? "font-mono text-emerald-600" : ""
                      }`}
                    >
                      {registro[col.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
