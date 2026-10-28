import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateBookingTiming, checkBookingConflict } from '@/lib/booking-validator';
import { uploadFileToDrive } from '@/lib/google/drive';
import { appendBookingToSheet } from '@/lib/google/sheets';
import { broadcastBookingEvent } from '@/lib/event-bus';

// GET: Fetch bookings with optional filters
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const roomId = searchParams.get('roomId');
    const status = searchParams.get('status');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const whereClause: any = {};

    if (roomId && roomId !== 'ALL') {
      whereClause.roomId = roomId;
    }

    if (status) {
      whereClause.status = status;
    } else {
      // Default: do not show cancelled bookings on main calendar unless explicitly asked
      whereClause.status = { not: 'CANCELLED' };
    }

    if (start && end) {
      whereClause.AND = [
        { startTime: { lt: new Date(end) } },
        { endTime: { gt: new Date(start) } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        room: true,
        user: true,
        attachments: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Format for frontend
    const formatted = bookings.map((b) => ({
      ...b,
      equipmentRequested: b.equipmentRequested ? JSON.parse(b.equipmentRequested) : [],
      room: {
        ...b.room,
        equipment: b.room.equipment ? JSON.parse(b.room.equipment) : [],
      },
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// POST: Create booking with strict Anti-Overlap prevention and Google Workspace sync
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      roomId,
      title,
      description,
      startTime,
      endTime,
      attendeesCount,
      equipmentRequested = [],
      bookerName = 'ผู้ใช้งานระบบ',
      bookerEmail = 'user@company.internal',
      fileAttachment, // { fileName, mimeType, base64 }
    } = body;

    if (!roomId || !title || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลที่จำเป็น (ห้อง, หัวข้อ, เวลาเริ่มต้น-สิ้นสุด)' },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // 1. Timing validation
    const timingCheck = validateBookingTiming(start, end);
    if (!timingCheck.isValid) {
      return NextResponse.json(
        { success: false, error: timingCheck.error },
        { status: 400 }
      );
    }

    // 2. Room existence and capacity check
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room || !room.isActive) {
      return NextResponse.json(
        { success: false, error: 'ห้องประชุมที่ระบุไม่พร้อมใช้งานหรือถูกปิดชั่วคราว' },
        { status: 404 }
      );
    }

    const attendees = Number(attendeesCount) || 1;
    if (attendees > room.capacity) {
      return NextResponse.json(
        {
          success: false,
          error: `จำนวนผู้เข้าร่วม (${attendees} คน) เกินความจุของห้อง (${room.capacity} คน)`,
        },
        { status: 400 }
      );
    }

    // 3. User resolution (find or create temporary user for this booking)
    let user = await prisma.user.findFirst({
      where: { email: bookerEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: bookerName,
          email: bookerEmail,
          role: 'USER',
        },
      });
    }

    // 4. Anti-Overlap Check & Transaction execution
    const conflictResult = await checkBookingConflict(prisma, {
      roomId,
      startTime: start,
      endTime: end,
    });

    if (conflictResult.hasConflict) {
      return NextResponse.json(
        {
          success: false,
          error: conflictResult.message,
          conflict: conflictResult.conflictingBooking,
        },
        { status: 409 } // 409 Conflict
      );
    }

    // 5. Google Drive Upload (if attachment exists)
    let driveAttachmentData: {
      fileName: string;
      fileSize: number;
      mimeType: string;
      driveFileId: string;
      driveWebViewLink: string;
      driveDownloadLink?: string | null;
    } | null = null;

    if (fileAttachment && fileAttachment.base64 && fileAttachment.fileName) {
      try {
        const buffer = Buffer.from(fileAttachment.base64, 'base64');
        const uploadResult = await uploadFileToDrive({
          fileBuffer: buffer,
          fileName: fileAttachment.fileName,
          mimeType: fileAttachment.mimeType || 'application/octet-stream',
        });

        driveAttachmentData = {
          fileName: uploadResult.name,
          fileSize: uploadResult.size,
          mimeType: fileAttachment.mimeType || 'application/octet-stream',
          driveFileId: uploadResult.fileId,
          driveWebViewLink: uploadResult.webViewLink,
          driveDownloadLink: uploadResult.webContentLink || null,
        };
      } catch (uploadError) {
        console.warn('Google Drive attachment upload warning (non-fatal):', uploadError);
      }
    }

    // 6. Prisma Transaction to persist Booking and Attachment
    const createdBooking = await prisma.$transaction(async (tx) => {
      // Re-verify conflict inside transaction to avoid race condition
      const doubleCheck = await tx.booking.findFirst({
        where: {
          roomId,
          status: { not: 'CANCELLED' },
          startTime: { lt: end },
          endTime: { gt: start },
        },
      });

      if (doubleCheck) {
        throw new Error('ขออภัย มีผู้ใช้ท่านอื่นทำการจองช่วงเวลานี้ไปก่อนหน้าเพียงเสี้ยววินาที');
      }

      const booking = await tx.booking.create({
        data: {
          roomId,
          userId: user.id,
          title,
          description: description || null,
          startTime: start,
          endTime: end,
          attendeesCount: attendees,
          equipmentRequested: JSON.stringify(equipmentRequested),
          status: 'CONFIRMED',
          syncedToSheets: false,
        },
        include: {
          room: true,
          user: true,
        },
      });

      if (driveAttachmentData) {
        await tx.attachment.create({
          data: {
            bookingId: booking.id,
            ...driveAttachmentData,
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: user.id,
          bookingId: booking.id,
          title: 'ยืนยันการจองห้องประชุม',
          message: `คุณได้จอง ${room.name} วันที่ ${start.toLocaleDateString('th-TH')} เวลา ${start.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น. สำเร็จ`,
          type: 'BOOKING_CREATED',
        },
      });

      return booking;
    });

    // 7. Background Google Sheets sync (Async, non-blocking)
    const equipmentStr = equipmentRequested.length > 0 ? equipmentRequested.join(', ') : 'ไม่มี';
    const driveLinkStr = driveAttachmentData?.driveWebViewLink || '';

    appendBookingToSheet({
      bookingId: createdBooking.id,
      roomName: room.name,
      title: createdBooking.title,
      bookerName: user.name,
      bookerEmail: user.email,
      date: start.toLocaleDateString('th-TH'),
      startTime: start.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      endTime: end.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      attendeesCount: attendees,
      equipment: equipmentStr,
      status: createdBooking.status,
      driveLink: driveLinkStr,
      syncedAt: new Date().toISOString(),
    })
      .then(async (res) => {
        if (res.success) {
          await prisma.booking.update({
            where: { id: createdBooking.id },
            data: { syncedToSheets: true },
          });
        }
      })
      .catch((err) => console.warn('Google Sheets background sync error:', err));

    // 8. Broadcast Real-time SSE event to all connected calendar views
    broadcastBookingEvent({
      type: 'BOOKING_CREATED',
      bookingId: createdBooking.id,
      roomId: room.id,
      roomName: room.name,
      title: createdBooking.title,
      timestamp: new Date().toISOString(),
    });

    // Fetch complete saved booking with attachments
    const completeBooking = await prisma.booking.findUnique({
      where: { id: createdBooking.id },
      include: {
        room: true,
        user: true,
        attachments: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...completeBooking,
          equipmentRequested: completeBooking?.equipmentRequested
            ? JSON.parse(completeBooking.equipmentRequested)
            : [],
        },
        message: 'จองห้องประชุมสำเร็จ',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการจองห้องประชุม' },
      { status: 500 }
    );
  }
}
