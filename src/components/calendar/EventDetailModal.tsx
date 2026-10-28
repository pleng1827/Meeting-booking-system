'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Users,
  MapPin,
  ExternalLink,
  FileText,
  Trash2,
  CheckCircle2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { BookingData } from '@/types/booking';

interface EventDetailModalProps {
  booking: BookingData | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingCancelled: () => void;
}

export function EventDetailModal({
  booking,
  isOpen,
  onClose,
  onBookingCancelled,
}: EventDetailModalProps) {
  const [cancelling, setCancelling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !booking) return null;

  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);

  const handleCancelBooking = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onBookingCancelled();
        onClose();
      } else {
        alert('ไม่สามารถยกเลิกการจองได้');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการยกเลิก');
    } finally {
      setCancelling(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Room Color Bar */}
        <div
          className="h-3 w-full"
          style={{ backgroundColor: booking.room?.color || '#3b82f6' }}
        />

        <div className="p-6">
          {/* Header Action & Status */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-xs"
                style={{ backgroundColor: booking.room?.color || '#3b82f6' }}
              >
                {booking.room?.name || 'ห้องประชุม'}
              </span>
              {booking.syncedToSheets && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                  Synced to Sheets
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-slate-900 mt-3">{booking.title}</h2>

          {booking.description && (
            <p className="text-sm text-slate-600 mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              {booking.description}
            </p>
          )}

          {/* Meeting Details List */}
          <div className="space-y-3 mt-5">
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{start.toLocaleDateString('th-TH', { dateStyle: 'full' })}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                {start.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} -{' '}
                {end.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{booking.room?.location || '-'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <Users className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                ผู้จอง: <strong className="text-slate-900">{booking.user?.name}</strong> ({booking.user?.email})
                • ผู้เข้าร่วม {booking.attendeesCount} คน
              </span>
            </div>
          </div>

          {/* Requested Equipment */}
          {booking.equipmentRequested && booking.equipmentRequested.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                อุปกรณ์ที่ขอใช้งาน
              </p>
              <div className="flex flex-wrap gap-1.5">
                {booking.equipmentRequested.map((eq, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-700 font-medium"
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Google Drive Attachments */}
          {booking.attachments && booking.attachments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                เอกสารประกอบการประชุม (Google Drive)
              </p>
              <div className="space-y-2">
                {booking.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.driveWebViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-semibold text-blue-950 truncate group-hover:underline">
                          {att.fileName}
                        </p>
                        <p className="text-[11px] text-blue-600">
                          {(att.fileSize / 1024 / 1024).toFixed(2)} MB • เปิดดูใน Google Drive
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-blue-600 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Cancel Booking Section */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            {confirmDelete ? (
              <div className="flex items-center gap-2 w-full justify-end">
                <span className="text-xs text-rose-600 font-medium">ยืนยันยกเลิกการจองนี้?</span>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  ไม่
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  className="px-3 py-1.5 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'ใช่, ยกเลิก'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                ยกเลิกการจองห้องนี้
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
