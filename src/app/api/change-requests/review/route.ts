import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, requestIds, action, reviewerName } = body;

    if (!action || (action !== 'APPROVE' && action !== 'REJECT')) {
      return NextResponse.json(
        { error: "Action must be strictly 'APPROVE' or 'REJECT'" },
        { status: 400 }
      );
    }

    const idsToProcess: string[] = [];
    if (requestId && typeof requestId === 'string') {
      idsToProcess.push(requestId);
    }
    if (Array.isArray(requestIds)) {
      for (const id of requestIds) {
        if (id && typeof id === 'string' && !idsToProcess.includes(id)) {
          idsToProcess.push(id);
        }
      }
    }

    if (idsToProcess.length === 0) {
      return NextResponse.json(
        { error: 'Please provide at least one valid requestId or requestIds array' },
        { status: 400 }
      );
    }

    const reviewer = reviewerName || 'Administrative Reviewer';
    const now = new Date();
    let approvedCount = 0;
    let rejectedCount = 0;

    for (const id of idsToProcess) {
      const cr = await prisma.changeRequest.findUnique({
        where: { id },
        include: { college: true },
      });

      if (!cr || cr.status !== 'PENDING') {
        continue; // Skip non-existent or already processed items
      }

      if (action === 'APPROVE') {
        // Apply changes to the live active directory
        if (cr.targetEntity === 'COLLEGE') {
          const updateData: any = {};
          if (cr.fieldName === 'officialEmail') updateData.officialEmail = cr.newValue;
          if (cr.fieldName === 'officialWebsite') updateData.officialWebsite = cr.newValue;
          if (cr.fieldName === 'contactNumber') updateData.contactNumber = cr.newValue;

          if (Object.keys(updateData).length > 0) {
            await prisma.college.update({
              where: { id: cr.collegeId },
              data: updateData,
            });
          }
        } else if (cr.targetEntity === 'STAFF') {
          if (cr.changeType === 'NEW_STAFF_FOUND') {
            // Upsert new staff contact into verified active directory
            await prisma.staffContact.upsert({
              where: {
                collegeId_role_email: {
                  collegeId: cr.collegeId,
                  role: cr.staffRole || 'Staff',
                  email: cr.newValue,
                },
              },
              update: {
                isActive: true,
                sourceUrl: cr.sourceUrl || undefined,
              },
              create: {
                collegeId: cr.collegeId,
                role: cr.staffRole || 'Staff',
                email: cr.newValue,
                sourceUrl: cr.sourceUrl,
                isActive: true,
              },
            });
          } else if (cr.changeType === 'STAFF_EMAIL_CHANGED') {
            // Find existing contact matching role or old email
            const existingContact = await prisma.staffContact.findFirst({
              where: {
                collegeId: cr.collegeId,
                role: cr.staffRole || undefined,
                ...(cr.oldValue ? { email: cr.oldValue } : {}),
              },
            });

            if (existingContact) {
              await prisma.staffContact.update({
                where: { id: existingContact.id },
                data: {
                  email: cr.newValue,
                  sourceUrl: cr.sourceUrl || undefined,
                  isActive: true,
                },
              });
            } else {
              // If none was found, create as new active contact
              await prisma.staffContact.create({
                data: {
                  collegeId: cr.collegeId,
                  role: cr.staffRole || 'Staff',
                  email: cr.newValue,
                  sourceUrl: cr.sourceUrl,
                  isActive: true,
                },
              });
            }
          }
        }

        // Mark change request as APPROVED
        await prisma.changeRequest.update({
          where: { id: cr.id },
          data: {
            status: 'APPROVED',
            reviewedAt: now,
            reviewedBy: reviewer,
          },
        });
        approvedCount++;
      } else if (action === 'REJECT') {
        // Do NOT modify live college or staff directory data
        await prisma.changeRequest.update({
          where: { id: cr.id },
          data: {
            status: 'REJECTED',
            reviewedAt: now,
            reviewedBy: reviewer,
          },
        });
        rejectedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      action,
      processedCount: idsToProcess.length,
      approvedCount,
      rejectedCount,
      message:
        action === 'APPROVE'
          ? `Successfully approved ${approvedCount} change request(s) and updated the live directory.`
          : `Successfully rejected ${rejectedCount} change request(s) without modifying directory records.`,
    });
  } catch (error: any) {
    console.error('Error reviewing change requests:', error);
    return NextResponse.json(
      { error: 'Failed to process change request review', details: error?.message },
      { status: 500 }
    );
  }
}
