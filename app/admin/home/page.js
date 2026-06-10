"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  DollarSign, 
  ShoppingBag, 
  CreditCard, 
  Coins, 
  Utensils,
  Star,
  TrendingUp
} from "lucide-react";
// 📊 ປັບ Import ມາໃຊ້ AreaChart ຫຼື BarChart ທີ່ເນັ້ນສະແດງແນວໂນ້ມລາຍເດືອນ
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    todaySales: 0,
    todayOrderCount: 0,
    avgOrderValue: 0,
    cashSales: 0,
    transferSales: 0
  });
  const [chartData, setChartData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getDashboardData() {
      try {
        // 1. ດຶງຂໍ້ມູນອໍເດີ
        const { data: rawOrders, error: orderErr } = await supabase
          .from("Orders")
          .select("*")
          .eq("order_status", "completed");

        if (orderErr) throw orderErr;

        // 2. ດຶງຂໍ້ມູນເມນູ ແລະ ເຄື່ອງດື່ມ (ໃຊ້ laoName ແມັດຊິງຮູບພາບ)
        const { data: menus } = await supabase.from("Menus").select("laoName, image");
        const { data: drinks } = await supabase.from("Drink").select("laoName, image");

        const imageMap = {};
        (menus || []).forEach(m => { if (m.laoName) imageMap[m.laoName.trim()] = m.image; });
        (drinks || []).forEach(d => { if (d.laoName) imageMap[d.laoName.trim()] = d.image; });

        // 3. ຕັດອໍເດີຊ້ຳ
        const uniqueOrdersMap = new Map();
        (rawOrders || []).forEach(order => {
          if (!uniqueOrdersMap.has(order.order_id)) {
            uniqueOrdersMap.set(order.order_id, order);
          }
        });
        const orders = Array.from(uniqueOrdersMap.values());

        // ເວລາປັດຈຸບັນ
        const localToday = new Date().toLocaleDateString("en-CA");

        let todayTotal = 0;
        let todayCount = 0;
        let todayCash = 0;
        let todayTransfer = 0;
        
        // 🎯 ໂຄງສ້າງເກັບຂໍ້ມູນແຍກລາຍເດືອນ
        const monthlySalesMap = {}; 
        const itemCounter = {};

        orders.forEach(order => {
          const amount = Number(order.total_amount || 0);
          const payMethod = order.payment_method || "cash";
          
          const orderDate = new Date(order.order_date);
          const orderDateStr = orderDate.toLocaleDateString("en-CA");
          
          // 🎯 ປ່ຽນ Key ການກຸ່ມໃຫ້ດຶງເອົາ ເດືອນ ແລະ ປີ ເພື່ອລຽງລໍາດັບ (Format: 2026-06)
          const year = orderDate.getFullYear();
          const month = String(orderDate.getMonth() + 1).padStart(2, '0');
          const monthKey = `${year}-${month}`; // ໃຊ້ສຳລັບ Sort ຂໍ້ມູນວັນທີໃຫ້ຖືກຕ້ອງ
          
          // ຊື່ເດືອນພາສາລາວສຳລັບໂຊໃນກຣາຟ (ເຊັ່ນ: ມິຖຸນາ 2026)
          const monthLabel = orderDate.toLocaleDateString("lo-LA", { month: "short", year: "numeric" });
          
          if (!monthlySalesMap[monthKey]) {
            monthlySalesMap[monthKey] = {
              label: monthLabel,
              total: 0,
              cash: 0,
              transfer: 0
            };
          }
          
          // ບວກຍອດເຂົ້າເດືອນນັ້ນໆ
          monthlySalesMap[monthKey].total += amount;
          if (payMethod === "cash") monthlySalesMap[monthKey].cash += amount;
          if (payMethod === "transfer") monthlySalesMap[monthKey].transfer += amount;

          // ຄຳນວນຍອດມື້ນີ້
          if (orderDateStr === localToday) {
            todayTotal += amount;
            todayCount += 1;
            if (payMethod === "cash") todayCash += amount;
            if (payMethod === "transfer") todayTransfer += amount;
          }

          // ນັບເມນູຂາຍດີ
          try {
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            if (Array.isArray(items)) {
              items.forEach(item => {
                const name = (item.menu_name || item.name || "ບໍ່ມີຊື່").trim();
                const qty = Number(item.quantity || 1);
                const price = Number(item.price || 0);
                const img = imageMap[name] || null;

                if (!itemCounter[name]) {
                  itemCounter[name] = { qty: 0, image: img, price: price, count: 0 };
                }
                itemCounter[name].qty += qty;
                itemCounter[name].count += 1;
              });
            }
          } catch (e) {
            console.error("Error parsing items:", e);
          }
        });

        // 📊 🎯 ລຽງລໍາດັບເດືອນຈາກອະດີດມາຫາປັດຈຸບັນ (Chronological Order) ແລ້ວແປງລົງກຣາຟ
        const sortedMonths = Object.keys(monthlySalesMap).sort();
        const formattedChartData = sortedMonths.map(key => ({
          name: monthlySalesMap[key].label,
          "ຍອດຂາຍລວມ": monthlySalesMap[key].total,
          "ເງິນສົດ": monthlySalesMap[key].cash,
          "ເງິນໂອນ": monthlySalesMap[key].transfer,
        }));

        // ເມນູຍອດນິຍົມ 3 ອັນດັບ
        const formattedTopItems = Object.keys(itemCounter).map(name => ({
          name,
          qty: itemCounter[name].qty,
          image: itemCounter[name].image,
          price: itemCounter[name].price,
          rating: (Math.random() * (5 - 4.6) + 4.6).toFixed(1),
          orderCount: itemCounter[name].count 
        })).sort((a, b) => b.qty - a.qty).slice(0, 3);

        setMetrics({
          todaySales: todayTotal,
          todayOrderCount: todayCount,
          avgOrderValue: todayCount ? Math.round(todayTotal / todayCount) : 0,
          cashSales: todayCash,
          transferSales: todayTransfer
        });
        setChartData(formattedChartData);
        setTopItems(formattedTopItems);

      } catch (err) {
        console.error("Dashboard Error:", err.message);
      } finally {
        setLoading(false);
      }
    }

    getDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 font-lao">
        <div className="text-center font-bold text-orange-600">⏳ ກຳລັງໂຫຼດລາຍງານຍອດຂາຍແຕ່ລະເດືອນ...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-lao text-slate-900 flex flex-col md:flex-row">
      
      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6">
        
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-950">Dashboard ສະຫຼຸບຍອດຂາຍ</h1>
            <p className="text-sm text-gray-500 mt-1">ຮ້ານອາຫານປັກຫຼັກ (ຂໍ້ມູນສະຫຼຸບລາຍເດືອນ)</p>
          </div>
        </header>

        {/* 📊 Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase">ຍອດຂາຍຂອງມື້ນີ້</span>
              <h3 className="text-2xl font-black text-orange-600">{metrics.todaySales.toLocaleString()} ₭</h3>
            </div>
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
              <DollarSign size={24} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase">ຈຳນວນອໍເດີມື້ນີ້</span>
              <h3 className="text-2xl font-black text-gray-950">{metrics.todayOrderCount} ອໍເດີ</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <ShoppingBag size={24} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase">ສະເລ່ຍ/ບິນ (ມື້ນີ້)</span>
              <h3 className="text-2xl font-black text-gray-950">{metrics.avgOrderValue.toLocaleString()} ₭</h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2 text-xs font-bold">
            <span className="text-xs font-bold text-gray-400 uppercase block">ແຍກຮັບເງິນ (ມື້ນີ້)</span>
            <div className="flex justify-between text-green-600">
              <span className="flex items-center gap-1"><Coins size={14}/> ສົດ (cash):</span>
              <span>{metrics.cashSales.toLocaleString()} ₭</span>
            </div>
            <div className="flex justify-between text-blue-600">
              <span className="flex items-center gap-1"><CreditCard size={14}/> ໂອນ (transfer):</span>
              <span>{metrics.transferSales.toLocaleString()} ₭</span>
            </div>
          </div>
        </div>

        {/* 📊 🎯 ກຣາຟຍອດຂາຍແຕ່ລະເດືອນ (Area Chart ໄລ່ລະດັບສີໃຫ້ເຫັນ Growth ທຸກໆເດືອນ) */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-gray-950 text-base">📊 ແນວໂນ້ມຍອດຂາຍແຕ່ລະເດືອນ</h3>
            <span className="text-xs font-bold text-gray-400">ລຽງຕາມວັນທີອໍເດີ</span>
          </div>
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 15, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontClassName: 'font-lao' }} />
                <YAxis stroke="#94a3b8" />
                <Tooltip formatter={(value) => [`${value.toLocaleString()} ₭`]} />
                <Legend />
                {/* ເສັ້ນຫຼັກສະແດງຍອດຂາຍລວມແຕ່ລະເດືອນ */}
                <Area type="monotone" dataKey="ຍອດຂາຍລວມ" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </main>

      {/* Side Content: Trending Menus */}
      <aside className="w-full md:w-[320px] lg:w-[360px] bg-white md:border-l border-gray-200 p-6 flex flex-col space-y-6 overflow-y-auto shadow-sm">
        
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <h2 className="font-black text-xl text-gray-950">🏆 ເມນູຍອດນິຍົມ</h2>
          <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">ຂາຍດີທີ່ສຸດ</span>
        </div>

        {topItems.length > 0 ? (
          topItems.map((item, index) => (
            <div key={index} className="bg-gray-50/50 rounded-2xl border border-gray-100 p-4 space-y-3 shadow-sm hover:border-orange-200 hover:bg-orange-50/20 transition-all">
              
              <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-inner">
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = "https://placehold.co/400x300?text=Puckluck+Food"; }}
                  />
                ) : (
                  <div className="w-full h-full text-orange-600 flex flex-col gap-1 items-center justify-center bg-orange-50/50 p-2 text-center">
                    <Utensils size={28} />
                    <span className="text-[10px] font-bold text-orange-400">ບໍ່ມີຮູບໃນລະບົບ</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="font-black text-gray-950 text-sm line-clamp-1">{item.name}</h3>
                <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                  <Star size={13} fill="currentColor" />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs">
                <span className="font-black text-sm text-orange-600">
                  {item.price > 0 ? `${item.price.toLocaleString()} ₭` : "ລາຍການແຖມ"}
                </span>
                <span className="bg-orange-600 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-sm">
                  ຂາຍໄດ້ {item.qty} ຈານ
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-400 text-sm py-20 font-bold italic border-2 border-dashed border-gray-100 rounded-2xl">📥 ບໍ່ມີຂໍ້ມູນເມນູ</div>
        )}

      </aside>

    </div>
  );
}