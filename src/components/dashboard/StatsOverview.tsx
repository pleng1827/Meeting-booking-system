'use client';

import React from 'react';
import { DoorOpen, Users, CalendarCheck, CloudCheck, Sparkles } from 'lucide-react';

interface StatsProps {
  stats: {
    totalRooms: number;
    availableRoomsNow: number;
    activeMeetingsNow: number;
    totalBookingsToday: number;
  };
}

export function StatsOverview({ stats }: StatsProps) {
  const cards = [
    {
      label: 'ห้องว่างพร้อมใช้งานตอนนี้',
      value: `${stats.availableRoomsNow} / ${stats.totalRooms}`,
      subtext: 'ห้องประชุมที่ยังไม่มีผู้เข้าใช้งาน',
      icon: DoorOpen,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50/60',
      borderColor: 'border-emerald-100',
    },
    {
      label: 'กำลังใช้งานอยู่ในขณะนี้',
      value: `${stats.activeMeetingsNow}`,
      subtext: 'การประชุมที่ดำเนินอยู่ในห้องขณะนี้',
      icon: Users,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50/60',
      borderColor: 'border-amber-100',
    },
    {
      label: 'การจองทั้งหมดวันนี้',
      value: `${stats.totalBookingsToday}`,
      subtext: 'คำขอและรายการใช้งานตลอดวัน',
      icon: CalendarCheck,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50/60',
      borderColor: 'border-blue-100',
    },
    {
      label: 'Google Workspace Sync',
      value: 'Auto-Sync Active',
      subtext: 'Google Sheets & Drive เชื่อมต่อแล้ว',
      icon: CloudCheck,
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50/60',
      borderColor: 'border-indigo-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-5 rounded-2xl border ${card.borderColor} bg-white shadow-xs hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{card.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center ${card.iconColor}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
