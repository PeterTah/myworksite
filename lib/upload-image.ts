// Client-side helper: uploads one image file and returns the URL to embed
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/images', { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || typeof data.url !== 'string') {
    throw new Error(data.error || 'Failed to upload image');
  }
  return data.url;
}

export function imageFilesFrom(list: FileList | null | undefined): File[] {
  return Array.from(list ?? []).filter(f => f.type.startsWith('image/'));
}
