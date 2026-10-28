export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface RoomEquipment {
  name: string;
  icon?: string;
}

export interface CurrentBookingSummary {
  id: string;
  title: string;
  startTime: Date | string;
  endTime: Date | string;
  bookerName?: string;
  attendeesCount?: number;
}

export interface RoomData {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  location: string;
  equipment: string[]; // parsed from JSON
  imageUrl: string | null;
  color: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: {
    bookings: number;
  };
  currentStatus?: 'AVAILABLE' | 'IN_USE';
  currentBooking?: CurrentBookingSummary | BookingData | null;
}

export interface AttachmentData {
  id: string;
  bookingId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  driveFileId: string;
  driveWebViewLink: string;
  driveDownloadLink: string | null;
  createdAt: Date | string;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  avatarUrl: string | null;
}

export interface BookingData {
  id: string;
  roomId: string;
  userId: string;
  title: string;
  description: string | null;
  startTime: Date | string;
  endTime: Date | string;
  attendeesCount: number;
  equipmentRequested: string[]; // parsed from JSON
  status: BookingStatus;
  syncedToSheets: boolean;
  sheetRowId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  room?: RoomData;
  user?: UserData;
  attachments?: AttachmentData[];
}

export interface CreateBookingInput {
  roomId: string;
  userId?: string;
  bookerName?: string;
  bookerEmail?: string;
  title: string;
  description?: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  attendeesCount: number;
  equipmentRequested?: string[];
  file?: {
    name: string;
    type: string;
    size: number;
    base64: string;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    roomName: string;
    roomId: string;
    userName: string;
    userEmail: string;
    attendeesCount: number;
    status: BookingStatus;
    description: string | null;
    attachments: AttachmentData[];
    equipment: string[];
    syncedToSheets: boolean;
  };
}
