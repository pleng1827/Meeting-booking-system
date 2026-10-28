import { PrismaClient } from '@prisma/client';

export interface TimeInterval {
  start: Date;
  end: Date;
}

export interface OverlapValidationInput {
  roomId: string;
  startTime: Date;
  endTime: Date;
  excludeBookingId?: string;
}

export interface OverlapValidationResult {
  hasConflict: boolean;
  conflictingBooking?: {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    userName: string;
  } | null;
  message?: string;
}

/**
 * Pure mathematical check for interval overlap:
 * Two time ranges [A_start, A_end) and [B_start, B_end) overlap if and only if:
 * A_start < B_end AND A_end > B_start
 */
export function isTimeOverlapping(
  startA: Date | string,
  endA: Date | string,
  startB: Date | string,
  endB: Date | string
): boolean {
  const sA = new Date(startA).getTime();
  const eA = new Date(endA).getTime();
  const sB = new Date(startB).getTime();
  const eB = new Date(endB).getTime();

  if (sA >= eA || sB >= eB) {
    throw new Error('Start time must be strictly before end time.');
  }

  return sA < eB && eA > sB;
}

/**
 * Validates booking business rules before checking database.
 */
export function validateBookingTiming(startTime: Date, endTime: Date): { isValid: boolean; error?: string } {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  if (isNaN(start) || isNaN(end)) {
    return { isValid: false, error: 'รูปแบบวันและเวลาไม่ถูกต้อง' };
  }

  if (start >= end) {
    return { isValid: false, error: 'เวลาสิ้นสุดการประชุมต้องอยู่หลังเวลาเริ่มต้น' };
  }

  // Minimum duration: 15 minutes
  const minDurationMs = 15 * 60 * 1000;
  if (end - start < minDurationMs) {
    return { isValid: false, error: 'ระยะเวลาการจองต้องไม่น้อยกว่า 15 นาที' };
  }

  // Maximum duration: 12 hours
  const maxDurationMs = 12 * 60 * 60 * 1000;
  if (end - start > maxDurationMs) {
    return { isValid: false, error: 'ระยะเวลาการจองสูงสุดต้องไม่เกิน 12 ชั่วโมงต่อครั้ง' };
  }

  return { isValid: true };
}

/**
 * Checks database for conflicting active bookings for the specified room.
 * Strict Anti-Overlap Query:
 * WHERE roomId = :roomId
 *   AND status != 'CANCELLED'
 *   AND startTime < :newEndTime
 *   AND endTime > :newStartTime
 */
export async function checkBookingConflict(
  prisma: PrismaClient | any,
  input: OverlapValidationInput
): Promise<OverlapValidationResult> {
  const { roomId, startTime, endTime, excludeBookingId } = input;

  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      roomId,
      status: { not: 'CANCELLED' },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      room: {
        select: {
          name: true,
        },
      },
    },
  });

  if (conflictingBooking) {
    const startStr = new Date(conflictingBooking.startTime).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const endStr = new Date(conflictingBooking.endTime).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      hasConflict: true,
      conflictingBooking: {
        id: conflictingBooking.id,
        title: conflictingBooking.title,
        startTime: conflictingBooking.startTime,
        endTime: conflictingBooking.endTime,
        userName: conflictingBooking.user?.name || 'ผู้ใช้งานท่านอื่น',
      },
      message: `ช่วงเวลานี้ชนกับการจอง "${conflictingBooking.title}" โดยคุณ ${conflictingBooking.user?.name || ''} (${startStr} - ${endStr} น.)`,
    };
  }

  return {
    hasConflict: false,
    conflictingBooking: null,
  };
}
