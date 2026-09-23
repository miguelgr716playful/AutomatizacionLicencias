import type { SoftwareId, TipoOperacion } from "@/domain/value-objects/software";
import { getLicenciasUploadUrl, API_BASE_URL } from "@/lib/api-config";

export interface CsvUploadResult {
  ok: boolean;
  container: string;
  blobName: string;
  blobUrl: string;
  historicoBlobName: string;
  historicoBlobUrl: string;
  size: number;
  uploadedAt: string;
  software: string;
  tipo: string;
  fileName: string;
}

export async function uploadCsvToStorage(
  file: File,
  software: SoftwareId,
  tipo: TipoOperacion
): Promise<CsvUploadResult> {
  if (!API_BASE_URL) {
    throw new Error("API no configurada (NEXT_PUBLIC_API_BASE_URL)");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("software", software);
  form.append("tipo", tipo);

  const res = await fetch(getLicenciasUploadUrl(), {
    method: "POST",
    credentials: "include",
    body: form,
  });

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return (await res.json()) as CsvUploadResult;
}
