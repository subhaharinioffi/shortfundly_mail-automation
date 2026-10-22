import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedState = searchParams.get('state');

    // Fetch distinct states
    const statesResult = await prisma.college.findMany({
      select: { state: true },
      distinct: ['state'],
      orderBy: { state: 'asc' },
    });
    const states = statesResult.map((s) => s.state).filter(Boolean);

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
    const districts = districtsResult.map((d) => d.district).filter(Boolean);

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
