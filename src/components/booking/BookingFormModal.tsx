'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, FileUp, AlertTriangle, CheckCircle2, MapPin, Sparkles, Loader2 } from 'lucide-react';
import { RoomData } from '@/types/booking';

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: RoomData[];
  onBookingSuccess: () => void;
  initialDate?: Date | null;
  initialRoomId?: string;
}

export function BookingFormModal({
  isOpen,
  onClose,
  rooms,
  onBookingSuccess,
  initialDate,
  initialRoomId,
}: BookingFormModalProps) {
  const [roomId, setRoomId] = useState(initialRoomId || (rooms[0]?.id ?? ''));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [attendeesCount, setAttendeesCount] = useState(4);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [bookerName, setBookerName] = useState('วิรยาภรณ์ แสนดี');
  const [bookerEmail, setBookerEmail] = useState('wirayaporn@company.internal');

  // File Attachment State
  const [fileData, setFileData] = useState<{
    fileName: string;
    mimeType: string;
    size: number;
    base64: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Initialize prefilled date/room when modal opens
  useEffect(() => {
    if (initialDate) {
      const yyyy = initialDate.getFullYear();
      const mm = String(initialDate.getMonth() + 1).padStart(2, '0');
      const dd = String(initialDate.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);

      const startH = String(initialDate.getHours()).padStart(2, '0');
      const startM = String(initialDate.getMinutes()).padStart(2, '0');
      if (initialDate.getHours() !== 0 || initialDate.getMinutes() !== 0) {
        setStartTime(`${startH}:${startM}`);
        const endH = String((initialDate.getHours() + 1) % 24).padStart(2, '0');
        setEndTime(`${endH}:${startM}`);
      }
    } else {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
    }

    if (initialRoomId) {
      setRoomId(initialRoomId);
    } else if (rooms.length > 0 && !roomId) {
      setRoomId(rooms[0].id);
    }
  }, [initialDate, initialRoomId, rooms, isOpen]);

  // Selected room details
  const selectedRoom = rooms.find((r) => r.id === roomId) || rooms[0];

  const handleEquipmentToggle = (item: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setGeneralError('ขนาดไฟล์ต้องไม่เกิน 25 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      setFileData({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        base64: base64String,
      });
      setGeneralError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);
    setGeneralError(null);

    if (!roomId) {
      setGeneralError('กรุณาเลือกห้องประชุม');
      return;
    }
    if (!title.trim()) {
      setGeneralError('กรุณาระบุหัวข้อการประชุม');
      return;
    }
    if (!date) {
      setGeneralError('กรุณาเลือกวันที่');
      return;
    }

    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);

    if (startDateTime >= endDateTime) {
      setGeneralError('เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        roomId,
        title,
        description,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        attendeesCount: Number(attendeesCount),
        equipmentRequested: selectedEquipment,
        bookerName,
        bookerEmail,
        fileAttachment: fileData,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          // Double-booking conflict
          setConflictError(data.error || 'ช่วงเวลานี้มีผู้จองห้องประชุมไปแล้ว กรุณาเลือกเวลาอื่น');
        } else {
          setGeneralError(data.error || 'เกิดข้อผิดพลาดในการจอง');
        }
        setLoading(false);
        return;
      }

      // Success
      setLoading(false);
      onBookingSuccess();
      onClose();

      // Reset form
      setTitle('');
      setDescription('');
      setFileData(null);
      setSelectedEquipment([]);
    } catch (err: any) {
      setLoading(false);
      setGeneralError(err.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h2 className="text-xl font-bold text-slate-900">จองห้องประชุมใหม่</h2>
            <p className="text-xs text-slate-500 mt-0.5">ระบุรายละเอียดการประชุมและเอกสารประกอบเพื่อซิงค์ไปยัง Google Workspace</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conflict Alert Banner */}
        {conflictError && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-rose-900">ตรวจพบเวลาซ้อนทับ (Double-Booking Conflict)</p>
              <p className="mt-0.5">{conflictError}</p>
            </div>
          </div>
        )}

        {/* General Error Banner */}
        {generalError && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-800 text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p>{generalError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Room Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">เลือกห้องประชุม *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rooms.map((room) => {
                const isSelected = room.id === roomId;
                return (
                  <div
                    key={room.id}
                    onClick={() => setRoomId(room.id)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-slate-900 truncate">{room.name}</span>
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: room.color }}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> สูงสุด {room.capacity} คน
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {room.location}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">หัวข้อการประชุม *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น ประชุมวางแผนแคมเปญประจำเดือน, Daily Standup"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">รายละเอียด / วาระการประชุม (ถ้ามี)</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ระบุวาระการประชุมหรือหัวข้อที่ต้องเตรียมตัวล่วงหน้า"
                className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Date & Time Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">วันที่ประชุม *</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">เวลาเริ่ม *</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">เวลาสิ้นสุด *</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Attendees Count & Booker Information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                จำนวนผู้เข้าร่วม (คน) *
              </label>
              <input
                type="number"
                min="1"
                max={selectedRoom?.capacity || 50}
                value={attendeesCount}
                onChange={(e) => setAttendeesCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              {selectedRoom && attendeesCount > selectedRoom.capacity && (
                <p className="text-xs text-rose-600 mt-1">เกินความจุห้อง ({selectedRoom.capacity} คน)</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">ชื่อผู้จอง *</label>
              <input
                type="text"
                required
                value={bookerName}
                onChange={(e) => setBookerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">อีเมลผู้จอง *</label>
              <input
                type="email"
                required
                value={bookerEmail}
                onChange={(e) => setBookerEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Requested Equipment */}
          {selectedRoom && selectedRoom.equipment && selectedRoom.equipment.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                อุปกรณ์ที่ต้องการใช้งานในห้อง
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedRoom.equipment.map((item) => {
                  const isChecked = selectedEquipment.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleEquipmentToggle(item)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Google Drive Document Upload Dropzone */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              แนบเอกสารประกอบการประชุม (อัปโหลดขึ้น Google Drive อัตโนมัติ)
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 text-center bg-slate-50/50 transition-colors">
              <input
                type="file"
                id="meeting-file"
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg"
                onChange={handleFileUpload}
              />
              <label htmlFor="meeting-file" className="cursor-pointer block">
                {fileData ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-blue-700 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span>{fileData.fileName} ({(fileData.size / 1024 / 1024).toFixed(2)} MB)</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileData(null);
                      }}
                      className="ml-2 text-rose-500 hover:underline text-xs"
                    >
                      ลบไฟล์
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <FileUp className="w-6 h-6 text-slate-400 mb-1" />
                    <p className="text-xs font-medium text-slate-700">
                      คลิกเพื่อแนบไฟล์ (PDF, Slide PPTX, Word หรือรูปภาพ)
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      ไฟล์จะถูกอัปโหลดขึ้น Google Drive Folder และสร้างลิงก์สำหรับผู้เข้าร่วมอัตโนมัติ
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังตรวจสอบและบันทึก...
                </>
              ) : (
                'ยืนยันการจองห้องประชุม'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
