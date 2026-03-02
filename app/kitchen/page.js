"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, CheckCircle,Play,Timer, PlayCircle, Utensils } from 'lucide-react';
import { updateData } from '../services/actions';
import { refresh } from 'next/cache';
import {cn} from '../../lib/utils/cn'

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  

  // 1. ຟັງຊັນດຶງຂໍ້ມູນ (Fetch) ໂດຍ Join 3 ຕາຕະລາງ: Orders + Order_Details + Menus
  const fetchKitchenOrders = async () => {
  try {
    const { data, error } = await supabase
      .from('Orders')
      .select(`
        order_id,
        order_status,
        order_date,
        table_id,
        Order_Details!order_id (  
          quantity,
          Menus ( menu_name, laoName )
        )
      `)
      .in('order_status', ['pending', 'cooking','ready'])
      .order('order_date', { ascending: true });

    if (error) throw error;
    setOrders(data || []);
  } catch (err) {
    console.error("Fetch Error:", err.message);
  } finally {
    setLoading(false);
  }
};

  // 2. ຕັ້ງຄ່າ Real-time ໃຫ້ອັບເດດອັດຕະໂນມັດເມື່ອມີການ Insert/Update ໃນ Supabase
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

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-lao">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500 mb-4 mx-auto"></div>
        ກຳລັງໂຫລດລາຍການອາຫານ...
      </div>
    </div>
  );

  const updateOrderStatus = async (OrderID, currentStatus) =>{
    let nextStatus="";

    if (currentStatus === "pending") nextStatus="cooking";
    else if (currentStatus === "cooking") nextStatus ="ready";
    else if (currentStatus === "ready") nextStatus ="completed";
    
    if (!nextStatus) return;

    const {error} = await supabase
    .from ('Orders')
    .update ({order_status: nextStatus})
    .eq('order_id', OrderID);

    if (!error) {
    fetchKitchenOrders(); // ดึงข้อมูลใหม่มาแสดงทันที
  } else {
    console.error("Update Error:", error.message);
    alert("ບໍ່ສາມາດອັບເດດສະຖານະໄດ້: " + error.message);
  }
};

  return (
    <div className="min-h-screen bg-slate-900 p-6 font-lao text-white">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-orange-500 tracking-tight">KITCHEN ຫ້ອງຄົວ</h1>
          <div className="bg-slate-800 px-4 py-2 rounded-full text-sm border border-slate-700">
            ອໍເດີທັງໝົດ: <span className="text-orange-500 font-bold">{orders.length}</span>
          </div>
        </header>

        {orders.length === 0 ? (
          <div className="text-center py-20 opacity-20">
            <Utensils size={80} className="mx-auto mb-4" />
            <p className="text-2xl italic">ຍັງບໍ່ມີອໍເດີທີ່ຕ້ອງປຸງແຕ່ງ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {orders.map((order) => (
              <div key={order.order_id} className={`bg-slate-800 rounded-3xl border-2 overflow-hidden flex flex-col ${order.order_status === 'cooking' ? 'border-orange-500' : 'border-slate-700'}`}>
                {/* Header ຂອງ Card */}
                <div className={`p-4 flex justify-between items-center ${order.order_status === 'cooking' ? 'bg-orange-500 text-slate-900' : 'bg-slate-700'}`}>
                  <span className="font-black text-lg">ເລກໂຕະ {order?.table_id || '..'}</span>
                  <div className="flex items-center gap-1 text-xs opacity-80">
                    <Clock size={14} />
                    {new Date().toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* ລາຍການອາຫານ */}
                <div className="p-5 flex-1">
                  <ul className="space-y-4">
                    {order.Order_Details?.map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="bg-slate-700 text-orange-400 px-2 py-1 rounded-lg font-bold h-fit text-sm">
                          {item.quantity}x
                        </span>
                        <div>
                          <p className="font-bold text-lg leading-tight">{item.Menus?.laoName || item.Menus?.menu_name}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ປຸ່ມຈັດການສະຖານະ */}
                <div className="p-4 bg-slate-900/40 border-t border-slate-700">
                    <button 
                      onClick={() => updateOrderStatus(order.order_id,order.order_status)}
                      className={cn(
                         "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                         order.order_status === "pending" && "bg-blue-600 hover:bg-blue-700 text-white", 
                         order.order_status === "cooking" && "bg-orange-500 hover:bg-orange-600 text-white", 
                         order.order_status === "ready" && "bg-green-500 hover:bg-green-600 text-white"
                     )}
                      >                                                   
                    {order.order_status === "pending" && <><Play size={18} /> ເລີ່ມເຮັດອໍເດີ</>}
                   {order.order_status === "cooking" && <><Timer size={18} /> ກຳລັງປຸງ...</>}
                   {order.order_status === "ready" && <><CheckCircle size={18} /> ພ້ອມເສີບ</>}
                   </button>                              
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}