'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/common/Navbar';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  Users,
  Clock,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { BookingData, RoomData } from '@/types/booking';

export default function ReportsPage() {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedRoom !== 'ALL') params.append('roomId', selectedRoom);
      if (startDate) params.append('start', new Date(startDate).toISOString());
      if (endDate) params.append('end', new Date(endDate).toISOString());

      const [bRes, rRes] = await Promise.all([
        fetch(`/api/bookings?${params.toString()}`),
        fetch('/api/rooms'),
      ]);

      const bData = await bRes.json();
      const rData = await rRes.json();

      if (bData.success) setBookings(bData.data);
      if (rData.success) setRooms(rData.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRoom, startDate, endDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Export to Excel handler
  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (selectedRoom !== 'ALL') params.append('roomId', selectedRoom);
    if (startDate) params.append('startDate', new Date(startDate).toISOString());
    if (endDate) params.append('endDate', new Date(endDate).toISOString());

    window.open(`/api/reports/export?${params.toString()}`, '_blank');
  };

  // Sync to Google Sheets handler
  const handleSyncGoogleSheets = async () => {
    setSyncingSheets(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
          tabName: 'Meeting_Report_Export',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSyncMessage(`ซิงค์ข้อมูลสำเร็จ! อัปเดต ${data.rowCount} รายการลง Google Sheets เรียบร้อยแล้ว`);
        fetchReports();
      } else {
        setSyncMessage(`เกิดข้อผิดพลาด: ${data.error || 'ไม่สามารถซิงค์ได้'}`);
      }
    } catch (err: any) {
      setSyncMessage(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setSyncingSheets(false);
      setTimeout(() => setSyncMessage(null), 6000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              รายงานและประวัติการใช้ห้องประชุม
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              สรุปสถิติการใช้งานห้องประชุม และส่งออกข้อมูลเป็น Excel หรือ Google Sheets
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSyncGoogleSheets}
              disabled={syncingSheets}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {syncingSheets ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin text-emerald-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
              )}
              ซิงค์ลง Google Sheets
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 mr-1.5" />
              ส่งออกเป็นไฟล์ Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Filters Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                เลือกห้องประชุม
              </label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="ALL">ทุกห้องประชุม</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                ตั้งแต่วันที่
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                ถึงวันที่
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">
              รายการการจองห้องประชุม ({bookings.length} รายการ)
            </h2>
            <button
              onClick={fetchReports}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> รีเฟรชตาราง
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">ห้องประชุม</th>
                  <th className="px-6 py-3.5">หัวข้อการประชุม</th>
                  <th className="px-6 py-3.5">วันที่ & เวลา</th>
                  <th className="px-6 py-3.5">ผู้จอง</th>
                  <th className="px-6 py-3.5">ผู้เข้าร่วม</th>
                  <th className="px-6 py-3.5">เอกสารแนบ</th>
                  <th className="px-6 py-3.5">Google Sheets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                      {loading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบรายการจองตามเงื่อนไขที่เลือก'}
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => {
                    const start = new Date(b.startTime);
                    const end = new Date(b.endTime);
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: b.room?.color || '#3b82f6' }}
                            />
                            <span>{b.room?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{b.title}</p>
                          {b.description && (
                            <p className="text-xs text-slate-400 truncate max-w-xs">{b.description}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          <p className="font-medium text-slate-900">{start.toLocaleDateString('th-TH')}</p>
                          <p className="text-slate-500">
                            {start.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} -{' '}
                            {end.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          <p className="font-medium text-slate-900">{b.user?.name}</p>
                          <p className="text-slate-400">{b.user?.email}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {b.attendeesCount} คน
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          {b.attachments && b.attachments.length > 0 ? (
                            <a
                              href={b.attachments[0].driveWebViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                            >
                              <span>ดูไฟล์ Google Drive</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          {b.syncedToSheets ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                              Synced
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
