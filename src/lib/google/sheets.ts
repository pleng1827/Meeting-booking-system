import { google } from 'googleapis';
import { getGoogleAuthClient, isGoogleAuthConfigured } from './auth';
import { BookingSheetRow, GoogleSheetSyncResult } from '@/types/google';

export const SHEET_HEADERS = [
  'Booking ID',
  'ห้องประชุม (Room)',
  'หัวข้อการประชุม (Title)',
  'ผู้จอง (Booker)',
  'อีเมล (Email)',
  'วันที่ (Date)',
  'เวลาเริ่ม (Start Time)',
  'เวลาสิ้นสุด (End Time)',
  'จำนวนผู้เข้าร่วม (Attendees)',
  'อุปกรณ์ที่ขอใช้งาน (Equipment)',
  'สถานะ (Status)',
  'ไฟล์แนบ Google Drive (Attachment Link)',
  'เวลาที่ซิงค์ข้อมูล (Synced At)',
];

/**
 * Checks if Google Sheets integration is enabled and configured.
 */
export function isGoogleSheetsEnabled(): boolean {
  return isGoogleAuthConfigured() && Boolean(process.env.GOOGLE_SHEET_ID);
}

/**
 * Ensures that the header row exists in the spreadsheet.
 */
async function ensureHeaders(sheets: any, spreadsheetId: string, sheetName: string = 'Bookings') {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:M1`,
    });

    if (!response.data.values || response.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:M1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [SHEET_HEADERS],
        },
      });
    }
  } catch (error: any) {
    // If sheet doesn't exist, try creating it
    if (error.message?.includes('Unable to parse range') || error.code === 400) {
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetName,
                  },
                },
              },
            ],
          },
        });
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1:M1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [SHEET_HEADERS],
          },
        });
      } catch (addError) {
        console.warn('[GoogleSheets] Could not auto-create tab, will attempt append directly:', addError);
      }
    }
  }
}

/**
 * Appends a single booking row into the designated Google Sheet.
 */
export async function appendBookingToSheet(row: BookingSheetRow): Promise<GoogleSheetSyncResult> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!isGoogleSheetsEnabled() || !spreadsheetId) {
    console.log('[GoogleSheets:Mock] Credentials not set. Simulating sync for booking:', row.bookingId);
    return {
      spreadsheetId: 'MOCK_SPREADSHEET_ID',
      success: true,
      message: 'Mock Mode: Logged to local memory (Add GOOGLE_SHEET_ID & Credentials to sync to actual Google Sheets)',
      updatedRows: 1,
    };
  }

  try {
    const auth = getGoogleAuthClient();
    if (!auth) throw new Error('Failed to obtain Google Auth client');

    const sheets = google.sheets({ version: 'v4', auth });
    const sheetName = 'Bookings';

    await ensureHeaders(sheets, spreadsheetId, sheetName);

    const values = [
      [
        row.bookingId,
        row.roomName,
        row.title,
        row.bookerName,
        row.bookerEmail,
        row.date,
        row.startTime,
        row.endTime,
        row.attendeesCount,
        row.equipment,
        row.status,
        row.driveLink || 'ไม่มีไฟล์แนบ',
        row.syncedAt,
      ],
    ];

    const res = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:M`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });

    return {
      spreadsheetId,
      updatedRange: res.data.updates?.updatedRange || '',
      updatedRows: res.data.updates?.updatedRows || 1,
      success: true,
      message: 'Successfully synced booking row to Google Sheets',
    };
  } catch (error: any) {
    console.error('[GoogleSheets] Error appending row:', error);
    return {
      spreadsheetId: spreadsheetId || '',
      success: false,
      message: error.message || 'Failed to sync to Google Sheets',
    };
  }
}

/**
 * Exports multiple booking rows in batch to a designated sheet tab.
 */
export async function exportBookingsBatchToSheet(
  rows: BookingSheetRow[],
  targetTabName: string = 'Booking_Report'
): Promise<GoogleSheetSyncResult> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!isGoogleSheetsEnabled() || !spreadsheetId) {
    return {
      spreadsheetId: 'MOCK_SPREADSHEET_ID',
      success: true,
      message: `Mock Mode: Exported ${rows.length} rows (Configure GCP credentials to write to actual Google Sheets)`,
      updatedRows: rows.length,
    };
  }

  try {
    const auth = getGoogleAuthClient();
    if (!auth) throw new Error('Failed to obtain Google Auth client');

    const sheets = google.sheets({ version: 'v4', auth });

    // Ensure tab exists
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: targetTabName,
                },
              },
            },
          ],
        },
      });
    } catch {
      // Tab might already exist
    }

    const dataRows = rows.map((r) => [
      r.bookingId,
      r.roomName,
      r.title,
      r.bookerName,
      r.bookerEmail,
      r.date,
      r.startTime,
      r.endTime,
      r.attendeesCount,
      r.equipment,
      r.status,
      r.driveLink || 'ไม่มีไฟล์แนบ',
      r.syncedAt,
    ]);

    // Overwrite content
    const res = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${targetTabName}!A1:M${dataRows.length + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [SHEET_HEADERS, ...dataRows],
      },
    });

    return {
      spreadsheetId,
      updatedRange: res.data.updatedRange || '',
      updatedRows: (res.data.updatedRows || 0) - 1,
      success: true,
      message: `Successfully exported ${rows.length} records to sheet '${targetTabName}'`,
    };
  } catch (error: any) {
    console.error('[GoogleSheets] Batch export error:', error);
    return {
      spreadsheetId: spreadsheetId || '',
      success: false,
      message: error.message || 'Batch export failed',
    };
  }
}
