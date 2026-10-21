// Decodes a URL segment without throwing on stray "%" (Next.js may already have decoded it)
export function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
