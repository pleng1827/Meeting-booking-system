import { describe, it, expect } from 'vitest';
import { appendBookingToSheet, exportBookingsBatchToSheet, SHEET_HEADERS } from '../src/lib/google/sheets';
import { uploadFileToDrive } from '../src/lib/google/drive';

describe('Google Workspace Integration Modules', () => {
  it('has required Google Sheet header definition', () => {
    expect(SHEET_HEADERS).toContain('Booking ID');
    expect(SHEET_HEADERS).toContain('ห้องประชุม (Room)');
    expect(SHEET_HEADERS).toContain('หัวข้อการประชุม (Title)');
    expect(SHEET_HEADERS).toContain('ไฟล์แนบ Google Drive (Attachment Link)');
  });

  it('gracefully handles mock mode when Google Sheets credentials are not configured', async () => {
    const mockRow = {
      bookingId: 'test_bk_001',
      roomName: 'Grand Boardroom',
      title: 'Strategy Review',
      bookerName: 'สมชาย รักดี',
      bookerEmail: 'somchai@company.com',
      date: '28/10/2026',
      startTime: '10:00',
      endTime: '11:00',
      attendeesCount: 5,
      equipment: 'Projector',
      status: 'CONFIRMED',
      driveLink: 'https://drive.google.com/test',
      syncedAt: new Date().toISOString(),
    };

    const result = await appendBookingToSheet(mockRow);
    expect(result.success).toBe(true);
    expect(result.updatedRows).toBe(1);
  });

  it('gracefully handles batch mock mode for reporting export', async () => {
    const mockRows = [
      {
        bookingId: 'test_bk_001',
        roomName: 'Boardroom',
        title: 'Meeting 1',
        bookerName: 'User 1',
        bookerEmail: 'user1@test.com',
        date: '28/10/2026',
        startTime: '09:00',
        endTime: '10:00',
        attendeesCount: 3,
        equipment: 'TV',
        status: 'CONFIRMED',
        driveLink: '',
        syncedAt: new Date().toISOString(),
      },
    ];

    const result = await exportBookingsBatchToSheet(mockRows, 'TestTab');
    expect(result.success).toBe(true);
    expect(result.updatedRows).toBe(1);
  });

  it('generates mock Google Drive file link when credentials are not configured', async () => {
    const sampleBuffer = Buffer.from('Mock PDF Content for Meeting Slides');
    const result = await uploadFileToDrive({
      fileBuffer: sampleBuffer,
      fileName: 'Meeting_Slides_Q4.pdf',
      mimeType: 'application/pdf',
    });

    expect(result.fileId).toBeDefined();
    expect(result.name).toBe('Meeting_Slides_Q4.pdf');
    expect(result.webViewLink).toContain('drive.google.com/file/d/');
    expect(result.size).toBe(sampleBuffer.length);
  });
});
