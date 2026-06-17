// Resize + compress an image File in the browser before uploading.
// Keeps aspect ratio, caps the longest side, and re-encodes as JPEG.
export async function compressImage(
  file: File,
  opts: { maxSize?: number; quality?: number; mimeType?: string } = {}
): Promise<File> {
  const { maxSize = 1024, quality = 0.85, mimeType = "image/jpeg" } = opts;

  // Skip non-images and small files (<400KB) — already light.
  if (!file.type.startsWith("image/")) return file;
  if (file.size < 400 * 1024) return file;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    i.src = dataUrl;
  });

  let { width, height } = img;
  if (width > maxSize || height > maxSize) {
    if (width >= height) {
      height = Math.round((height * maxSize) / width);
      width = maxSize;
    } else {
      width = Math.round((width * maxSize) / height);
      height = maxSize;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), mimeType, quality)
  );
  if (!blob || blob.size >= file.size) return file;

  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, { type: mimeType, lastModified: Date.now() });
}
