import { EventEmitter } from 'events';

// Increase default max listeners to handle multiple browser tabs
const globalForEvents = global as unknown as { bookingEventEmitter: EventEmitter };

export const bookingEventEmitter =
  globalForEvents.bookingEventEmitter || new EventEmitter();

bookingEventEmitter.setMaxListeners(100);

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.bookingEventEmitter = bookingEventEmitter;
}

export type RealtimeBookingEvent = {
  type: 'BOOKING_CREATED' | 'BOOKING_CANCELLED' | 'BOOKING_UPDATED';
  bookingId: string;
  roomId: string;
  roomName?: string;
  title?: string;
  timestamp: string;
};

export function broadcastBookingEvent(event: RealtimeBookingEvent) {
  bookingEventEmitter.emit('booking-update', event);
}
