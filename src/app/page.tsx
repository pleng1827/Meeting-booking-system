'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/common/Navbar';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { BookingFormModal } from '@/components/booking/BookingFormModal';
import { EventDetailModal } from '@/components/calendar/EventDetailModal';
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings';
import { BookingData, RoomData } from '@/types/booking';
import dynamic from 'next/dynamic';

const RoomCalendar = dynamic(
  () => import('@/components/calendar/RoomCalendar').then((mod) => mod.RoomCalendar),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
        กำลังโหลดปฏิทินห้องประชุม...
      </div>
    ),
  }
);
import {
  Users,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Plus,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRoomsNow: 0,
    activeMeetingsNow: 0,
    totalBookingsToday: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<BookingData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<Date | null>(null);
  const [prefilledRoomId, setPrefilledRoomId] = useState<string | undefined>();

  // Real-time toast alert state
  const [liveToast, setLiveToast] = useState<string | null>(null);

  // Fetch all initial data
  const loadData = useCallback(async () => {
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/bookings'),
      ]);

      const roomsJson = await roomsRes.json();
      const bookingsJson = await bookingsRes.json();

      if (roomsJson.success) {
        setRooms(roomsJson.data);
        if (roomsJson.stats) {
          setStats(roomsJson.stats);
        }
      }

      if (bookingsJson.success) {
        setBookings(bookingsJson.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Hook up SSE Real-time Updates
  useRealtimeBookings({
    onEvent: (event) => {
      loadData();
      let msg = '';
      if (event.type === 'BOOKING_CREATED') {
        msg = `มีการจองห้องประชุมใหม่: "${event.title}" (${event.roomName})`;
      } else if (event.type === 'BOOKING_CANCELLED') {
        msg = `มีการยกเลิกการจองห้อง: ${event.roomName}`;
      } else {
        msg = `มีการอัปเดตการจอง: ${event.title}`;
      }
      setLiveToast(msg);
      setTimeout(() => setLiveToast(null), 4500);
    },
  });

  const handleOpenNewBooking = (date?: Date, roomId?: string) => {
    setPrefilledDate(date || new Date());
    setPrefilledRoomId(roomId);
    setIsBookingModalOpen(true);
  };

  const handleSelectEvent = (booking: BookingData) => {
    setSelectedEvent(booking);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-16">
      <Navbar onOpenBookingModal={() => handleOpenNewBooking()} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Real-time Toast Alert */}
        {liveToast && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-sm font-medium">{liveToast}</span>
          </div>
        )}

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              ตารางการใช้ห้องประชุม & แดชบอร์ด
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              ตรวจสอบสถานะห้องว่างแบบ Real-time จองห้องประชุม และบันทึกข้อมูลซิงค์ลง Google Sheets อัตโนมัติ
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData()}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              รีเฟรชข้อมูล
            </button>
            <button
              onClick={() => handleOpenNewBooking()}
              className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              จองห้องประชุม
            </button>
          </div>
        </div>

        {/* Stats Overview Cards */}
        <StatsOverview stats={stats} />

        {/* Live Room Status Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800">สถานะห้องประชุมประจำวันนี้</h2>
            <span className="text-xs text-slate-500">คลิกที่ห้องเพื่อจองด่วน</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rooms.map((room) => {
              const isAvailable = room.currentStatus === 'AVAILABLE';
              return (
                <div
                  key={room.id}
                  onClick={() => handleOpenNewBooking(undefined, room.id)}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full mb-2"
                        style={{ backgroundColor: room.color }}
                      />
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {room.name}
                      </h3>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1 ${
                          isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      {isAvailable ? 'ว่าง' : 'กำลังใช้งาน'}
                    </span>
                  </div>

                  <div className="mt-3 text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{room.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>ความจุ {room.capacity} ที่นั่ง</span>
                    </div>
                  </div>

                  {room.currentBooking ? (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-amber-700 bg-amber-50/50 p-2 rounded-xl">
                      <p className="font-semibold truncate">
                        ประชุมอยู่: {room.currentBooking.title}
                      </p>
                      <p className="text-[10px] text-amber-600 mt-0.5">
                        โดย {(room.currentBooking as any)?.bookerName || 'ผู้ใช้งาน'}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-emerald-700 flex items-center justify-between">
                      <span>ว่างตลอดช่วงเวลานี้</span>
                      <span className="font-semibold text-blue-600 group-hover:underline">จองเลย &rarr;</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive FullCalendar View */}
        <RoomCalendar
          bookings={bookings}
          rooms={rooms}
          onSelectEvent={handleSelectEvent}
          onSelectDateSlot={(date, roomId) => handleOpenNewBooking(date, roomId)}
        />
      </main>

      {/* Booking Form Modal */}
      <BookingFormModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        rooms={rooms}
        initialDate={prefilledDate}
        initialRoomId={prefilledRoomId}
        onBookingSuccess={() => {
          loadData();
          setLiveToast('จองห้องประชุมสำเร็จ! ข้อมูลถูกซิงค์ไปยัง Google Workspace แล้ว');
          setTimeout(() => setLiveToast(null), 4000);
        }}
      />

      {/* Event Details Modal */}
      <EventDetailModal
        booking={selectedEvent}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEvent(null);
        }}
        onBookingCancelled={() => {
          loadData();
          setLiveToast('ยกเลิกการจองเรียบร้อยแล้ว');
          setTimeout(() => setLiveToast(null), 4000);
        }}
      />
    </div>
  );
}
