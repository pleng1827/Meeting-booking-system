import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { exportBookingsBatchToSheet } from '@/lib/google/sheets';
import { BookingSheetRow } from '@/types/google';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { startDate, endDate, tabName = 'Booking_History' } = body;

    const whereClause: any = {
      status: { not: 'CANCELLED' },
    };

    if (startDate && endDate) {
      whereClause.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        room: true,
        user: true,
        attachments: true,
      },
      orderBy: { startTime: 'desc' },
    });

    const rows: BookingSheetRow[] = bookings.map((b) => {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      const equipment = b.equipmentRequested ? JSON.parse(b.equipmentRequested).join(', ') : 'ไม่มี';
      const driveLinks = b.attachments.map((a) => a.driveWebViewLink).join('\n');

      return {
        bookingId: b.id,
        roomName: b.room.name,
        title: b.title,
        bookerName: b.user.name,
        bookerEmail: b.user.email,
        date: start.toLocaleDateString('th-TH'),
        startTime: start.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        endTime: end.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        attendeesCount: b.attendeesCount,
        equipment,
        status: b.status,
        driveLink: driveLinks || 'ไม่มีไฟล์แนบ',
        syncedAt: new Date().toISOString(),
      };
    });

    const result = await exportBookingsBatchToSheet(rows, tabName);

    // Update synced status
    if (result.success) {
      await prisma.booking.updateMany({
        where: {
          id: { in: bookings.map((b) => b.id) },
        },
        data: { syncedToSheets: true },
      });
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      rowCount: rows.length,
      spreadsheetId: result.spreadsheetId,
    });
  } catch (error: any) {
    console.error('Error syncing to Google Sheets:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}
