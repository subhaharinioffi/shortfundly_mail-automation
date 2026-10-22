import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';



export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let filename = '';
    let mimeType = 'application/octet-stream';
    let size = 0;
    let base64Data = '';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');

      if (!file || typeof file === 'string') {
        return NextResponse.json({ error: 'No file provided in upload request.' }, { status: 400 });
      }

      filename = file.name || 'uploaded_file';
      mimeType = file.type || 'application/octet-stream';
      size = file.size || 0;

      const bytes = await file.arrayBuffer();
      base64Data = Buffer.from(bytes).toString('base64');
    } else {
      const body = await req.json();
      filename = body.filename || 'uploaded_file';
      mimeType = body.mimeType || 'application/octet-stream';
      base64Data = body.base64Data || '';
      size = body.size || (base64Data ? Math.round(base64Data.length * 0.75) : 0);
    }

    if (!base64Data) {
      return NextResponse.json({ error: 'Empty file payload.' }, { status: 400 });
    }

    // Limit to 10MB
    if (size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds maximum 10MB limit.' }, { status: 400 });
    }

    const fileId = 'up_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const db = getDb();

    db.prepare(`
      INSERT INTO uploaded_files (id, filename, mime_type, size_bytes, data_base64, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      fileId,
      filename,
      mimeType,
      size,
      base64Data,
      session.user?.name || 'Authorized Admin'
    );

    const isImage = mimeType.startsWith('image/');
    const url = `/api/upload?id=${fileId}&name=${encodeURIComponent(filename)}`;

    return NextResponse.json({
      success: true,
      file: {
        id: fileId,
        filename,
        mimeType,
        size,
        isImage,
        url
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: error.message || 'File upload failed' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response('File ID required', { status: 400 });
    }

    const db = getDb();
    const record = db.prepare('SELECT * FROM uploaded_files WHERE id = ?').get(id);

    if (!record) {
      return new Response('File not found', { status: 404 });
    }

    const buffer = Buffer.from(record.data_base64, 'base64');

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': record.mime_type || 'application/octet-stream',
        'Content-Length': String(buffer.length),
        'Content-Disposition': `inline; filename="${encodeURIComponent(record.filename)}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error('File fetch error:', error);
    return new Response('Internal error serving file', { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('DELETE FROM uploaded_files WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
