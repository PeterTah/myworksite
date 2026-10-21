'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { NoteMetadata } from '@/lib/notes';
import { noteViewHref } from '@/lib/category-url';

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [results, setResults] = useState<NoteMetadata[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/search');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories);
          setAllTags(data.tags);
        }
      } catch (error) {
        console.error('Error loading search data:', error);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function search() {
      if (!query && selectedCategory === 'all' && selectedTags.length === 0) {
        setResults([]);
        return;
      }

      try {
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));

        const response = await fetch(`/api/search?${params}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results);
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    }

    const debounceTimer = setTimeout(search, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, selectedCategory, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Open the note expanded in its category / sub-category view
  const handleNoteClick = (note: NoteMetadata) => {
    router.push(noteViewHref(note));
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <div className={`relative ${isOpen ? 'z-50' : ''}`}>
      <input
        type="text"
        placeholder="Search notes..."
        aria-label="Search notes"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className="relative z-50 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {isOpen && (query || selectedCategory !== 'all' || selectedTags.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-50 p-4 space-y-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </p>
            {results.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.map(note => (
                  <button
                    key={note.slug}
                    type="button"
                    onClick={() => handleNoteClick(note)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <div className="font-medium">{note.title}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{note.description}</div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {note.category}{note.subcategory && ` / ${note.subcategory}`}
                      </span>
                      {note.tags.map(tag => (
                        <span key={tag} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No results found</p>
            )}
          </div>
        </div>
      )}

      {/* Close on outside click */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
