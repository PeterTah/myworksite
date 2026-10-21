import { NextResponse } from 'next/server';
import { createBackup, getBackupList } from '@/lib/backup';

export async function GET() {
  try {
    const backupBuffer = await createBackup();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    return new NextResponse(backupBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="knowledge-base-backup-${timestamp}.zip"`,
      },
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
  }
}
