"use client";
import { useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, UtensilsCrossed, Table2, History, 
  Wallet, User, BarChart3, TrendingUp, ArrowUpRight, 
  ArrowDownRight, Calendar, Download 
} from 'lucide-react';

export default function ReportsPage() {
  const [timeFrame, setTimeFrame] = useState('monthly');

  // ข้อมูลจำลองสำหรับรายงาน
  const summaryStats = [
    { label: 'ລາຍຮັບທັງຫມົດ', value: '65,000,000', change: '+15%', isUp: true },
    { label: 'ຈຳນວນອໍເດີ', value: '1,240', change: '+8%', isUp: true },
    { label: 'ຄ່າສະເລ່ຍຕໍ່ບິນ', value: '52,000', change: '-2%', isUp: false },
  ];

  const topMenus = [
    { name: 'ตำหมากหุ่ง', sales: 450, revenue: '11,250,000' },
    { name: 'ปิ้งไก่ลาด', sales: 320, revenue: '20,800,000' },
    { name: 'เบยลาว (ใหญ่)', sales: 280, revenue: '5,600,000' },
    { name: 'ลาบงัว', sales: 150, revenue: '7,500,000' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 font-lao text-slate-800">

      {/* 2. Main Content */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ລາຍງານລາຍຮັບແລະວິເຄາະ</h1>
            <p className="text-gray-400 text-sm">ຕວດສອບຍອດຂາຍແລະເມນຼຍອດນຶຍມຊອງຮ້ານ</p>
          </div>
          <button className="flex items-center gap-2 bg-white border p-2.5 px-4 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all">
            <Download size={18} /> Export PDF
          </button>
        </header>

        {/* บัตรสรุปตัวเลข (Top Stats) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {summaryStats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
              <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2 mb-2">
                <h3 className="text-2xl font-black text-gray-800">{stat.value}</h3>
                <span className="text-gray-400 text-xs">KIP</span>
              </div>
              <div className={`flex items-center text-xs font-bold ${stat.isUp ? 'text-green-500' : 'text-red-500'}`}>
                {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change} <span className="text-gray-300 font-normal ml-1 text-[10px]">ທຽບກິບເດືອນກ່ອນ</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* กราฟแนวโน้มยอดขาย (Simulated Area Chart) */}
          <div className="col-span-12 lg:col-span-8 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <TrendingUp size={20} className="text-orange-500" /> ສະຖິຕິລາຍໄດ້ຕໍ່ເດືອນ
              </h3>
              <select className="bg-gray-50 border-none text-sm font-bold p-2 rounded-lg outline-none cursor-pointer">
                <option>ປີ 2024</option>
                <option>ປີ 2023</option>
              </select>
            </div>
            <div className="h-64 w-full bg-orange-50/30 rounded-3xl flex items-end justify-around p-6 border border-dashed border-orange-100">
               {/* จำลองแท่งกราฟ */}
               {[30, 45, 60, 80, 55, 90, 75, 40, 85, 100, 65, 50].map((height, i) => (
                 <div key={i} className="group relative flex flex-col items-center">
                    <div style={{ height: `${height}%` }} className="w-4 sm:w-8 bg-orange-400/80 rounded-t-lg group-hover:bg-orange-500 transition-all cursor-pointer shadow-sm"></div>
                    <span className="text-[8px] text-gray-400 mt-2 font-bold">{i + 1}</span>
                 </div>
               ))}
            </div>
          </div>

          {/* อันดับเมนูขายดี */}
          <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <UtensilsCrossed size={20} className="text-orange-500" /> ເມນູຂາຍດີ
            </h3>
            <div className="space-y-6">
              {topMenus.map((menu, index) => (
                <div key={index} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-orange-500 border border-gray-100 group-hover:bg-orange-500 group-hover:text-white transition-all">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{menu.name}</p>
                      <p className="text-[10px] text-gray-400">{menu.sales} ລາຍການ</p>
                    </div>
                  </div>
                  <div className="text-right text-sm font-black text-gray-700">
                    {menu.revenue}
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 border-2 border-dashed border-gray-100 rounded-2xl text-xs font-bold text-gray-400 hover:border-orange-200 hover:text-orange-500 transition-all">
              ເບິ່ງເມນູທັງຫມົດ
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}