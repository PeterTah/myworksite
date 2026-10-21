'use client';

import { useEffect, useMemo, useState, useSyncExternalStore, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { CategoryNode } from '@/lib/categories';
import { categoryHref, subcategoryHref } from '@/lib/category-url';
import { createCategoryAction, createSubcategoryAction, deleteCategoryAction, moveNoteAction } from '@/app/actions';
import { NOTE_DRAG_TYPE, type DraggedNote } from '@/lib/note-drag';
import AddIdeaButton, { PlusIcon } from '@/components/add-idea-button';

interface KBSidebarProps {
  tree: CategoryNode[];
  /** Note expanded on a category page (?note=), highlighted like the current page */
  activeNote?: string;
}

const STORAGE_KEY = 'kb-sidebar-collapsed';
const CHANGE_EVENT = 'kb-sidebar-change';

// Collapsed categories live in localStorage; this small store lets React read them without a hydration mismatch.
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function readStorage(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '[]';
  } catch {
    return '[]';
  }
}

function writeStorage(keys: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...keys]));
  } catch {
    // Ignore unavailable storage
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export default function KBSidebar({ tree, activeNote }: KBSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const decodedPath = decodeURIComponent(pathname);
  const activeSlug = activeNote ?? (pathname.startsWith('/kb/') ? decodedPath.slice(4) : null);

  // The category holding the current page or note always stays open
  const forcedOpen = useMemo(() => {
    const keys = new Set<string>();
    tree.forEach(cat => {
      const holdsActive =
        decodedPath === `/category/${cat.name}` ||
        decodedPath.startsWith(`/category/${cat.name}/`) ||
        cat.notes.some(n => n.slug === activeSlug) ||
        cat.subcategories.some(sub => sub.notes.some(n => n.slug === activeSlug));
      if (holdsActive) keys.add(cat.name);
    });
    return keys;
  }, [tree, activeSlug, decodedPath]);

  const stored = useSyncExternalStore(subscribe, readStorage, () => '[]');
  const collapsed = useMemo(() => {
    try {
      return new Set<string>(JSON.parse(stored));
    } catch {
      return new Set<string>();
    }
  }, [stored]);

  // Note currently being dragged from a card; every category opens so sub-categories are reachable
  const [dragging, setDragging] = useState<DraggedNote | null>(null);
  const [moveStatus, setMoveStatus] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const onStart = (e: DragEvent) => {
      const raw = e.dataTransfer?.getData(NOTE_DRAG_TYPE);
      if (raw) setDragging(JSON.parse(raw));
    };
    const onEnd = () => setDragging(null);
    window.addEventListener('dragstart', onStart);
    window.addEventListener('dragend', onEnd);
    window.addEventListener('drop', onEnd);
    return () => {
      window.removeEventListener('dragstart', onStart);
      window.removeEventListener('dragend', onEnd);
      window.removeEventListener('drop', onEnd);
    };
  }, []);

  useEffect(() => {
    if (!moveStatus) return;
    const timer = setTimeout(() => setMoveStatus(null), 4000);
    return () => clearTimeout(timer);
  }, [moveStatus]);

  const dropNote = async (note: DraggedNote, category: string, subcategory?: string) => {
    const where = subcategory ? `${category} / ${subcategory}` : category;
    const result = await moveNoteAction(note.slug, category, subcategory);
    setMoveStatus(result.success
      ? { ok: true, text: `Moved "${note.title}" to ${where}` }
      : { ok: false, text: result.error || 'Failed to move note' });
    if (result.success) router.refresh();
  };

  const isOpen = (key: string) => !!dragging || !collapsed.has(key) || forcedOpen.has(key);
  const toggle = (key: string) => {
    const next = new Set(collapsed);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    writeStorage(next);
  };

  // Which inline "new ..." form is showing: '' for a new category, or a category name for a new sub-category
  const [creating, setCreating] = useState<string | null>(null);

  const allKeys = tree.map(c => c.name);
  const allCollapsed = allKeys.length > 0 && allKeys.every(k => collapsed.has(k));

  return (
    <nav aria-label="Knowledge base">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="font-bold text-lg whitespace-nowrap">Knowledge Base</h2>
        <div className="flex items-center gap-1">
          {tree.length > 1 && (
            <button
              type="button"
              onClick={() => writeStorage(allCollapsed ? new Set() : new Set(allKeys))}
              title={allCollapsed ? 'Expand all' : 'Collapse all'}
              aria-label={allCollapsed ? 'Expand all' : 'Collapse all'}
              className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d={allCollapsed ? 'm7 15 5 5 5-5M7 9l5-5 5 5' : 'm7 20 5-5 5 5M7 4l5 5 5-5'} />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => setCreating('')}
            title="New category"
            aria-label="New category"
            className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      {dragging && (
        <p className="mb-2 px-2 py-1.5 rounded text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          Drop on a category or sub-category to move it
        </p>
      )}
      {!dragging && moveStatus && (
        <p
          role="status"
          className={`mb-2 px-2 py-1.5 rounded text-xs ${moveStatus.ok
            ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
            : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'}`}
        >
          {moveStatus.text}
        </p>
      )}

      {creating === '' && (
        <InlineCreate
          placeholder="New category name"
          onCancel={() => setCreating(null)}
          onSubmit={async (name) => {
            const result = await createCategoryAction(name);
            if (result.success) {
              setCreating(null);
              router.refresh();
            }
            return result.error;
          }}
        />
      )}

      <div className="space-y-1">
        {tree.map((cat) => {
          const open = isOpen(cat.name);
          return (
            <div key={cat.name}>
              <Row
                level={0}
                drop={{ dragging, onDrop: (note) => dropNote(note, cat.name), isCurrent: (n) => !n.subcategory && same(n.category, cat.name) }}
                open={open}
                onToggle={() => toggle(cat.name)}
                label={cat.name}
                href={categoryHref(cat.name)}
                active={decodedPath === `/category/${cat.name}`}
                count={cat.count}
                actions={
                  <>
                    <button
                      type="button"
                      onClick={() => setCreating(cat.name)}
                      title={`New sub-category in ${cat.name}`}
                      aria-label={`New sub-category in ${cat.name}`}
                      className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <PlusIcon />
                    </button>
                    {cat.count === 0 && cat.subcategories.length === 0 && (
                      <DeleteEmptyButton label={cat.name} onDelete={() => deleteCategoryAction(cat.name)} />
                    )}
                  </>
                }
              />

              {/* Nothing to show for a category whose notes all sit directly under it */}
              {open && (cat.subcategories.length > 0 || creating === cat.name || cat.count === 0) && (
                <div className="mt-0.5 mb-2 ml-3 pl-2 border-l border-gray-200 dark:border-gray-700 space-y-0.5">
                  {creating === cat.name && (
                    <InlineCreate
                      placeholder="New sub-category name"
                      onCancel={() => setCreating(null)}
                      onSubmit={async (name) => {
                        const result = await createSubcategoryAction(cat.name, name);
                        if ('category' in result) {
                          setCreating(null);
                          router.push(subcategoryHref(result.category, result.subcategory));
                          return undefined;
                        }
                        return result.error;
                      }}
                    />
                  )}

                  {cat.subcategories.map((sub) => (
                    <Row
                      key={sub.name}
                      level={1}
                      drop={{
                        dragging,
                        onDrop: (note) => dropNote(note, cat.name, sub.name),
                        isCurrent: (n) => same(n.category, cat.name) && same(n.subcategory ?? '', sub.name),
                      }}
                      label={sub.name}
                      href={subcategoryHref(cat.name, sub.name)}
                      active={decodedPath === `/category/${cat.name}/${sub.name}`}
                      count={sub.notes.length}
                      actions={
                        <>
                          <AddIdeaButton variant="icon" category={cat.name} subcategory={sub.name} />
                          {sub.notes.length === 0 && (
                            <DeleteEmptyButton
                              label={sub.name}
                              onDelete={() => deleteCategoryAction(cat.name, sub.name)}
                              leaveIfActive={decodedPath === `/category/${cat.name}/${sub.name}`}
                            />
                          )}
                        </>
                      }
                    />
                  ))}

                  {cat.count === 0 && cat.subcategories.length === 0 && creating !== cat.name && (
                    <p className="px-2 py-1 text-xs text-gray-400">Empty. Use + to add a sub-category.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

function Row({ level, open, onToggle, label, count, href, active, actions, drop }: {
  level: 0 | 1;
  drop?: {
    dragging: DraggedNote | null;
    onDrop: (note: DraggedNote) => void;
    /** True if the note already lives here (dropping would do nothing) */
    isCurrent: (note: DraggedNote) => boolean;
  };
  open?: boolean;
  onToggle?: () => void;
  label: string;
  count: number;
  href?: string;
  active?: boolean;
  actions: React.ReactNode;
}) {
  const labelClass = level === 0
    ? `text-xs font-semibold uppercase tracking-wide ${active ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`
    : `text-sm font-medium ${active ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`;

  const [over, setOver] = useState(false);
  const canDrop = !!drop?.dragging && !drop.isCurrent(drop.dragging);

  return (
    <div
      onDragOver={(e) => {
        if (!canDrop || !e.dataTransfer.types.includes(NOTE_DRAG_TYPE)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        setOver(false);
        const raw = e.dataTransfer.getData(NOTE_DRAG_TYPE);
        if (!canDrop || !raw) return;
        e.preventDefault();
        drop!.onDrop(JSON.parse(raw));
      }}
      className={`group flex items-center gap-0.5 rounded pr-1 transition-colors ${
        over
          ? 'bg-blue-100 ring-2 ring-blue-500 dark:bg-blue-900'
          : canDrop
            ? 'outline-1 outline-dashed outline-blue-300 dark:outline-blue-700'
            : active ? 'bg-blue-50 dark:bg-blue-950' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      {onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={`${open ? 'Collapse' : 'Expand'} ${label}`}
          className={`flex items-center gap-1.5 py-1.5 pl-2 ${href ? 'pr-0.5' : 'flex-1 min-w-0 text-left'}`}
        >
          <svg
            className={`w-3 h-3 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
          </svg>
          {!href && <span className={`truncate ${labelClass}`}>{label}</span>}
        </button>
      ) : (
        <span className="w-2 shrink-0" aria-hidden />
      )}
      {href && (
        <Link href={href} aria-current={active ? 'page' : undefined} className={`flex-1 min-w-0 truncate py-1.5 hover:text-blue-600 ${labelClass}`}>
          {label}
        </Link>
      )}
      {/* Actions show on hover/focus; the count shows otherwise */}
      <span className="text-xs text-gray-400 tabular-nums group-hover:hidden group-focus-within:hidden">{count}</span>
      <span className="hidden group-hover:flex group-focus-within:flex items-center">{actions}</span>
    </div>
  );
}

function InlineCreate({ placeholder, onSubmit, onCancel }: {
  placeholder: string;
  onSubmit: (name: string) => Promise<string | undefined>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="my-1"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const err = await onSubmit(name);
          setError(err ?? null);
        });
      }}
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
        placeholder={placeholder}
        disabled={isPending}
        maxLength={60}
        aria-label={placeholder}
        className="w-full text-sm px-2 py-1 rounded border border-blue-400 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex items-center gap-2 mt-1 text-xs">
        <button type="submit" disabled={isPending || !name.trim()} className="text-blue-600 font-medium disabled:opacity-40">
          {isPending ? 'Adding…' : 'Add'}
        </button>
        <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
          Cancel
        </button>
        {error && <span className="text-red-600 dark:text-red-400 truncate" title={error}>{error}</span>}
      </div>
    </form>
  );
}

function DeleteEmptyButton({ label, onDelete, leaveIfActive }: {
  label: string;
  onDelete: () => Promise<{ success: boolean; error?: string }>;
  /** True when the user is viewing the page being deleted; go home instead of refreshing into a 404 */
  leaveIfActive?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        const result = await onDelete();
        if (!result.success) return;
        if (leaveIfActive) router.push('/');
        else router.refresh();
      })}
      title={`Delete empty "${label}"`}
      aria-label={`Delete empty ${label}`}
      className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      </svg>
    </button>
  );
}
