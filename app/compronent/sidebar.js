'use client'
import { useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, UtensilsCrossed, Table2, History, 
  Wallet, User, Search, Bell, Image as ImageIcon ,BarChart3
} from 'lucide-react';

     const Sidebar = ({}) => {
     const [activeTab, setActiveTab] = useState('home');

  return <div>
          {/* 1. Sidebar */}
      <aside className="w-64 h-full bg-white border-r p-6 hidden lg:block">
        <div className='flex items-center gap-3 mb-10'>
          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm border border-gray-100">
            <img src="/icon/logo.jpg" alt="Logo" />
          </div>
          <div className="text-yellow-500 font-bold text-2xl tracking-tight">Puckluck</div>
        </div>

        <nav className="space-y-2">
          {[
           { id: 'home', name: 'ໜ້າຫຼັກ', icon: <LayoutDashboard size={20} />, path: '/admin/home' },
            { id: 'orders', name: 'ລາຍການສັ່ງຊື້', icon: <History size={20} />, path: '/admin/orders', badge: 5 },
            { id: 'tables', name: 'ສະຖານະໂຕະ', icon: <Table2 size={20} />, path: '/admin/tables' },
            { id: 'billing', name: 'ການຊຳລະເງິນ', icon: <Wallet size={20} />, path: '/admin/billing' },
            { id: 'menu', name: 'ຈັດການເມນູ', icon: <UtensilsCrossed size={20} />, path: '/admin/menu' },
            { id: 'reports', name: 'ລາຍງານລາຍຮັບ', icon: <BarChart3 size={20} />, path: '/admin/reports' },
            { id: 'settings', name: 'ຕັ້ງຄ່າ', icon: <User size={20} />, path: '/admin/settings' },
          ].map((item) => (
            <Link 
      key={item.id}
      href={item.path || 'menu'} 
      onClick={() => setActiveTab(item.id)}
      className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${
        activeTab === item.id ? 'bg-orange-50 text-orange-600 font-bold' : 'text-gray-400 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-3">
        {item.icon}
        <span>{item.name}</span>
      </div>
    </Link>
          ))}
        </nav>
      </aside>
  </div>
}

export default Sidebar