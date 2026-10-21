'use client';

import { useState, useEffect } from 'react';
import RichTextEditor from '@/components/rich-text-editor';
import { markdownToHtml } from '@/lib/converter';
import type { Note } from '@/lib/notes';

interface NoteEditorProps {
  note?: Note;
  onSave: (note: Omit<Note, 'slug'> & { slug?: string }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function NoteEditor({ note, onSave, onCancel, isSubmitting = false }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [description, setDescription] = useState(note?.description || '');
  const [category, setCategory] = useState(note?.category || '');
  const [subcategory, setSubcategory] = useState(note?.subcategory || '');
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [contentMarkdown, setContentMarkdown] = useState(note?.content || '');

  // Convert markdown to HTML on mount (for existing markdown notes)
  useEffect(() => {
    if (note?.content) {
      if (note.contentType === 'html') {
        setContentHtml(note.content);
      } else {
        markdownToHtml(note.content).then(setContentHtml);
      }
    }
  }, [note?.content, note?.contentType]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Save as HTML to preserve formatting
    await onSave({
      title,
      description,
      category,
      subcategory,
      tags,
      content: contentHtml,
      contentType: 'html',
      slug: note?.slug,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Description <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-2">
          Category
        </label>
        <input
          id="category"
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., VMware, Linux, Azure"
          required
        />
      </div>

      {/* Sub-category */}
      <div>
        <label htmlFor="subcategory" className="block text-sm font-medium mb-2">
          Sub-category <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <input
          id="subcategory"
          type="text"
          value={subcategory}
          onChange={(e) => setSubcategory(e.target.value)}
          className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., vSAN, NSX"
          maxLength={60}
        />
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium mb-2">
          Tags
        </label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              id="tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a tag and press Enter"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Editor */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Content
        </label>
        <RichTextEditor
          content={contentHtml}
          onChange={setContentHtml}
          placeholder="Start writing your note..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : note ? 'Update Note' : 'Create Note'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
