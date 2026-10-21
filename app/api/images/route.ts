import { NextResponse } from 'next/server';
import { IMAGE_TYPES, MAX_IMAGE_BYTES, imageUrl, saveImage } from '@/lib/images';

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }
    if (!IMAGE_TYPES[file.type]) {
      return NextResponse.json({ error: 'Only PNG, JPEG, GIF, WebP and AVIF images are supported' }, { status: 415 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image is larger than 10 MB' }, { status: 413 });
    }

    const name = saveImage(Buffer.from(await file.arrayBuffer()), file.type);
    return NextResponse.json({ url: imageUrl(name) });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
