import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();

    // Start and end of today
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Fetch all active rooms
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      include: {
        bookings: {
          where: {
            status: { not: 'CANCELLED' },
            startTime: { lt: endOfToday },
            endTime: { gt: startOfToday },
          },
          include: {
            user: { select: { name: true, email: true } },
          },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    let activeMeetingsCount = 0;

    const formattedRooms = rooms.map((room) => {
      // Find ongoing meeting right now
      const currentBooking = room.bookings.find(
        (b) => new Date(b.startTime) <= now && new Date(b.endTime) > now
      );

      const isAvailableNow = !currentBooking;
      if (currentBooking) {
        activeMeetingsCount++;
      }

      return {
        id: room.id,
        name: room.name,
        description: room.description,
        capacity: room.capacity,
        location: room.location,
        color: room.color,
        imageUrl: room.imageUrl,
        equipment: room.equipment ? JSON.parse(room.equipment) : [],
        isActive: room.isActive,
        currentStatus: isAvailableNow ? ('AVAILABLE' as const) : ('IN_USE' as const),
        currentBooking: currentBooking
          ? {
              id: currentBooking.id,
              title: currentBooking.title,
              startTime: currentBooking.startTime,
              endTime: currentBooking.endTime,
              bookerName: currentBooking.user?.name,
              attendeesCount: currentBooking.attendeesCount,
            }
          : null,
        todaysBookingsCount: room.bookings.length,
      };
    });

    // 2. Aggregate stats
    const totalBookingsToday = await prisma.booking.count({
      where: {
        status: { not: 'CANCELLED' },
        startTime: { lt: endOfToday },
        endTime: { gt: startOfToday },
      },
    });

    const stats = {
      totalRooms: rooms.length,
      availableRoomsNow: rooms.length - activeMeetingsCount,
      activeMeetingsNow: activeMeetingsCount,
      totalBookingsToday,
    };

    return NextResponse.json({
      success: true,
      data: formattedRooms,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}
