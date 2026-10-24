import { NextRequest, NextResponse } from 'next/server';
import { runFullPipeline } from '../../../../../services/crawler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    const maxColleges = typeof body?.maxColleges === 'number' ? body.maxColleges : 6;
    const forceAll = Boolean(body?.forceAll);

    const result = await runFullPipeline({ maxColleges, forceAll });
    return NextResponse.json({
      success: true,
      message: `10-day automated crawl cycle executed. ${result.phase2.collegesScraped} institutions deep-scraped, ${result.phase2.changeRequestsDetected} update(s) detected.`,
      result,
    });
  } catch (error: any) {
    console.error('Crawler pipeline error:', error);
    return NextResponse.json(
      { error: 'Crawler execution encountered an error', details: error?.message },
      { status: 500 }
    );
  }
}
