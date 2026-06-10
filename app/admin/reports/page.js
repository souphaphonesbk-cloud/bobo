"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 

export default function ReportsPage() {
  const [reportType, setReportType] = useState("daily"); // daily, monthly, yearly
  
  // States ສຳລັບເກັບຄ່າຕົວເລກ
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate]); // 🎯 ແກ້ໄຂໃຫ້ໂຫຼດຂໍ້ມູນໃໝ່ ເມື່ອມີການປ່ຽນແປງວັນທີ

const fetchReportData = async () => {
    setLoading(true);
    try {
      // ປັບວັນທີໃຫ້ເປັນຮູບແບບທີ່ Supabase ເຂົ້າໃຈ
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // ດຶງຂໍ້ມູນ Orders (ກອງເອົາສະເພາະບິນທີ່ຈ່າຍແລ້ວ 'paid')
      let incomeQuery = supabase
        .from("Orders")
        .select("order_id, total_amount, order_date, items")
        .eq("payment_status", "paid")
        .gte("order_date", start.toISOString())
        .lte("order_date", end.toISOString());

      let expenseQuery = supabase
        .from("Stock_Transactions")
        .select("id, item_name, quantity, cost_price, created_at")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      const [incomeRes, expenseRes] = await Promise.all([incomeQuery, expenseQuery]);

      if (incomeRes.error) throw incomeRes.error;
      if (expenseRes.error) throw expenseRes.error;

      // 🛠️ ຈັດການບັນຫາ Bulk Insert: Group ຂໍ້ມູນ Orders ແລະ ລວມ Items ເຂົ້າກັນຢ່າງຖືກຕ້ອງ (ຝັ່ງລາຍຮັບ)
      const uniqueOrdersMap = {};
      
      (incomeRes.data || []).forEach((row) => {
        const orderId = row.order_id;
        const parsedItems = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
        const currentItemsArray = Array.isArray(parsedItems) ? parsedItems : (parsedItems ? [parsedItems] : []);

        if (!uniqueOrdersMap[orderId]) {
          uniqueOrdersMap[orderId] = { 
            ...row, 
            items: [...currentItemsArray] 
          };
        } else {
          currentItemsArray.forEach(newItem => {
            const isDuplicate = uniqueOrdersMap[orderId].items.some(
              existingItem => (existingItem.id && existingItem.id === newItem.id) || existingItem.menu_name === newItem.menu_name
            );
            if (!isDuplicate) {
              uniqueOrdersMap[orderId].items.push(newItem);
            }
          });
        }
      });
      
      const uniqueOrders = Object.values(uniqueOrdersMap);

      // ---- ປະມວນຜົນລວມລາຍຮັບ (ຄິດໄລ່ຈາກບິນທີ່ຈັດກຸ່ມແລ້ວ) ----
      const incomeSum = uniqueOrders.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);
      
      // ---- ປະມວນຜົນລວມລາຍຈ່າຍ (🎯 ແກ້ໄຂ: ເອົາຄ່າ cost_price ມາບວກກັນໂດຍກົງ ບໍ່ຕ້ອງຄູນ quantity ຊ້ຳ) ----
      const expenseSum = (expenseRes.data || []).reduce((sum, item) => {
        return sum + (Number(item.cost_price) || 0);
      }, 0);

      // ---- ຈັດຟໍແມັດຂໍ້ມູນຝັ່ງລາຍຮັບ ----
      const formattedIncome = uniqueOrders.map(item => {
        const itemsSummary = item.items && item.items.length > 0
          ? item.items.map(i => `${i.laoName || i.menu_name || "ອາຫານ"} x${i.quantity || 1}`).join(", ")
          : "ຄ່າອາຫານ/ເຄື່ອງດື່ມ";

        return {
          id: `IN-${item.order_id}`,
          type: "ລາຍຮັບ",
          details: `Order #${item.order_id} [${itemsSummary}]`,
          amount: Number(item.total_amount),
          date: item.order_date,
          color: "text-green-600"
        };
      });

      // ---- ຈັດຟໍແມັດຂໍ້ມູນຝັ່ງລາຍຈ່າຍ (🎯 ແກ້ໄຂ: ໃຫ້ເອົາຄ່າ cost_price ມາເປັນຍອດເງິນຂອງແຖວນັ້ນເລີຍ) ----
      const formattedExpense = (expenseRes.data || []).map(item => {
        const totalRowCost = Number(item.cost_price) || 0;
        const qty = Number(item.quantity) || 1;

        return {
          id: `EX-${item.id}`,
          type: "ລາຍຈ່າຍ",
          details: `ຊື້ວັດຖຸດິບ: ${item.item_name || "ບໍ່ມີຊື່"} (${qty} ໜ່ວຍ x ${(totalRowCost / qty).toLocaleString()} ₭)`,
          amount: totalRowCost, // 🎯 ໃຊ້ຄ່າ cost_price ໂດຍກົງ ເປັນຈຳນວນເງິນທີ່ຖືກຕ້ອງ
          date: item.created_at,
          color: "text-red-600"
        };
      });

      const allTransactions = [...formattedIncome, ...formattedExpense].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setTotalIncome(incomeSum);
      setTotalExpense(expenseSum);
      setTransactions(allTransactions);

    } catch (err) {
      console.error("Error fetching report:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (value) => {
    return new Intl.NumberFormat("lo-LA").format(value) + " ກີບ";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return d.toLocaleDateString("lo-LA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const netProfit = totalIncome - totalExpense;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">📊 ລາຍງານລາຍຮັບ - ລາຍຈ່າຍ</h1>
            <p className="text-gray-500 mt-1">ຕິດຕາມສະຖານةທາງການເງິນຂອງຮ້ານ Puckluck</p>
          </div>
          
          <div className="flex items-center gap-2 mt-4 text-black">
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="border p-2 rounded-lg"
            />
            <span>ເຖິງ</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="border p-2 rounded-lg"
            />
            <button 
              onClick={fetchReportData}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              ຄົ້ນຫາ
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">ລາຍຮັບທັງໝົດ</span>
              <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">💰</div>
            </div>
            <h2 className="text-2xl font-bold text-green-600">{formatMoney(totalIncome)}</h2>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">ລາຍຈ່າຍທັງໝົດ</span>
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">📉</div>
            </div>
            <h2 className="text-2xl font-bold text-red-600">{formatMoney(totalExpense)}</h2>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">ກຳໄລສຸດທິ</span>
              <div className={`p-2.5 rounded-xl ${netProfit >= 0 ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>📈</div>
            </div>
            <h2 className={`text-2xl font-bold ${netProfit >= 0 ? "text-blue-600" : "text-amber-600"}`}>
              {formatMoney(netProfit)}
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-800">📝 ລາຍການເຄື່ອນໄຫວ</h3>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">ກຳລັງໂຫຼດຂໍ້ມູນລາຍງານ...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-gray-400">ບໍ່ມີຂໍ້ມູນລາຍຮັບ-ລາຍຈ່າຍໃນຊ່ວງເວລານີ້</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-100">
                    <th className="p-4">ວັນທີ-ເວລາ</th>
                    <th className="p-4">ປະເພດ</th>
                    <th className="p-4">ລາຍລະອຽດລາຍການ</th>
                    <th className="p-4 text-right">ຈຳນວນເງິນ</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-600 divide-y divide-gray-50">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 text-gray-500 whitespace-nowrap">{formatDate(tx.date)}</td>
                      <td className="p-4 font-medium">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${tx.type === "ລາຍຮັບ" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-4 text-gray-700 max-w-md truncate">{tx.details}</td>
                      <td className={`p-4 text-right font-bold ${tx.color}`}>
                        {tx.type === "ລາຍຮັບ" ? "+" : "-"}{formatMoney(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}