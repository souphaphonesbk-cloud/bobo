"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, CheckCircle, Play, Timer, Utensils, ShoppingBag } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState('active'); // active ຫຼື history
  const [loading, setLoading] = useState(true);

  // 1. 🎯 ຟັງຊັນດຶງຂໍ້ມູນ (Fetch) 
  const fetchKitchenOrders = async () => {
    setLoading(true);
    try {
      // 1. ດຶງອໍເດີທີ່ຍັງບໍ່ທັນສຳເລັດ (pending, cooking, ready)
      const { data: activeData, error: activeError } = await supabase
        .from('Orders')
        .select('*')
        .in('order_status', ['pending', 'cooking', 'ready'])
        .order('order_id', { ascending: true });

      // 2. ດຶງອໍເດີທີ່ສຳເລັດແລ້ວ (completed) ຂອງມື້ນີ້
      const today = new Date().toISOString().split('T')[0]; // ໄດ້ "2026-06-04"
      const { data: historyData, error: historyError } = await supabase
  .from('Orders')
  .select('*')
  .eq('order_status', 'completed')
  .eq('order_date', today) 
  .order('order_id', { ascending: false });

      if (activeError) throw activeError;

      // ຟັງຊັນແປງຂໍ້ມູນ JSON
      const parseItems = (data) => (data || []).map(order => ({
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
      }));

      setOrders(parseItems(activeData));
      setHistory(parseItems(historyData));
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

  const updateOrderStatus = async (OrderID, currentStatus) => {
    let nextStatus = "";
    if (currentStatus === "pending") nextStatus = "cooking";
    else if (currentStatus === "cooking") nextStatus = "ready";
    else if (currentStatus === "ready") nextStatus = "completed";
    
    if (!nextStatus) return;

    const { error } = await supabase
      .from('Orders')
      .update({ order_status: nextStatus })
      .eq('order_id', OrderID);

    if (error) {
      console.error("Update Error:", error.message);
      alert("ບໍ່ສາມາດອັບເດດສະຖານະໄດ້: " + error.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-lao">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500 mb-4 mx-auto"></div>
        ກຳລັງໂຫລດລາຍການອາຫານ...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 p-6 font-lao text-white">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-orange-500 tracking-tight">KITCHEN ຫ້ອງຄົວ</h1>
          <div className="bg-slate-800 px-4 py-2 rounded-full text-sm border border-slate-700">
            ອໍເດີທີ່ກຳລັງເຮັດ: <span className="text-orange-500 font-bold">{orders.length}</span>
          </div>
        </header>

        {/* ສ່ວນສະຫຼັບ Tabs */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setView('active')}
            className={cn(
              "px-6 py-2 rounded-full font-bold transition-all",
              view === 'active' ? "bg-orange-500 text-slate-900" : "bg-slate-800 text-slate-400"
            )}
          >
            ອໍເດີທີ່ຕ້ອງເຮັດ ({orders.length})
          </button>
          <button 
            onClick={() => setView('history')}
            className={cn(
              "px-6 py-2 rounded-full font-bold transition-all",
              view === 'history' ? "bg-green-600 text-white" : "bg-slate-800 text-slate-400"
            )}
          >
            ປະຫວັດມື້ນີ້ ({history.length})
          </button>
        </div>

        {/* ສ່ວນສະແດງຜົນລາຍການອໍເດີ */}
        {(() => {
          const displayOrders = view === 'active' ? orders : history;

          if (displayOrders.length === 0) {
            return (
              <div className="text-center py-20 opacity-20">
                <Utensils size={80} className="mx-auto mb-4" />
                <p className="text-2xl italic">
                  {view === 'active' ? "ຍັງບໍ່ມີອໍເດີທີ່ຕ້ອງປຸງແຕ່ງ" : "ຍັງບໍ່ມີປະຫວັດອໍເດີໃນມື້ນີ້"}
                </p>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayOrders.map((order) => {
                const isTakeAway = order.order_type === 'take_away';
                
                return (
                  <div key={order.order_id} className={cn(
                    "bg-slate-800 rounded-3xl border-2 overflow-hidden flex flex-col",
                    order.order_status === 'cooking' ? 'border-orange-500' : 
                    order.order_status === 'completed' ? 'border-green-600' : 'border-slate-700'
                  )}>
                    <div className={cn("p-4 flex justify-between items-center text-white",
                      order.order_status === 'cooking' ? 'bg-orange-500 text-slate-900 font-black' : 
                      order.order_status === 'completed' ? 'bg-green-600' : 'bg-slate-700'
                    )}>
                      <span className="font-black text-lg flex items-center gap-1">
                        {isTakeAway ? <><ShoppingBag size={20} /> ກັບບ້ານ (ຄິວ #{order.order_id})</> : `ໂຕະ ${order.table_id || "-"}`}
                      </span> 
                    </div>

                    <div className="p-5 flex-1">
                      <ul className="space-y-4">
                        {order.items?.map((item, idx) => (
                          <li key={idx} className="flex gap-3">
                            <span className="bg-slate-700 text-orange-400 px-2 py-1 rounded-lg font-bold h-fit text-sm">
                              {item.quantity}x
                            </span>
                            <p className="font-bold text-lg leading-tight">{item.menu_name}</p>
                          </li>
                        ))}
                      </ul>
                      {order.order_note && (
                        <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-xl">
                          <p className="text-red-400 text-xs font-bold uppercase mb-1">ຄຳສັ່ງພິເສດ:</p>
                          <p className="text-white text-sm font-medium italic">"{order.order_note}"</p>
                        </div>
                      )}
                    </div>

                    {/* ສະແດງປຸ່ມ Action ສະເພາະແຖບ active */}
                    {view === 'active' && (
                      <div className="p-4 bg-slate-900/40 border-t border-slate-700">
                        <button 
                       type="button" // ເພີ່ມບ່ອນນີ້
                       onClick={(e) => {
                        e.preventDefault(); // ເພີ່ມບ່ອນນີ້
                         updateOrderStatus(order.order_id, order.order_status);
                          }}
                          className={cn(
                            "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2",
                            order.order_status === "pending" ? "bg-blue-600" : "bg-orange-500 text-slate-900"
                          )}
                        >
                          {order.order_status === "pending" && <><Play size={18} /> ເລີ່ມເຮັດອໍເດີ</>}
                          {order.order_status === "cooking" && <><Timer size={18} /> ກຳລັງປຸງ...</>}
                          {order.order_status === "ready" && <><CheckCircle size={18} /> ພ້ອມເສີບ</>}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}