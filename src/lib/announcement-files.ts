import { supabase } from "@/integrations/supabase/client";

const BUCKET = "activity-files";
const PREFIX = "announcements";

export const sanitizeFileName = (fileName: string) =>
  fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-");

export const buildAnnouncementFilePath = (announcementId: string, fileName: string) =>
  `${PREFIX}/${announcementId}/${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;

export const uploadAnnouncementFile = async (path: string, file: File) => {
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
};

export const removeAnnouncementFiles = async (paths: string[]) => {
  if (paths.length === 0) return;
  await supabase.storage.from(BUCKET).remove(paths);
};

export const downloadAnnouncementFile = async (filePath: string, fileName: string) => {
  const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl;
  const response = await fetch(publicUrl);
  if (!response.ok) throw new Error("No se pudo descargar el archivo.");
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
