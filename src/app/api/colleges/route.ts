import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || '';
    const state = searchParams.get('state') || '';
    const district = searchParams.get('district') || '';
    const role = searchParams.get('role') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = (page - 1) * limit;

    const where: any = {};

    // Filter by Country (default India)
    if (country && country !== 'all') {
      where.country = { equals: country, mode: 'insensitive' };
    }

    // Filter by State
    if (state && state !== 'all') {
      where.state = { equals: state, mode: 'insensitive' };
    }

    // Filter by District
    if (district && district !== 'all') {
      where.district = { equals: district, mode: 'insensitive' };
    }

    // Filter by Staff Role
    if (role && role !== 'all') {
      where.contacts = {
        some: {
          role: { contains: role, mode: 'insensitive' },
          isActive: true,
        },
      };
    }

    // Search query across college name, official email, website, and contacts
    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { collegeName: { contains: q, mode: 'insensitive' } },
        { officialEmail: { contains: q, mode: 'insensitive' } },
        { officialWebsite: { contains: q, mode: 'insensitive' } },
        {
          contacts: {
            some: {
              OR: [
                { email: { contains: q, mode: 'insensitive' } },
                { personName: { contains: q, mode: 'insensitive' } },
                { department: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    // Fetch colleges with active contacts and pending change request counts
    const [total, colleges] = await Promise.all([
      prisma.college.count({ where }),
      prisma.college.findMany({
        where,
        include: {
          contacts: {
            where: { isActive: true },
            orderBy: { role: 'asc' },
          },
          changeRequests: {
            where: { status: 'PENDING' },
            select: { id: true, changeType: true, fieldName: true, newValue: true },
          },
        },
        orderBy: { collegeName: 'asc' },
        skip: offset,
        take: limit,
      }),
    ]);

    // Format response
    return NextResponse.json({
      colleges,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Error fetching colleges:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve colleges from database', details: error?.message },
      { status: 500 }
    );
  }
}
