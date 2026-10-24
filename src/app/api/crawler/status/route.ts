import { NextRequest, NextResponse } from 'next/server';
import { getCrawlerCycleStatus } from '../../../../../services/crawler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const status = await getCrawlerCycleStatus();
    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error: any) {
    console.error('Error fetching crawler cycle status:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve crawler cycle status', details: error?.message },
      { status: 500 }
    );
  }
}
