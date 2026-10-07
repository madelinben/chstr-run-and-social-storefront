const MAX_EDGE = 1600;
const QUALITY = 0.82;

/** Shrinks a photo in the browser to a WebP under about 1600 px, so uploads stay light and the site stays fast. Returns base64 without the data prefix. */
export async function resizeToWebp(file: File): Promise<{ base64: string; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot resize pictures.');
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', QUALITY));
  if (!blob) throw new Error('This browser cannot save WebP pictures.');
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return { base64: btoa(binary), width, height };
}

/** `Monday Run 2.JPG` becomes `monday-run-2`. */
export function pictureIdFromFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
