'use client';

import { useEffect, useRef } from 'react';
import { RealtimeBookingEvent } from '@/lib/event-bus';

interface UseRealtimeBookingsOptions {
  onEvent?: (event: RealtimeBookingEvent) => void;
  enabled?: boolean;
}

export function useRealtimeBookings({
  onEvent,
  enabled = true,
}: UseRealtimeBookingsOptions = {}) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const connectSSE = () => {
      try {
        const es = new EventSource('/api/realtime');
        eventSourceRef.current = es;

        es.addEventListener('booking-change', (e: MessageEvent) => {
          try {
            const data: RealtimeBookingEvent = JSON.parse(e.data);
            if (onEvent) {
              onEvent(data);
            }
          } catch (err) {
            console.error('[SSE] Failed to parse event data:', err);
          }
        });

        es.onerror = () => {
          es.close();
          // Auto retry connection in 5 seconds
          setTimeout(connectSSE, 5000);
        };
      } catch (err) {
        console.warn('[SSE] Connection error:', err);
      }
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [enabled, onEvent]);
}
