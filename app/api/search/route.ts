import { NextResponse } from 'next/server';
import { searchNotes, getAllTags, getNotesByCategory } from '@/lib/notes';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  const category = searchParams.get('category') || undefined;
  const tags = searchParams.get('tags')?.split(',').filter(Boolean) || undefined;

  try {
    const results = await searchNotes(query, category, tags);
    const categories = await getNotesByCategory();
    const allTags = await getAllTags();

    return NextResponse.json({
      results,
      categories: categories.map(c => c.category),
      tags: allTags,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
