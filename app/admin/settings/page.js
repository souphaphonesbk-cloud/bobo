"use client";
import { useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, UtensilsCrossed, Table2, History, 
  Wallet, User, BarChart3, Settings, Bell, Lock, 
  Store, Globe, Printer, ShieldCheck, Save
} from 'lucide-react';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');

  // ເມນູຍ່ອຍໃນໜ້າຕັ້ງຄ່າ
  const subMenus = [
    { id: 'profile', name: 'ຂໍ້ມູນສ່ວນຕົວ', icon: <User size={18} /> },
    { id: 'store', name: 'ຂໍ້ມູນຮ້ານ', icon: <Store size={18} /> },
    { id: 'notifications', name: 'ການແຈ້ງເຕືອນ', icon: <Bell size={18} /> },
    { id: 'security', name: 'ຄວາມປອດໄພ', icon: <Lock size={18} /> },
    { id: 'system', name: 'ຕັ້ງຄ່າລະບົບ', icon: <Settings size={18} /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 font-lao text-slate-800">
      
      {/* 2. Main Content */}
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">ຕັ້ງຄ່າລະບົບ</h1>
          <p className="text-gray-400 text-sm">ຈັດການຂໍ້ມູນ ແລະ ການຕັ້ງຄ່າຕ່າງໆຂອງຜູ້ໃຊ້</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ເມນູຍ່ອຍເບື້ອງຊ້າຍ (Settings Sub-menu) */}
          <div className="w-full lg:w-64 space-y-1">
            {subMenus.map((menu) => (
              <button
                key={menu.id}
                onClick={() => setActiveSection(menu.id)}
                className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${
                  activeSection === menu.id 
                  ? 'bg-white shadow-sm border border-gray-100 text-orange-600 font-bold' 
                  : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                {menu.icon}
                <span className="text-sm">{menu.name}</span>
              </button>
            ))}
          </div>

          {/* ສ່ວນສະແດງຟອມຕັ້ງຄ່າ (Settings Form) */}
          <div className="flex-1 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
            {activeSection === 'profile' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <User size={20} className="text-orange-500" /> ຂໍ້ມູນສ່ວນຕົວ
                </h3>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 bg-orange-100 rounded-[32px] flex items-center justify-center text-orange-600 text-2xl font-black">DB</div>
                    <button className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-gray-50">ປ່ຽນຮູບພາບ</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1">ຊື່ ແລະ ນາມສະກຸນ</label>
                      <input type="text" defaultValue="David Brown" className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-orange-200" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1">ອີເມວ</label>
                      <input type="email" defaultValue="david.b@restaurant.com" className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-orange-200" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1">ເບີໂທລະສັບ</label>
                      <input type="text" defaultValue="+856 20 5555 6666" className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-orange-200" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1">ຕຳແໜ່ງ</label>
                      <input type="text" defaultValue="Manager" disabled className="w-full p-4 bg-gray-100 border-none rounded-2xl outline-none text-gray-400 cursor-not-allowed" />
                    </div>
                  </div>

                  <div className="pt-8 border-t flex justify-end">
                    <button className="flex items-center gap-2 bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100">
                      <Save size={18} /> ບັນທຶກການປ່ຽນແປງ
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection !== 'profile' && (
              <div className="py-20 text-center text-gray-300 italic">
                ສ່ວນຂອງ {subMenus.find(m => m.id === activeSection)?.name} ກຳລັງຖືກພັດທະນາ...
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}