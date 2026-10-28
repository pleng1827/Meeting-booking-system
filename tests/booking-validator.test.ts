import { describe, it, expect } from 'vitest';
import { isTimeOverlapping, validateBookingTiming } from '../src/lib/booking-validator';

describe('Anti-Overlap Logic (Double Booking Prevention)', () => {
  const existingStart = new Date('2026-10-28T10:00:00Z');
  const existingEnd = new Date('2026-10-28T11:30:00Z');

  it('detects exact same time interval conflict', () => {
    const newStart = new Date('2026-10-28T10:00:00Z');
    const newEnd = new Date('2026-10-28T11:30:00Z');

    expect(isTimeOverlapping(existingStart, existingEnd, newStart, newEnd)).toBe(true);
  });

  it('detects partial overlap: new booking starts before and ends inside existing booking', () => {
    const newStart = new Date('2026-10-28T09:30:00Z');
    const newEnd = new Date('2026-10-28T10:30:00Z');

    expect(isTimeOverlapping(existingStart, existingEnd, newStart, newEnd)).toBe(true);
  });

  it('detects partial overlap: new booking starts inside and ends after existing booking', () => {
    const newStart = new Date('2026-10-28T11:00:00Z');
    const newEnd = new Date('2026-10-28T12:00:00Z');

    expect(isTimeOverlapping(existingStart, existingEnd, newStart, newEnd)).toBe(true);
  });

  it('detects full enclosure: new booking completely inside existing booking', () => {
    const newStart = new Date('2026-10-28T10:15:00Z');
    const newEnd = new Date('2026-10-28T11:15:00Z');

    expect(isTimeOverlapping(existingStart, existingEnd, newStart, newEnd)).toBe(true);
  });

  it('detects outer enclosure: new booking encompasses existing booking completely', () => {
    const newStart = new Date('2026-10-28T09:00:00Z');
    const newEnd = new Date('2026-10-28T12:00:00Z');

    expect(isTimeOverlapping(existingStart, existingEnd, newStart, newEnd)).toBe(true);
  });

  it('allows back-to-back bookings where end time equals new start time (boundary touching)', () => {
    // Existing: 10:00 - 11:30, New: 11:30 - 12:30 -> Should NOT overlap!
    const newStart = new Date('2026-10-28T11:30:00Z');
    const newEnd = new Date('2026-10-28T12:30:00Z');

    expect(isTimeOverlapping(existingStart, existingEnd, newStart, newEnd)).toBe(false);
  });

  it('allows previous back-to-back bookings where new end time equals existing start time', () => {
    // Existing: 10:00 - 11:30, New: 08:30 - 10:00 -> Should NOT overlap!
    const newStart = new Date('2026-10-28T08:30:00Z');
    const newEnd = new Date('2026-10-28T10:00:00Z');

    expect(isTimeOverlapping(existingStart, existingEnd, newStart, newEnd)).toBe(false);
  });

  it('allows completely separate time slots without collision', () => {
    const newStart = new Date('2026-10-28T14:00:00Z');
    const newEnd = new Date('2026-10-28T15:00:00Z');

    expect(isTimeOverlapping(existingStart, existingEnd, newStart, newEnd)).toBe(false);
  });

  it('throws an error if start time is after or equal to end time', () => {
    const badStart = new Date('2026-10-28T12:00:00Z');
    const badEnd = new Date('2026-10-28T11:00:00Z');

    expect(() => isTimeOverlapping(badStart, badEnd, existingStart, existingEnd)).toThrow();
  });
});

describe('Booking Timing Business Rule Validations', () => {
  it('rejects booking when end time is before start time', () => {
    const start = new Date('2026-10-28T14:00:00Z');
    const end = new Date('2026-10-28T13:00:00Z');

    const result = validateBookingTiming(start, end);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('เวลาสิ้นสุดการประชุมต้องอยู่หลังเวลาเริ่มต้น');
  });

  it('rejects booking with duration shorter than 15 minutes', () => {
    const start = new Date('2026-10-28T10:00:00Z');
    const end = new Date('2026-10-28T10:10:00Z'); // 10 mins

    const result = validateBookingTiming(start, end);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('15 นาที');
  });

  it('rejects booking longer than 12 hours', () => {
    const start = new Date('2026-10-28T08:00:00Z');
    const end = new Date('2026-10-28T21:00:00Z'); // 13 hours

    const result = validateBookingTiming(start, end);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('12 ชั่วโมง');
  });

  it('accepts valid 1 hour booking', () => {
    const start = new Date('2026-10-28T10:00:00Z');
    const end = new Date('2026-10-28T11:00:00Z');

    const result = validateBookingTiming(start, end);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
