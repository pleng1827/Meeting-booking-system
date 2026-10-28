export interface GoogleAuthCredentials {
  clientEmail?: string;
  privateKey?: string;
  projectId?: string;
  keyFilePath?: string;
}

export interface GoogleDriveUploadResult {
  fileId: string;
  name: string;
  webViewLink: string;
  webContentLink?: string;
  size: number;
}

export interface GoogleSheetSyncResult {
  spreadsheetId: string;
  updatedRange?: string;
  updatedRows?: number;
  success: boolean;
  message: string;
}

export interface BookingSheetRow {
  bookingId: string;
  roomName: string;
  title: string;
  bookerName: string;
  bookerEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  attendeesCount: number;
  equipment: string;
  status: string;
  driveLink: string;
  syncedAt: string;
}
