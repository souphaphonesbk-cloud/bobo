"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from "next/navigation"; // 🌟 ເພີ່ມ useRouter ເພື່ອໃຊ້ໃນການດຶງໜ້າກັບໄປ login
import { Clock, CheckCircle, Play, Timer, Utensils, ShoppingBag, LogOut } from 'lucide-react'; // 🌟 ເພີ່ມ LogOut Icon
import { cn } from '../../lib/utils/cn';

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState('active'); // active ຫຼື history
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // 🌟 ປະກາດໃຊ້ router

  // 🌟 ຟັງຊັນສຳລັບການລັອກເອົ້າອອກຈາກຫ້ອງຄົວ
  const handleLogout = () => {
    if (confirm("ທ່ານຕ້ອງການອອກຈາກລະບົບຫ້ອງຄົວແທ້ບໍ່?")) {
      // 1. ເຄຼຍ Cookie ທີ່ຝັງໄວ້ໃຫ້ Middleware
      document.cookie = "isLoggedIn=; path=/; max-age=0;";
      document.cookie = "userRole=; path=/; max-age=0;";
      
      // 2. ເຄຼຍ ຂໍ້ມູນ User ໃນ localStorage
      localStorage.removeItem("currentUser");
      
      // 3. ລີເຟຣດ ແລະ ພາລົງໄປໜ້າລັອກອິນ
      router.refresh();
      router.push('/login');
    }
  };

  // 1. 🎯 ຟັງຊັນดຶງຂໍ້ມູນ ແລະ ຈັດກຸ່ມ (Group By order_id) - ແກ້ Bug ເຄື່ອງດື່ມບໍ່ຂຶ້ນຊື່
  const fetchKitchenOrders = async () => {
    setLoading(true);
    try {
      // 1. ດຶງອໍເດີທີ່ຍັງບໍ່ທັນສຳເລັດທັງໝົດ
      const { data: activeData, error: activeError } = await supabase
        .from('Orders')
        .select('*')
        .in('order_status', ['pending', 'cooking', 'ready'])
        .order('id', { ascending: true });

      // 2. ດຶງອໍເດີທີ່ສຳເລັດແລ້ວ (completed) ຂອງມື້ນີ້
      const today = new Date().toISOString().split('T')[0];
      const { data: historyData, error: historyError } = await supabase
        .from('Orders')
        .select('*')
        .eq('order_status', 'completed')
        .eq('order_date', today) 
        .order('id', { ascending: false });

      if (activeError) throw activeError;
      if (historyError) throw historyError;

      // 🛠️ Logic ໃໝ່: ແກ້ Bug "ບໍ່ມີຊື່ເມນູ" ໂດຍການດຶງຄ່າຈາກ JSON items ທີ່ຝັງມາໂດຍຕົງ
      const groupOrders = (rawData) => {
        const grouped = {};
        
        (rawData || []).forEach((row) => {
          const orderId = row.order_id;
          
          // ແປງຂໍ້ມູນໃນຄໍລຳ items ຈາກ String ໃຫ້ເປັນ Object/Array
          const parsedItems = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
          
          // 🎯 ດຶງຂໍ້ມູນ Item ຕົວທຳອິດໃນ Array items ອອກມາ (ເພາະ 1 ແຖວໃນ DB ຈະມີ 1 Object ສິນຄ້າສະເໝີ)
          const currentItem = Array.isArray(parsedItems) ? parsedItems[0] : parsedItems;

          if (!grouped[orderId]) {
            grouped[orderId] = {
              order_id: orderId,
              table_id: row.table_id,
              order_type: row.order_type,
              order_note: row.order_note,
              order_date: row.order_date,
              food_items: []
            };
          }

          // 🎯 ແກ້ Bug ຫ້ອງຄົວ: ດຶງຊື່ພາສາລາວ (laoName) ມາສະແດງກ່ອນ, ຖ້າວ່າງໃຫ້ເອົາ menu_name 
          const finalName = 
            currentItem?.laoName || 
            currentItem?.menu_name || 
            row.menu_name || 
            "ບໍ່ມີຊື່ເມນູ";

          // ປ້ອງກັນການເພີ່ມແຖວຊ້ຳ
          if (!grouped[orderId].food_items.some(item => item.db_row_id === row.id)) {
            grouped[orderId].food_items.push({
              db_row_id: row.id, 
              menu_name: finalName, // 🎯 ຈະໄດ້ຊື່ພາສາລາວທີ່ຖືກຕ້ອງໄປສະແດງ
              quantity: currentItem?.quantity || currentItem?.qty || 1,
              item_status: row.order_status
            });
          }
        });

        return Object.values(grouped);
      };

      setOrders(groupOrders(activeData));
      setHistory(groupOrders(historyData));
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

  // 🛠️ ຟັງຊັນອັບເດດສະຖານະແຍກລາຍຈານ (1 ຈານ)
  const updateItemStatus = async (dbRowId, currentStatus) => {
    let nextStatus = "";
    if (currentStatus === "pending") nextStatus = "cooking";
    else if (currentStatus === "cooking") nextStatus = "ready";
    else if (currentStatus === "ready") nextStatus = "completed";
    
    if (!nextStatus) return;

    const { error } = await supabase
      .from('Orders')
      .update({ order_status: nextStatus })
      .eq('id', dbRowId);

    if (error) {
      console.error("Update Error:", error.message);
      alert("ບໍ່ສາມາດອັບເດດສະຖານະໄດ້: " + error.message);
    }
  };

  // ⚡ ຟັງຊັນພິເສດ: ອັບເດດສະຖານະທຸກໆຈານໃນບິນພ້ອມກັນ (ກົດບາດດຽວທັງບິນ)
  const updateBulkOrderStatus = async (foodItems, actionType) => {
    try {
      const updatePromises = foodItems.map(item => {
        let nextStatus = "";
        if (actionType === "start" && item.item_status === "pending") nextStatus = "cooking";
        if (actionType === "complete" && (item.item_status === "pending" || item.item_status === "cooking")) nextStatus = "ready";
        if (actionType === "finish" && item.item_status === "ready") nextStatus = "completed";

        if (!nextStatus) return null;

        return supabase
          .from('Orders')
          .update({ order_status: nextStatus })
          .eq('id', item.db_row_id);
      }).filter(p => p !== null);

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }
    } catch (err) {
      console.error("Bulk Update Error:", err.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-lao">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500 mb-4 mx-auto"></div>
        Gຳລັງໂຫລດລາຍການອາຫານ...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 p-6 font-lao text-white">
      <div className="max-w-7xl mx-auto">
        
        {/* Header ຂອງໜ້າຫ້ອງຄົວ */}
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-orange-500 tracking-tight">KITCHEN ຫ້ອງຄົວ</h1>
          
          <div className="flex items-center gap-4"> {/* 🌟 ຈັດກຸ່ມປຸ່ມດ້ານຂວາ */}
            <div className="bg-slate-800 px-4 py-2 rounded-full text-sm border border-slate-700">
              ບິນທີ່ກຳລັງເຮັດ: <span className="text-orange-500 font-bold">{orders.length}</span>
            </div>

            {/* 🌟 ປຸ່ມອ໋ອກຈາກລະບົບ (Log out) ທີ່ເພີ່ມເຂົ້າໄປໃໝ່ */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white rounded-full text-sm font-bold border border-red-500/20 transition-all active:scale-95"
            >
              <LogOut size={16} />
              <span>ອອກຈາກລະບົບ</span>
            </button>
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
                
                // ກວດສອບສະຖານະພາບລວມຂອງບິນ ເພື່ອສະແດງປຸ່ມໃຫຍ່ຢູ່ Header
                const hasPending = order.food_items.some(i => i.item_status === 'pending');
                const hasCooking = order.food_items.some(i => i.item_status === 'cooking');
                const hasReady = order.food_items.some(i => i.item_status === 'ready');

                return (
                  <div key={order.order_id} className="bg-slate-800 rounded-3xl border-2 border-slate-700 overflow-hidden flex flex-col shadow-xl">
                    
                    {/* Header ຂອງແຕ່ລະບັດອໍເດີ */}
                    <div className="p-4 flex flex-col gap-2 bg-slate-700 text-white">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-lg flex items-center gap-1">
                          {isTakeAway ? <><ShoppingBag size={20} /> ກັບບ້ານ</> : `ໂຕະ ${order.table_id || "-"}`}
                        </span>
                        <span className="text-xs bg-slate-900/40 px-2 py-1 rounded-md">#{order.order_id}</span>
                      </div>

                      {/* ⚡ ປຸ່ມລວມດ່ວນ ຢູ່ຫົວບັດ (ກົດບາດດຽວປ່ຽນທັງບິນ) */}
                      {view === 'active' && (
                        <div className="flex gap-1 mt-1">
                          {hasPending && (
                            <button 
                              onClick={() => updateBulkOrderStatus(order.food_items, "start")}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-[11px] font-bold py-1 px-2 rounded-lg flex items-center justify-center gap-1 transition-all"
                            >
                              <Play size={10} /> ເຮັດທັງໝົດ
                            </button>
                          )}
                          {(hasCooking || (hasPending && !hasCooking)) && (
                            <button 
                              onClick={() => updateBulkOrderStatus(order.food_items, "complete")}
                              className="flex-1 bg-orange-500 hover:bg-orange-600 text-slate-950 text-[11px] font-bold py-1 px-2 rounded-lg flex items-center justify-center gap-1 transition-all"
                            >
                              <Timer size={10} /> ເເສີບທັງໝົດ
                            </button>
                          )}
                          {hasReady && !hasPending && !hasCooking && (
                            <button 
                              onClick={() => updateBulkOrderStatus(order.food_items, "finish")}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-[11px] font-bold py-1 px-2 rounded-lg flex items-center justify-center gap-1 transition-all"
                            >
                              <CheckCircle size={10} /> ຈົບການເສີບ
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ລາຍການອາຫານດ້ານໃນບັດ */}
                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <ul className="space-y-3">
                        {order.food_items?.map((item, idx) => (
                          <li key={idx} className="flex flex-col gap-2 p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex gap-2">
                                <span className="bg-slate-700 text-orange-400 px-2 py-0.5 rounded-lg font-bold text-sm h-fit">
                                  {item.quantity}x
                                </span>
                                <p className="font-bold text-base leading-tight text-slate-100">{item.menu_name}</p>
                              </div>
                            </div>

                            {/* ປຸ່ມກົດອັບເດດສະຖານະແຍກລາຍຈານອາຫານ */}
                            {view === 'active' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  updateItemStatus(item.db_row_id, item.item_status);
                                }}
                                className={cn(
                                  "w-full mt-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all",
                                  item.item_status === "pending" ? "bg-blue-600 text-white hover:bg-blue-700" :
                                  item.item_status === "cooking" ? "bg-orange-500 text-slate-950 hover:bg-orange-600" :
                                  "bg-green-600 text-white hover:bg-green-700"
                                )}
                              >
                                {item.item_status === "pending" && <><Play size={12} /> ເລີ່ມເຮັດ</>}
                                {item.item_status === "cooking" && <><Timer size={12} /> ກຳລັງປຸງ... (ກົດເສີບ)</>}
                                {item.item_status === "ready" && <><CheckCircle size={12} /> ພ້ອມເສີບ (ກົດຈົບ)</>}
                              </button>
                            )}

                            {/* ຖ້າເປັນໜ້າປະຫວັດ */}
                            {view === 'history' && (
                              <span className="text-xs text-green-400 font-bold flex items-center gap-1 mt-1">
                                <CheckCircle size={12} /> ສຳເລັດແລ້ວ
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>

                      {order.order_note && (
                        <div className="mt-2 p-3 bg-red-900/20 border border-red-500/20 rounded-xl">
                          <p className="text-red-400 text-[10px] font-bold uppercase mb-1">ຄຳສັ່ງພິເສດ:</p>
                          <p className="text-white text-xs font-medium italic">"{order.order_note}"</p>
                        </div>
                      )}
                    </div>

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