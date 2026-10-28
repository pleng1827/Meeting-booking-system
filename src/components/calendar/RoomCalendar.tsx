'use client';

import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { BookingData, RoomData } from '@/types/booking';
import { Paperclip, Sparkles, Filter } from 'lucide-react';

interface RoomCalendarProps {
  bookings: BookingData[];
  rooms: RoomData[];
  onSelectEvent: (booking: BookingData) => void;
  onSelectDateSlot: (date: Date, roomId?: string) => void;
}

export function RoomCalendar({
  bookings,
  rooms,
  onSelectEvent,
  onSelectDateSlot,
}: RoomCalendarProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('ALL');

  // Filter bookings
  const filteredBookings =
    selectedRoomId === 'ALL'
      ? bookings
      : bookings.filter((b) => b.roomId === selectedRoomId);

  // Transform bookings to FullCalendar Event inputs
  const calendarEvents = filteredBookings.map((b) => {
    const roomColor = b.room?.color || '#3b82f6';
    const hasAttachments = b.attachments && b.attachments.length > 0;

    return {
      id: b.id,
      title: b.title,
      start: new Date(b.startTime).toISOString(),
      end: new Date(b.endTime).toISOString(),
      backgroundColor: roomColor,
      borderColor: roomColor,
      textColor: '#ffffff',
      extendedProps: {
        rawBooking: b,
        roomName: b.room?.name,
        bookerName: b.user?.name,
        hasAttachments,
      },
    };
  });

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
      {/* Room Filters Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            กรองตามห้องประชุม:
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedRoomId('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              selectedRoomId === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทุกห้อง ({bookings.length})
          </button>

          {rooms.map((r) => {
            const isSelected = selectedRoomId === r.id;
            const count = bookings.filter((b) => b.roomId === r.id).length;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRoomId(r.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                  isSelected
                    ? 'border-transparent text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
                style={isSelected ? { backgroundColor: r.color } : {}}
              >
                {!isSelected && (
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: r.color }}
                  />
                )}
                <span>{r.name.split(' (')[0]}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FullCalendar Component */}
      <div className="calendar-container">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          buttonText={{
            today: 'วันนี้',
            month: 'เดือน',
            week: 'สัปดาห์',
            day: 'วัน',
          }}
          locale="th"
          firstDay={1}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          selectable={true}
          selectMirror={true}
          events={calendarEvents}
          eventClick={(info) => {
            const rawBooking = info.event.extendedProps.rawBooking;
            if (rawBooking) {
              onSelectEvent(rawBooking);
            }
          }}
          dateClick={(info) => {
            onSelectDateSlot(info.date, selectedRoomId !== 'ALL' ? selectedRoomId : undefined);
          }}
          eventContent={(eventInfo) => {
            const hasAttachments = eventInfo.event.extendedProps.hasAttachments;
            const roomName = eventInfo.event.extendedProps.roomName;
            return (
              <div className="p-1 overflow-hidden leading-tight text-white h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold opacity-90">
                    <span className="truncate">{roomName}</span>
                    {hasAttachments && <Paperclip className="w-3 h-3 shrink-0 ml-1 text-white/90" />}
                  </div>
                  <div className="font-bold text-xs truncate mt-0.5">{eventInfo.event.title}</div>
                </div>
                <div className="text-[10px] opacity-80 mt-0.5">{eventInfo.timeText}</div>
              </div>
            );
          }}
          height="auto"
        />
      </div>

      <style jsx global>{`
        .fc {
          --fc-border-color: #f1f5f9;
          --fc-today-bg-color: #f8fafc;
          --fc-button-bg-color: #2563eb;
          --fc-button-border-color: #2563eb;
          --fc-button-hover-bg-color: #1d4ed8;
          --fc-button-hover-border-color: #1d4ed8;
          --fc-button-active-bg-color: #1e40af;
          --fc-button-active-border-color: #1e40af;
          font-family: inherit;
        }
        .fc .fc-toolbar-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0f172a;
        }
        .fc .fc-button {
          font-size: 0.8125rem;
          font-weight: 600;
          border-radius: 0.75rem;
          padding: 0.45rem 0.9rem;
          text-transform: capitalize;
        }
        .fc .fc-event {
          border-radius: 0.5rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          cursor: pointer;
          border: none;
          padding: 1px 3px;
        }
        .fc .fc-col-header-cell-cushion {
          color: #475569;
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 8px 0;
        }
        .fc .fc-timegrid-slot-label-cushion {
          color: #64748b;
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}
