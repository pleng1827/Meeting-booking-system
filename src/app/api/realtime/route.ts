import { NextRequest } from 'next/server';
import { bookingEventEmitter, RealtimeBookingEvent } from '@/lib/event-bus';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial connected event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: new Date() })}\n\n`)
      );

      // 2. Event listener for booking updates
      const onBookingUpdate = (event: RealtimeBookingEvent) => {
        try {
          const payload = `event: booking-change\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          console.warn('[SSE] Error enqueuing message:', err);
        }
      };

      bookingEventEmitter.on('booking-update', onBookingUpdate);

      // 3. Heartbeat every 25 seconds to keep connection alive through proxies
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(interval);
        }
      }, 25000);

      // 4. Cleanup when client disconnects
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        bookingEventEmitter.off('booking-update', onBookingUpdate);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
