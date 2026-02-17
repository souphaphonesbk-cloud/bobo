"use client";
import { useState } from 'react';
import Link from 'next/link'; // ອັນນີ້ສຳຄັນສຳລັບການປ່ຽນໜ້າ
import { 
  LayoutDashboard, UtensilsCrossed, Table2, History, 
  Wallet, User, Search, Bell, Users, CheckCircle2, Timer ,BarChart3
} from 'lucide-react';

export default function TableStatusPage() {
  // ຂໍ້ມູນຈຳລອງຂອງໂຕະ
  const [tables, setTables] = useState([
    { id: 'T-1', status: 'available', capacity: 4, orders: 0 },
    { id: 'T-2', status: 'occupied', capacity: 2, orders: 3 },
    { id: 'T-3', status: 'occupied', capacity: 6, orders: 5 },
    { id: 'T-4', status: 'reserved', capacity: 4, orders: 0 },
    { id: 'T-5', status: 'available', capacity: 2, orders: 0 },
    { id: 'T-6', status: 'cleaning', capacity: 4, orders: 0 },
  ]);

  return (
    <div className="flex min-h-screen bg-gray-50 font-lao text-slate-800">

      {/* 2. Main Content (ສ່ວນເນື້ອຫາ) */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* Header ສ່ວນເທິງ */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">ສະຖານະໂຕະທັງໝົດ</h1>
          <div className="flex gap-3">
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium">ຫວ່າງ 12</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-sm font-medium">ບໍ່ຫວ່າງ 8</span>
            </div>
          </div>
        </header>

        {/* Grid ສະແດງໂຕະ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table) => (
            <div 
              key={table.id}
              className={`relative p-6 rounded-[32px] border-2 transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1 ${
                table.status === 'available' ? 'bg-white border-gray-50' : 
                table.status === 'occupied' ? 'bg-orange-50 border-orange-200' : 'bg-gray-100 border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase ${
                  table.status === 'available' ? 'bg-green-100 text-green-600' : 
                  table.status === 'occupied' ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'
                }`}>
                  {table.status}
                </span>
                <Users size={18} className="text-gray-300" />
              </div>

              <h3 className="text-2xl font-black text-gray-800 mb-1">{table.id}</h3>
              <p className="text-gray-400 text-sm mb-4">ຄວາມຈຸ: {table.capacity} ບ່ອນນັ່ງ</p>

              {table.status === 'occupied' ? (
                <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
                  <Timer size={14} />
                  <span>ມີ {table.orders} ອໍເດີ</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                  <CheckCircle2 size={14} />
                  <span>ພ້ອມບໍລິການ</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}