import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Images live next to the notes so they are versioned and backed up together
export const IMAGES_DIR = path.join(process.cwd(), 'notes', 'images');

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

// SVG is left out on purpose: it can carry scripts
export const IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

const NAME_PATTERN = /^[\w-]+\.(png|jpg|gif|webp|avif)$/;

export function isValidImageName(name: string): boolean {
  return NAME_PATTERN.test(name);
}

export function imageUrl(name: string): string {
  return `/api/images/${name}`;
}

export function contentTypeFor(name: string): string {
  const ext = path.extname(name).slice(1);
  return Object.entries(IMAGE_TYPES).find(([, e]) => e === ext)?.[0] ?? 'application/octet-stream';
}

export function imagePath(name: string): string | null {
  return isValidImageName(name) ? path.join(IMAGES_DIR, name) : null;
}

export function saveImage(data: Buffer, mimeType: string): string {
  const ext = IMAGE_TYPES[mimeType];
  if (!ext) throw new Error('Unsupported image type');
  if (data.length > MAX_IMAGE_BYTES) throw new Error('Image is larger than 10 MB');

  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const name = `${stamp}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(IMAGES_DIR, name), data);
  return name;
}
