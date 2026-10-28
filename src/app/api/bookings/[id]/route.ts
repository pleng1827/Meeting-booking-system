import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkBookingConflict, validateBookingTiming } from '@/lib/booking-validator';
import { broadcastBookingEvent } from '@/lib/event-bus';

// GET: Single booking details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: true,
        user: true,
        attachments: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบรายการจองห้องประชุมนี้' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...booking,
        equipmentRequested: booking.equipmentRequested ? JSON.parse(booking.equipmentRequested) : [],
        room: {
          ...booking.room,
          equipment: booking.room.equipment ? JSON.parse(booking.room.equipment) : [],
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching booking' },
      { status: 500 }
    );
  }
}

// DELETE: Cancel booking
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบรายการจองห้องประชุมนี้' },
        { status: 404 }
      );
    }

    // Mark as CANCELLED instead of hard delete for audit history
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { room: true },
    });

    // Notify connected calendar clients
    broadcastBookingEvent({
      type: 'BOOKING_CANCELLED',
      bookingId: id,
      roomId: booking.roomId,
      roomName: booking.room.name,
      title: booking.title,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'ยกเลิกการจองห้องประชุมเรียบร้อยแล้ว',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error cancelling booking' },
      { status: 500 }
    );
  }
}

// PATCH: Update booking
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.booking.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบรายการจองห้องประชุมนี้' },
        { status: 404 }
      );
    }

    const newStart = body.startTime ? new Date(body.startTime) : existing.startTime;
    const newEnd = body.endTime ? new Date(body.endTime) : existing.endTime;
    const newRoomId = body.roomId || existing.roomId;

    // Check time change overlap
    if (body.startTime || body.endTime || body.roomId) {
      const timingCheck = validateBookingTiming(newStart, newEnd);
      if (!timingCheck.isValid) {
        return NextResponse.json({ success: false, error: timingCheck.error }, { status: 400 });
      }

      const conflictCheck = await checkBookingConflict(prisma, {
        roomId: newRoomId,
        startTime: newStart,
        endTime: newEnd,
        excludeBookingId: id,
      });

      if (conflictCheck.hasConflict) {
        return NextResponse.json(
          { success: false, error: conflictCheck.message },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.startTime && { startTime: newStart }),
        ...(body.endTime && { endTime: newEnd }),
        ...(body.roomId && { roomId: newRoomId }),
        ...(body.status && { status: body.status }),
        ...(body.attendeesCount && { attendeesCount: Number(body.attendeesCount) }),
        ...(body.equipmentRequested && {
          equipmentRequested: JSON.stringify(body.equipmentRequested),
        }),
      },
      include: { room: true },
    });

    broadcastBookingEvent({
      type: 'BOOKING_UPDATED',
      bookingId: id,
      roomId: updated.roomId,
      roomName: updated.room.name,
      title: updated.title,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'อัปเดตข้อมูลการจองสำเร็จ',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error updating booking' },
      { status: 500 }
    );
  }
}
