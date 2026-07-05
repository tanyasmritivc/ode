// Client-side resize/compress before upload. Caps the longer edge at ~1800px
// and re-encodes as JPEG at ~0.9 quality - enough headroom to look sharp at
// the sizes we actually display, while still compressing huge originals.
const MAX_EDGE = 1800;
const JPEG_QUALITY = 0.9;

export async function resizeImageFile(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);

  const longestEdge = Math.max(bitmap.width, bitmap.height);
  const scale = longestEdge > MAX_EDGE ? MAX_EDGE / longestEdge : 1;
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) return file;

  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}
