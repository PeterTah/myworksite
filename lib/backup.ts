import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { getAllNotes } from './notes';

const NOTES_DIR = path.join(process.cwd(), 'notes');
const BACKUP_DIR = path.join(process.cwd(), 'backups');

export async function createBackup(): Promise<Buffer> {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const zip = new AdmZip();

  // Add all markdown files
  if (fs.existsSync(NOTES_DIR)) {
    const files = fs.readdirSync(NOTES_DIR).filter(file => file.endsWith('.md') || file === '_categories.json');
    files.forEach(file => {
      const filePath = path.join(NOTES_DIR, file);
      zip.addLocalFile(filePath);
    });
  }

  // Add metadata
  const notes = await getAllNotes();
  const metadata = {
    exportedAt: new Date().toISOString(),
    noteCount: notes.length,
    notes: notes.map(n => ({
      slug: n.slug,
      title: n.title,
      category: n.category,
      tags: n.tags,
    })),
  };
  zip.addFile('metadata.json', JSON.stringify(metadata, null, 2));

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}.zip`);
  zip.writeZip(backupPath);

  return fs.readFileSync(backupPath);
}

export async function restoreBackup(zipBuffer: Buffer): Promise<{ success: boolean; imported: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;

  try {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    if (!fs.existsSync(NOTES_DIR)) {
      fs.mkdirSync(NOTES_DIR, { recursive: true });
    }

    for (const entry of entries) {
      const fileName = path.basename(entry.entryName);
      if (fileName === '_categories.json' && !entry.isDirectory) {
        // Restore sidebar categories, but only if the file is valid JSON
        try {
          const content = entry.getData().toString('utf8');
          JSON.parse(content);
          fs.writeFileSync(path.join(NOTES_DIR, fileName), content);
        } catch (error) {
          errors.push(`Failed to restore categories: ${error}`);
        }
      } else if (entry.entryName.endsWith('.md') && !entry.isDirectory) {
        try {
          const content = entry.getData().toString('utf8');
          const filePath = path.join(NOTES_DIR, fileName);
          fs.writeFileSync(filePath, content);
          imported++;
        } catch (error) {
          errors.push(`Failed to import ${entry.entryName}: ${error}`);
        }
      }
    }

    return { success: true, imported, errors };
  } catch (error) {
    return { success: false, imported, errors: [`Backup restore failed: ${error}`] };
  }
}

export function getBackupList(): string[] {
  if (!fs.existsSync(BACKUP_DIR)) {
    return [];
  }

  return fs.readdirSync(BACKUP_DIR)
    .filter(file => file.endsWith('.zip'))
    .sort()
    .reverse();
}
