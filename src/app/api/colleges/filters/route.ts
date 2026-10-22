import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedState = searchParams.get('state');

    // Fetch distinct states (strictly alphabetic valid state names)
    const statesResult = await prisma.college.findMany({
      select: { state: true },
      distinct: ['state'],
      orderBy: { state: 'asc' },
    });
    const states = statesResult
      .map((s) => s.state)
      .filter((st) => Boolean(st) && !/^\d+/.test(st.trim()) && st.trim().length >= 3);

    // Fetch distinct districts (optionally filtered by selected state)
    const districtWhere: any = {};
    if (selectedState && selectedState !== 'all') {
      districtWhere.state = { equals: selectedState, mode: 'insensitive' };
    }

    const districtsResult = await prisma.college.findMany({
      where: districtWhere,
      select: { district: true },
      distinct: ['district'],
      orderBy: { district: 'asc' },
    });
    const rawDistricts = districtsResult
      .map((d) => d.district)
      .map((dst) => (dst || '').replace(/^["'\s(]+|["'\s)]+$/g, '').replace(/-\s*\d+.*$/g, '').trim())
      .filter((dst) => 
        Boolean(dst) && 
        dst.length >= 3 && 
        !/^\d+/.test(dst) && 
        !/pin\s*code/i.test(dst) &&
        !/\bpo\b|\btk\b/i.test(dst) &&
        !/post\s*box/i.test(dst) &&
        !/campus/i.test(dst)
      );

    // Deduplicate and sort
    const districts = Array.from(new Set(rawDistricts)).sort();

    // Common standard staff roles
    const standardRoles = [
      'All Roles',
      'Principal',
      'Dean',
      'Head of Department (HOD)',
      'Placement Officer',
      'Registrar',
    ];

    return NextResponse.json({
      states,
      districts,
      roles: standardRoles,
      countries: [
        { name: 'India', active: true },
        { name: 'United States (Coming Soon)', active: false },
        { name: 'United Kingdom (Coming Soon)', active: false },
        { name: 'Canada (Coming Soon)', active: false },
      ],
    });
  } catch (error: any) {
    console.error('Error fetching college filters:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve filter options' },
      { status: 500 }
    );
  }
}
