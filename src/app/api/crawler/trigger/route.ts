import { NextRequest, NextResponse } from 'next/server';
import { runFullPipeline } from '../../../../../services/crawler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const result = await runFullPipeline({ maxColleges: 6 });
    return NextResponse.json({
      success: true,
      message: 'Automated directory pipeline and Firecrawl deep-scrape completed successfully.',
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
