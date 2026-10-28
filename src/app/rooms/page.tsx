'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/common/Navbar';
import { RoomData } from '@/types/booking';
import { Users, MapPin, CheckCircle2, Tv, Sparkles, Building2 } from 'lucide-react';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rooms')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setRooms(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ข้อมูลห้องประชุมและสิ่งอำนวยความสะดวก
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            รายละเอียดขนาดห้อง ความจุ อุปกรณ์มัลติมีเดีย และระบบการประชุมของแต่ละห้อง
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Room Image Banner */}
              <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                {room.imageUrl ? (
                  <img
                    src={room.imageUrl}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                    <Building2 className="w-12 h-12" />
                  </div>
                )}
                <div
                  className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-white shadow-md"
                  style={{ backgroundColor: room.color }}
                >
                  {room.location}
                </div>
              </div>

              {/* Room Content */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{room.name}</h2>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{room.description}</p>

                  <div className="flex items-center gap-4 mt-4 text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl">
                      <Users className="w-4 h-4 text-slate-500" />
                      ความจุ {room.capacity} ที่นั่ง
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      {room.location}
                    </span>
                  </div>

                  {/* Equipment List */}
                  <div className="mt-5">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                      อุปกรณ์และสิ่งอำนวยความสะดวกในห้อง
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {room.equipment.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-blue-50 text-blue-700 font-medium border border-blue-100"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
