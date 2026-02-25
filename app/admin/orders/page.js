"use client";
import { useState,useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  LayoutDashboard, UtensilsCrossed, Table2, History,X,
  Wallet, User, Search, Bell, Filter, Eye, CheckCircle, Clock, Timer, Calendar,BarChart3
} from 'lucide-react';

export default function OrdersPage() {
  const [currentTab, setCurrentTab] = useState('active');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchKitchenOrders = async () => {
  try {
    const { data, error } = await supabase
      .from('Orders')
      .select(`
        order_id,
        order_status,
        order_date,
        total_amount,
        Order_Details!order_id (  
          quantity,
          Menus ( menu_name, laoName )
        )
      `)
      .in('order_status', ['pending', 'cooking','ready'])
      .order('order_date', { ascending: true });

    if (error) throw error;
    console.log(data)
    setOrders(data || []);
  } catch (err) {
    console.error("Fetch Error:", err.message);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
    fetchKitchenOrders();

    const channel = supabase
      .channel('kitchen_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'Orders' }, 
        () => fetchKitchenOrders()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

   // 3. ຟັງຊັນປ່ຽນສະຖານະອໍເດີ (Update Status)
  const handleUpdateStatus = async (id, nextStatus) => {
    const { error } = await supabase
      .from('Orders')
      .update({ order_status: nextStatus })
      .eq('order_id', id);
    
    if (!error) fetchKitchenOrders();
  };

  const activeOrders = orders.filter(o=>['pending','cooking','ready'] .includes(o.order_status));
  const historyOrders = orders.filter(o=> o.order_status === 'compelte');


  

  return (
    <div className="flex min-h-screen bg-gray-50 font-lao text-slate-800">


      <main className="flex-1 p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">ການຈັດການອໍເດີ</h1>
          
          {/* ສ່ວນ Tab ສຳລັບສະຫຼັບໜ້າ */}
          <div className="flex gap-4 mt-6 border-b border-gray-200">
            <button 
           onClick={() => setCurrentTab('active')}
             className={`pb-4 px-2 text-sm font-bold transition-all ${currentTab === 'active' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-400'}`}
            >
                ອໍເດີທີ່ກຳລັງດຳເນີນ ({activeOrders.length})
             </button>
            <button 
              onClick={() => setCurrentTab('history')}
              className={`pb-4 px-2 text-sm font-bold transition-all ${currentTab === 'history' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-400'}`}
            >
              ປະຫວັດການສັ່ງຊື້ທັງໝົດ
            </button>
          </div>
        </header>

        {/* ສ່ວນສະແດງເນື້ອຫາຕາມ Tab */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-5 text-sm font-bold text-gray-400">ID / ໂຕະ</th>
                <th className="p-5 text-sm font-bold text-gray-400">ລາຍການ</th>
                <th className="p-5 text-sm font-bold text-gray-400">{currentTab === 'active' ? 'ເວລາສັ່ງ' : 'ວັນທີ'}</th>
                <th className="p-5 text-sm font-bold text-gray-400">ສະຖານະ</th>
                <th className="p-5 text-sm font-bold text-gray-400">ຍອດລວມ</th>
              </tr>
            </thead>
           <tbody className="divide-y divide-gray-50">
  {(currentTab === 'active' ? activeOrders : historyOrders).map((order) => (
    <tr key={order.order_id} onClick={() => setSelectedOrder(order)} className="hover:bg-gray-50/50 cursor-pointer transition-colors">
      <td className="p-5">
        <div className="font-bold text-sm">#{order.order_id.toString().slice(-4)}</div>
        <div className="text-xs text-orange-500 font-bold">ໂຕະ {order.table_id || 'N/A'}</div>
      </td>
      <td className="p-5 text-sm text-gray-600">
        {/* แสดงชื่ออาหารรายการแรก และบอกว่ามีอีกกี่อย่าง */}
        {order.Order_Details?.[0]?.Menus?.laoName} 
        {order.Order_Details?.length > 1 && ` ແລະ ອີກ ${order.Order_Details.length - 1} ຢ່າງ`}
      </td>
      <td className="p-5 text-sm text-gray-400">
        <div className="flex items-center gap-1">
          {currentTab === 'active' ? <Clock size={14}/> : <Calendar size={14}/>}
          {new Date(order.order_date).toLocaleTimeString('lo-LA')}
        </div>
      </td>
      <td className="p-5">
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase 
          ${order.order_status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
          {order.order_status}
        </span>
      </td>
      <td className="p-5 font-bold text-slate-700">
        {/* ใส่ราคารวม (ถ้ามี column total_price ใน DB) */}
        {Number(order.total_amount || 0).toLocaleString()} KIP
      </td>
    </tr>
  ))}
</tbody>
          </table>
          {/* ຖ້າບໍ່ມີຂໍ້ມູນ */}
          {(currentTab === 'active' ? activeOrders : historyOrders).length === 0 && (
            <div className="p-20 text-center text-gray-300 italic">ບໍ່ມີຂໍ້ມູນລາຍການ...</div>
          )}
        </div>
      </main>

      {/* --- 3. ສ່ວນຂອງ Modal ສະແດງລາຍລະອຽດ --- */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center ">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-8 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-black flex items-center gap-2">ລາຍລະອຽດອໍເດີ</h2>
                <p className="text-sm text-gray-400 font-bold">ID: {selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="bg-orange-50 rounded-2xl p-4 mb-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="bg-orange-500 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg">
                   {selectedOrder.table}
                 </div>
                 <div className="text-sm font-black text-orange-700">ຂໍ້ມູນໂຕະ</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-orange-400 uppercase font-bold tracking-widest">ສະຖານະ</div>
                <div className="text-xs font-black text-orange-600 uppercase">{selectedOrder.status}</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">ລາຍການອາຫານ</h3>
              <div className="space-y-4">
                {selectedOrder.detail?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <div className="flex gap-4 items-center">
                      <span className="bg-gray-100 text-gray-600 w-6 h-6 rounded flex items-center justify-center text-xs font-black">{item.qty}x</span>
                      <span className="font-bold text-gray-700">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-600">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 mt-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-400 font-bold">ຍອດລວມທັງໝົດ</span>
                <span className="text-2xl font-black text-orange-600">{selectedOrder.total_amount} KIP</span>
              </div>
            </div>
            
          </div>
        </div>
      )}


    </div>
  );
}