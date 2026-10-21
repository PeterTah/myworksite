import fs from 'fs';
import { NextResponse } from 'next/server';
import { contentTypeFor, imagePath } from '@/lib/images';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const filePath = imagePath(name);

  if (!filePath || !fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }

  // File names are random and never reused, so the response can be cached forever
  return new NextResponse(fs.readFileSync(filePath) as unknown as BodyInit, {
    headers: {
      'Content-Type': contentTypeFor(name),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
