import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';

    const requests = await prisma.changeRequest.findMany({
      where: status === 'all' ? {} : { status },
      include: {
        college: {
          select: {
            id: true,
            collegeName: true,
            state: true,
            district: true,
            country: true,
            officialWebsite: true,
            officialEmail: true,
            portalSource: true,
          },
        },
      },
      orderBy: { detectedAt: 'desc' },
    });

    const pendingCount = await prisma.changeRequest.count({
      where: { status: 'PENDING' },
    });

    return NextResponse.json({
      changeRequests: requests,
      count: requests.length,
      pendingCount,
    });
  } catch (error: any) {
    console.error('Error fetching change requests:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve change requests', details: error?.message },
      { status: 500 }
    );
  }
}
