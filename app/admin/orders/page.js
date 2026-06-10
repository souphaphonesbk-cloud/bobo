"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  X,
  Clock,
  CheckCircle,
  ChefHat,
  Package,
  Utensils,
  ArrowRight,
  ShoppingBag,
  CreditCard,
  Coins
} from "lucide-react";

export default function OrdersPage() {
  const [currentTab, setCurrentTab] = useState("active");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🛠️ ຈຸດທີ 1: ເພີ່ມ payment_method ເຂົ້າໄປໃນການ Select ຂໍ້ມູນ
  const fetchKitchenOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("Orders")
        .select(`
          order_id,
          order_status,
          order_date,
          total_amount,
          table_id,
          order_type,
          payment_method,
          items
        `) // 🎯 ເພີ່ມ payment_method ບ່ອນນີ້
        .order("order_date", { ascending: false });

      if (error) throw error;

      const uniqueOrdersMap = {};
      
      (data || []).forEach((row) => {
        const orderId = row.order_id;
        
        const parsedItems = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
        const currentItemsArray = Array.isArray(parsedItems) ? parsedItems : (parsedItems ? [parsedItems] : []);

        const normalizedItems = currentItemsArray.map(item => ({
          ...item,
          menu_name: item.laoName || item.menu_name || item.drink_name || item.name || "ບໍ່ມີຊື່ເມນູ"
        }));

        if (!uniqueOrdersMap[orderId]) {
          uniqueOrdersMap[orderId] = { 
            ...row, 
            items: [...normalizedItems] 
          };
        } else {
          normalizedItems.forEach(newItem => {
            const isDuplicate = uniqueOrdersMap[orderId].items.some(
              existingItem => (existingItem.id && existingItem.id === newItem.id) || existingItem.menu_name === newItem.menu_name
            );
            if (!isDuplicate) {
              uniqueOrdersMap[orderId].items.push(newItem);
            }
          });
        }
      });

      const groupedOrders = Object.values(uniqueOrdersMap);
      setOrders(groupedOrders);
      
      if (selectedOrder) {
        const updatedOrder = groupedOrders.find(o => o.order_id === selectedOrder.order_id);
        if (updatedOrder) setSelectedOrder(updatedOrder);
      }
    } catch (err) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();

    const channel = supabase
      .channel("kitchen_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Orders" },
        () => fetchKitchenOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedOrder?.order_id]); 

  const handleUpdateStatus = async (id, nextStatus) => {
    try {
      const { error } = await supabase
        .from("Orders")
        .update({ order_status: nextStatus })
        .eq("order_id", id);

      if (error) throw error;
      await fetchKitchenOrders();
    } catch (err) {
      alert("ບໍ່ສາມາດອັບເດດສະຖານະໄດ້: " + err.message);
    }
  };

 const formatTime = (dateString) => {
    if (!dateString) return "...";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("lo-LA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // ປ່ຽນເປັນ false ຖ້າຢາກໄດ້ເວລາ 24 ຊົ່ວໂມງ
      timeZone: "Asia/Bangkok",
    }).format(date);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "...";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("lo-LA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok",
    }).format(date);
  };

  const activeOrders = orders.filter((o) =>
    ["pending", "cooking", "ready"].includes(o.order_status)
  );
  const historyOrders = orders.filter((o) => o.order_status === "completed");

  return (
    <div className="flex min-h-screen bg-gray-100 font-lao text-slate-900">
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <header className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-gray-950">ຕິດຕາມອໍເດີ</h1>
              <p className="text-sm text-gray-600 font-medium mt-1">ຕິດຕາມ ແລະ ປັບປຸງສະຖານະອາຫານອໍເດີໜ້າເຄົາເຕີ</p>
            </div>
          </div>

          <div className="flex gap-6 mt-6 border-b border-gray-200">
            <button
              onClick={() => setCurrentTab("active")}
              className={`pb-3 px-2 text-base font-black transition-all relative ${
                currentTab === "active" ? "text-orange-600" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              ອໍເດີທີ່ກຳລັງດຳເນີນ
              <span className="ml-2 bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-black">
                {activeOrders.length}
              </span>
              {currentTab === "active" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setCurrentTab("history")}
              className={`pb-3 px-2 text-base font-black transition-all relative ${
                currentTab === "history" ? "text-orange-600" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              ປະຫວັດການສັ່ງຊື້ທັງໝົດ
              {currentTab === "history" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
              )}
            </button>
          </div>
        </header>

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-5 text-sm font-black text-gray-700"> ໂຕະ</th>
                  <th className="p-5 text-sm font-black text-gray-700">ລາຍການອາຫານ</th>
                  <th className="p-5 text-sm font-black text-gray-700">
                    {currentTab === "active" ? "ເວລາສັ່ງ" : "ວັນທີ-ເວລາສັ່ງ"}
                  </th>
                  <th className="p-5 text-sm font-black text-gray-700 text-center">ສະຖານະ {currentTab === "history" && "/ ຊ່ອງທາງຈ່າຍ"}</th>
                  <th className="p-5 text-sm font-black text-gray-700 text-right">ຍອດລວມ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {(currentTab === "active" ? activeOrders : historyOrders).map((order) => (
                  <tr
                    key={order.order_id}
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-orange-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <div className="text-lg text-gray-950 font-black">
                          {order.table_id ? `ໂຕະ  ${order.table_id}` : "🛍️ ກັບບ້ານ"}
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-sm text-gray-900 font-bold">
                      <div className="max-w-xs truncate">
                        {order.items && order.items.length > 0 
                          ? `${order.items[0].menu_name} ${order.items.length > 1 ? ` ແລະ ອີກ ${order.items.length - 1} ຢ່າງ` : ""}`
                          : "ບໍ່ມີລາຍການ"}
                      </div>
                    </td>
                    <td className="p-5 text-sm text-gray-800 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock size={15} className="text-gray-400" />
                        {currentTab === "active" ? formatTime(order.order_date) : formatDate(order.order_date)}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                        {/* ປ້າຍສະຖານະອໍເດີ */}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                            order.order_status === "pending"
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : order.order_status === "cooking"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : order.order_status === "ready"
                                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {order.order_status === "pending" && "⏳ ລໍຖ້າຄິວ"}
                          {order.order_status === "cooking" && "🍳 ກຳລັງປຸງແຕ່ງ"}
                          {order.order_status === "ready" && "✅ ເເສີບໄດ້ເລີຍ"}
                          {order.order_status === "completed" && "📦 ສຳເລັດແລ້ວ"}
                        </span>

                        {/* 🎯 ຈຸດທີ 2: ເພີ່ມການສະແດງຜົນຊ່ອງທາງການຈ່າຍເງິນໃນຕາຕະລາງ (ສະເພາະໜ້າປະຫວັດ) */}
                        {currentTab === "history" && (
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 border ${
                              order.payment_method === "cash"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : order.payment_method === "transfer"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-gray-50 text-gray-500 border-gray-200"
                            }`}
                          >
                            {order.payment_method === "cash" && (
                              <>
                                <Coins size={12} /> ເງິນສົດ
                              </>
                            )}
                            {order.payment_method === "transfer" && (
                              <>
                                <CreditCard size={12} /> ໂອນເງິນ
                              </>
                            )}
                            {!order.payment_method && "ບໍ່ລະບຸ"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-5 font-black text-orange-600 text-right text-base">
                      {Number(order.total_amount || 0).toLocaleString()} ₭
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ຖ້າບໍ່ມີຂໍ້ມູນ */}
          {(currentTab === "active" ? activeOrders : historyOrders).length === 0 && (
            <div className="p-20 text-center text-gray-400 font-bold italic bg-gray-50/50">
              📥 ບໍ່ມີຂໍ້ມູນລາຍການອໍເດີໃນຊ່ວງເວລານີ້...
            </div>
          )}
        </div>
      </main>

      {/* --- ສ່ວນຂອງ Modal ສະແດງລາຍລະອຽດ (Side Drawer) --- */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end transition-opacity">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-200">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">
                    {formatDate(selectedOrder.order_date)}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-gray-950 mt-1 flex items-center gap-2">
                  {selectedOrder.table_id ? `ໂຕະ  ${selectedOrder.table_id}` : "🛍️ ອໍເດີກັບບ້ານ"}
                </h2>
                
                {/* 🎯 ຈຸດທີ 3: ເພີ່ມປ້າຍບອກວິທີຊຳລະເງິນຢູ່ກ້ອງຫົວຂໍ້ Modal */}
                {selectedOrder.payment_method && (
                  <div className={`mt-2 text-xs font-black px-2.5 py-1 rounded-md border w-fit flex items-center gap-1 ${
                    selectedOrder.payment_method === 'cash' 
                      ? 'bg-green-50 text-green-700 border-green-100' 
                      : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {selectedOrder.payment_method === 'cash' ? <Coins size={14} /> : <CreditCard size={14} />}
                    ຊຳລະດ້ວຍ: {selectedOrder.payment_method === 'cash' ? 'ເງິນສົດ (Cash)' : 'ໂອນ OnePay (Transfer)'}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-full transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            {/* ແຖບສະແດງສະຖານةປັດຈຸບັນ */}
            <div className={`rounded-2xl p-4 mb-6 flex justify-between items-center ${
              selectedOrder.order_status === 'pending' ? 'bg-rose-50 border border-rose-100' :
              selectedOrder.order_status === 'cooking' ? 'bg-amber-50 border border-amber-100' : 'bg-emerald-50 border border-emerald-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                  selectedOrder.order_status === 'pending' ? 'bg-rose-500' :
                  selectedOrder.order_status === 'cooking' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}>
                  {selectedOrder.order_status === 'pending' && <Clock size={20} />}
                  {selectedOrder.order_status === 'cooking' && <ChefHat size={20} />}
                  {selectedOrder.order_status === 'ready' && <Utensils size={20} />}
                  {selectedOrder.order_status === 'completed' && <Package size={20} />}
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500">ສະຖານະອໍເດີປັດຈຸບັນ</div>
                  <div className="text-base font-black text-gray-900">
                    {selectedOrder.order_status === 'pending' && "ລໍຖ້າຮັບອໍເດີ"}
                    {selectedOrder.order_status === 'cooking' && "ກຳລັງເຮັດອາຫານ"}
                    {selectedOrder.order_status === 'ready' && "ອາຫານເຮັດສຳເລັດແລ້ວ"}
                    {selectedOrder.order_status === 'completed' && "ເສີບ/ຮັບເຄື່ອງຮຽບຮ້ອຍ"}
                  </div>
                </div>
              </div>
            </div>

            {/* ລາຍການອາຫານ */}
            <div className="flex-1 overflow-y-auto pr-1">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">
                ລາຍການອາຫານທີ່ສັ່ງ ({selectedOrder.items?.length || 0})
              </h3>
              <div className="space-y-3">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex gap-3 items-center min-w-0">
                      <span className="bg-orange-100 text-orange-700 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black shrink-0">
                        {item.quantity}
                      </span>
                      <span className="font-bold text-gray-950 text-sm truncate">
                        {item.menu_name}
                      </span>
                    </div>
                    <span className="font-black text-gray-700 text-sm shrink-0 ml-2">
                      {Number(item.subtotal || 0).toLocaleString()} ₭
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ຍອດລວມ ແລະ ປຸ່ມAction */}
            <div className="border-t border-gray-200 pt-4 mt-4 bg-white space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold">ຍອດລວມທັງໝົດ:</span>
                <span className="text-2xl font-black text-orange-600">
                  {Number(selectedOrder.total_amount || 0).toLocaleString()} ₭
                </span>
              </div>

              {selectedOrder.order_status === "pending" && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.order_id, "cooking")}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <ChefHat size={18} />
                  ຮັບອໍເດີ & ເລີ່ມປຸງແຕ່ງ <ArrowRight size={16} />
                </button>
              )}

              {selectedOrder.order_status === "cooking" && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.order_id, "ready")}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <CheckCircle size={18} />
                  ປຸງແຕ່ງສຳເລັດ (ແຈ້ງເສີບ) <ArrowRight size={16} />
                </button>
              )}

              {selectedOrder.order_status === "ready" && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.order_id, "completed")}
                  className="w-full bg-gray-950 hover:bg-gray-900 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <Package size={18} />
                  ປິດອໍເດີ (ເສີບແລ້ວ)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}