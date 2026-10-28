import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const roomId = searchParams.get('roomId');

    const whereClause: any = {};

    if (roomId && roomId !== 'ALL') {
      whereClause.roomId = roomId;
    }

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

    // Format rows for spreadsheet
    const worksheetData = bookings.map((b, index) => {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      const durationHours = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1);

      return {
        'ลำดับ (No.)': index + 1,
        'รหัสการจอง (Booking ID)': b.id,
        'ห้องประชุม (Room)': b.room.name,
        'สถานที่ (Location)': b.room.location,
        'หัวข้อการประชุม (Title)': b.title,
        'รายละเอียด (Description)': b.description || '-',
        'ผู้จอง (Booker)': b.user.name,
        'อีเมล (Email)': b.user.email,
        'แผนก (Department)': b.user.department || '-',
        'วันที่ (Date)': start.toLocaleDateString('th-TH'),
        'เวลาเริ่ม (Start)': start.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        'เวลาสิ้นสุด (End)': end.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        'ระยะเวลา (ชม.)': durationHours,
        'จำนวนผู้เข้าร่วม': b.attendeesCount,
        'สถานะ (Status)': b.status,
        'ไฟล์แนบ Google Drive': b.attachments.map((a) => a.driveWebViewLink).join('; ') || 'ไม่มี',
        'ซิงค์ Google Sheets แล้ว': b.syncedToSheets ? 'ใช่' : 'ยังไม่ได้ซิงค์',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'รายงานการจองห้องประชุม');

    // Auto-fit column widths
    const maxCols = worksheetData.length > 0 ? Object.keys(worksheetData[0]).length : 10;
    worksheet['!cols'] = Array(maxCols).fill({ wch: 22 });

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const filename = `meeting_bookings_report_${new Date().toISOString().split('T')[0]}.xlsx`;

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating Excel report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Export failed' },
      { status: 500 }
    );
  }
}
