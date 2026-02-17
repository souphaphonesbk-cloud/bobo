"use client";
import { useState } from "react";
import { Bell, Settings, Phone } from 'lucide-react';


export default function KitchenPage() {
  // ສ້າງ State ຈຳລອງຂໍ້ມູນ (ຕອນນີ້ໃຫ້ເປັນ Array ຫວ່າງກ່ອນກໍໄດ້)
  const [orders, setOrders] = useState([]); 

  return (
    // Container ຫຼັກ: ພື້ນຫຼັງສີເທົາອ່ອນ, ເຕັມຈໍ, ມີການຍັບຍໍ້ (Padding)
    <div className="min-h-screen bg-gray-50  font-sans">
      
      {/* --- ສ່ວນຫົວ (Top Bar) --- */}
      <div className="flex justify-between items-center mb-8 bg-[#444] text-white p-3 ">
        <div className="flex items-center gap-1">
          <h1 className="text-xl font-bold">{orders.length} Order</h1>
          <Bell size={20} className="text-gray-400 cursor-pointer hover:text-white" />
        </div>
        <div className="flex items-center gap-4">
          <Settings size={20} className="text-gray-400 cursor-pointer" /></div>
      </div>
      {/* ອໍເດີ */}
      <div className=" flex w-70 h-auto items-center flex-col ">
        <div className="flex  items-center bg-yellow-200 w-full h-20 text-white p-3 flex-col">
            <h2 className="font-bold text-lg text-gray-800">Table 07</h2>
            <p className="text-sm text-gray-500">Order #4</p>
        </div>
        <div className="flex bg-[#ffffff] h-80 w-full flex-col p-4 ">
  <div className="flex gap-3 mt-auto">
    <button className="flex-1 bg-[#f00534e6] text-white py-2 rounded-xl font-bold text-sm hover:opacity-90">Start</button>
    <button className="flex-1 bg-[#09ec51] text-white py-2 rounded-xl font-bold text-sm hover:opacity-90">Finish </button>
    </div>
    </div>

      </div>
    </div>
  );
}