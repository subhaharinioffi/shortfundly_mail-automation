import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';
import Papa from 'papaparse';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const rows = db.prepare(`
      SELECT 
        state as "State",
        city as "City",
        college_name as "College Name",
        website_url as "Official Website URL",
        department as "Department",
        contact_person as "Contact Person",
        email as "Official Email Address",
        source_page_url as "Source Page URL",
        status as "Status",
        last_contacted_at as "Last Contacted At"
      FROM colleges
      ORDER BY id ASC
    `).all();

    const csv = Papa.unparse(rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="shortfundly_odisha_colleges_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  }
}
