"use client";
import { useState } from 'react';
import { 
  Banknote, QrCode, Printer, Clock, CheckCircle2
} from 'lucide-react';

export default function BillingPage() {
  const [selectedTable, setSelectedTable] = useState('T-3');
  const [history, setHistory] = useState([]);

  // ຂໍ້ມູນຈຳລອງລາຍການອາຫານ
  const billItems = [
    { id: 1, name: 'ຕຳໝາກຫຸ່ງ', qty: 2, price: 25000 },
    { id: 2, name: 'ປີ້ງໄກ່ລາດ', qty: 1, price: 65000 },
    { id: 3, name: 'ເບຍລາວ (ໃຫຍ່)', qty: 3, price: 20000 },
    { id: 4, name: 'ເຂົ້າໜຽວ', qty: 2, price: 5000 },
  ];

  // ຄິດໄລ່ເງິນ (ຕ້ອງຢູ່ພາຍໃຕ້ Component function)
  const subtotal = billItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const total = subtotal; // ສາມາດເພີ່ມ Service charge ຫຼື Tax ໄດ້ບ່ອນນີ້

  const handlePayment = () => {
    const newRecord = {
      id: Date.now(),
      table: selectedTable,
      total: total,
      time: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString()
    };

    setHistory([newRecord, ...history]); 
    alert(`ຊຳລະເງິນໂຕະ ${selectedTable} ສຳເລັດ!`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-lao text-slate-800">
      <main className="flex-1 p-8 grid grid-cols-12 gap-8">
        
        {/* ເບື້ອງຊ້າຍ: ເລືອກໂຕະ & ປະຫວັດ */}
        <div className="col-span-12 lg:col-span-7">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">ການຊຳລະເງິນ</h1>
            <p className="text-gray-400 text-sm">ເລືອກໂຕະເພື່ອອອກບິນ ແລະ ຊຳລະເງິນ</p>
          </header>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-12">
            {['T-1', 'T-2', 'T-3', 'T-4', 'T-5', 'T-6', 'T-7', 'T-8'].map((table) => (
              <div 
                key={table}
                onClick={() => setSelectedTable(table)}
                className={`p-6 rounded-3xl border-2 text-center cursor-pointer transition-all ${
                  selectedTable === table 
                  ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-md scale-105' 
                  : 'border-white bg-white text-gray-400 hover:border-gray-200'
                }`}
              >
                <div className="font-black text-xl">{table}</div>
                <div className="text-[10px] uppercase font-bold mt-1">
                  {table === 'T-3' ? 'Waiting' : 'Occupied'}
                </div>
              </div>
            ))}
          </div>

          {/* ສ່ວນປະຫວັດການຊຳລະເງິນ */}
          <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock size={20} className="text-orange-500" /> ປະຫວັດການຊຳລະມື້ນີ້
            </h2>
            <div className="space-y-3">
              {history.length === 0 ? (
                <p className="text-center py-6 text-gray-300 italic">ຍັງບໍ່ມີລາຍການຊຳລະ</p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 text-green-600 p-2 rounded-full">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">ໂຕະ {item.table}</p>
                        <p className="text-[10px] text-gray-400">{item.time}</p>
                      </div>
                    </div>
                    <p className="font-black text-gray-700">{item.total.toLocaleString()} KIP</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ເບື້ອງຂວາ: Preview ບິນ */}
        <div className="col-span-12 lg:col-span-5">
          <div className="bg-white rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 p-8 sticky top-8">
            <div className="flex justify-between items-center mb-6">
              <span className="font-black text-xl">ບິນເກັບເງິນ {selectedTable}</span>
              <button className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600">
                <Printer size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2">
              {billItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex gap-3">
                    <span className="text-gray-400 font-bold">{item.qty}x</span>
                    <span className="text-gray-700 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold">{(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-200 pt-6 space-y-3">
              <div className="flex justify-between text-gray-400 text-sm">
                <span>ລວມຍອດອາຫານ</span>
                <span>{subtotal.toLocaleString()} KIP</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-lg text-gray-800">ຍອດລວມທັງໝົດ</span>
                <span className="font-black text-2xl text-orange-600">{total.toLocaleString()} KIP</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-50 hover:border-orange-200 hover:bg-orange-50 transition-all focus:bg-orange-50 focus:border-orange-200">
                <Banknote className="text-green-500" />
                <span className="text-xs font-bold">ເງິນສົດ</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-50 hover:border-orange-200 hover:bg-orange-50 transition-all focus:bg-orange-50 focus:border-orange-200">
                <QrCode className="text-blue-500" />
                <span className="text-xs font-bold">ໂອນເງິນ (OnePay)</span>
              </button>
            </div>

            <button 
              onClick={handlePayment}
              className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold mt-6 shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95"
            >
              ຢືນຢັນການຊຳລະເງິນ
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}