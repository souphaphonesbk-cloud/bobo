"use client";
import { 
 Search, Bell
} from 'lucide-react';


export default function CounterPage() {
  // ຕອນນີ້ເຮົາລັອກໃຫ້ມັນຢູ່ໜ້າ home ຢ່າງດຽວໃນໄຟລ໌ນີ້
  return (
    <div className="flex min-h-screen bg-gray-50 font-lao text-slate-800">
 

      {/* 2. Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="relative w-1/2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="ຄົ້ນຫາຂໍ້ມູນ..." className="bg-white border-none shadow-sm p-3 pl-10 rounded-xl w-full focus:ring-2 focus:ring-orange-200 outline-none" />
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-white p-3 rounded-xl shadow-sm relative border hover:bg-gray-50 cursor-pointer"><Bell size={20} /></div>
             <div className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-xl shadow-sm border">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold">DB</div>
                <div className="text-sm font-bold">David Brown</div>
             </div>
          </div>
        </header>

        {/* --- ສະແດງສະເພາະເນື້ອຫາໜ້າຫຼັກ --- */}
        <div className="animate-in fade-in duration-500">
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-gray-400 text-sm">ຍອດຂາຍມື້ນີ້</p>
              <h3 className="text-2xl font-bold">2,500,000 KIP</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-gray-400 text-sm">ອໍເດີທັງໝົດ</p>
              <h3 className="text-2xl font-bold">45 ລາຍການ</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-gray-400 text-sm">ໂຕະທີ່ໃຊ້ງານ</p>
              <h3 className="text-2xl font-bold">12 / 20</h3>
            </div>
          </div>

          {/* Table Status Overview */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mb-8">
            <h2 className="font-bold text-xl mb-6">ສະຖານະໂຕະ</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {[1,2,3,4,5,6,7,8,9,10].map(id => (
                <div key={id} className="p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 flex flex-col items-center hover:border-orange-200 transition-colors cursor-pointer">
                  <span className="font-bold">T-{id}</span>
                  <span className="text-[10px] text-gray-400 uppercase">Available</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* 3. Right Sidebar (Order Summary) */}
      <aside className="w-80 bg-white border-l p-6 hidden xl:block animate-in slide-in-from-right duration-500">
        <h2 className="font-bold text-xl mb-6">ລາຍລະອຽດການສັ່ງ</h2>
        <div className="bg-orange-50 p-4 rounded-2xl mb-6 border border-orange-100 text-orange-600 font-bold">
            ໂຕະທີ່ກຳລັງກວດສອບ: T-3
        </div>
        
        {/* Placeholder ສຳລັບລາຍການອາຫານໃນບິນ */}
        <div className="space-y-4 mb-8">
          <p className="text-gray-400 text-center text-sm italic">ເລືອກໂຕະເພື່ອເບິ່ງລາຍການສັ່ງ...</p>
        </div>

        <button className="w-full bg-yellow-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-yellow-100 hover:bg-yellow-600 transition-colors">
          ຢືນຢັນການຊຳລະເງິນ
        </button>
      </aside>

    </div>
  );
}