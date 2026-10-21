import { NextResponse } from 'next/server';
import { getNoteBySlug } from '@/lib/notes';
import jsPDF from 'jspdf';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);

  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }

  try {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text(note.title, 20, 20);

    // Description
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(note.description, 20, 30);

    // Category and tags
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Category: ${note.category}`, 20, 40);
    if (note.tags.length > 0) {
      doc.text(`Tags: ${note.tags.join(', ')}`, 20, 48);
    }

    // Content
    doc.setFontSize(12);
    doc.setTextColor(0);
    const lines = doc.splitTextToSize(note.content, 170);
    doc.text(lines, 20, 60);

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${note.slug}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
