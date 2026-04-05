import { supabase } from "@/integrations/supabase/client";

export const sanitizeFileName = (fileName: string) =>
  fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-");

export const getActivityFileUrl = (filePath: string) =>
  supabase.storage.from("activity-files").getPublicUrl(filePath).data.publicUrl;

export const downloadActivityFile = async (filePath: string, fileName: string) => {
  const publicUrl = getActivityFileUrl(filePath);
  const response = await fetch(publicUrl);

  if (!response.ok) {
    throw new Error("No se pudo descargar el archivo.");
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
};

export const formatFileSize = (size: number | null | undefined) => {
  if (size == null) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};
