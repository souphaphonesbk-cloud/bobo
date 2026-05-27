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

  useEffect(() => {
    fetchReportData();
  }, [reportType]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // 1. ດຶງຂໍ້ມູນລາຍຮັບຈາກຕາຕະລາງ Orders
      let incomeQuery = supabase
        .from("Orders")
        .select("order_id, total_amount, order_date");

      // 2. ດຶງຂໍ້ມູນລາຍຈ່າຍຈາກຕາຕະລາງ Stock_Transactions (ໃຊ້ຕົວພິມໃຫຍ່ຕາມ Supabase)
      let expenseQuery = supabase
        .from("Stock_Transactions")
        .select("id, item_name, quantity, cost_price, created_at");

      // ---- ສ່ວນຂອງການກອງວັນທີ (Filter) ----
      const now = new Date();
      
      if (reportType === "daily") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1); 
        
        incomeQuery = incomeQuery.gte("order_date", yesterday.toISOString()); 
        expenseQuery = expenseQuery.gte("created_at", yesterday.toISOString());
      } else if (reportType === "monthly") {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startIso = firstDayOfMonth.toISOString();
        
        incomeQuery = incomeQuery.gte("order_date", startIso);
        expenseQuery = expenseQuery.gte("created_at", startIso);
      } else if (reportType === "yearly") {
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        const lastDayOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        
        incomeQuery = incomeQuery
          .gte("order_date", firstDayOfYear.toISOString())
          .lte("order_date", lastDayOfYear.toISOString());
          
        expenseQuery = expenseQuery
          .gte("created_at", firstDayOfYear.toISOString())
          .lte("created_at", lastDayOfYear.toISOString());
      }

      const [incomeRes, expenseRes] = await Promise.all([incomeQuery, expenseQuery]);

      if (incomeRes.error) throw incomeRes.error;
      if (expenseRes.error) throw expenseRes.error;

      // ---- ປະມວນຜົນລວມລາຍຮັບ ----
      const incomeSum = incomeRes.data.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);
      
      // ---- ປະມວນຜົນລວມລາຍຈ່າຍ ----
     const expenseSum = expenseRes.data.reduce((sum, item) => {
        const cost = Number(item.cost_price) || 0;
        return sum + cost;
      }, 0);
      // ---- ລວມຂໍ້ມູນເພື່ອສະແດງໃນຕາຕະລາງ ----
      const formattedIncome = incomeRes.data.map(item => ({
        id: `IN-${item.order_id}`,
        type: "ລາຍຮັບ",
        details: `ຄ່າອາຫານ/ເຄື່ອງດື່ມ (Order #${item.order_id})`,
        amount: Number(item.total_amount),
        date: item.order_date,
        color: "text-green-600"
      }));

      const formattedExpense = expenseRes.data.map(item => ({
        id: `EX-${item.id}`,
        type: "ລາຍຈ່າຍ",
        details: `ຊື້ວັດຖຸດິບ: ${item.item_name || "ບໍ່ມີຊື່"} (${item.quantity || 0} ໜ່ວຍ)`,
        amount: Number(item.cost_price) || 0, // 🎯 ແກ້ໄຂບ່ອນນີ້: ໃຫ້ສະແດງລາຄາຕົງໆເລີຍ
        date: item.created_at,
        color: "text-red-600"
      }));

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
            <p className="text-gray-500 mt-1">ຕິດຕາມສະຖານະທາງການເງິນຂອງຮ້ານ Puckluck</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200">
            <button
              onClick={() => setReportType("daily")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${reportType === "daily" ? "bg-orange-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
            >
              ປະຈຳວັນ
            </button>
            <button
              onClick={() => setReportType("monthly")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${reportType === "monthly" ? "bg-orange-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
            >
              ປະຈຳເດືອນ
            </button>
            <button
              onClick={() => setReportType("yearly")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${reportType === "yearly" ? "bg-orange-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
            >
              ປະຈຳປີ
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
                        {tx.type === "ລายຮັບ" ? "+" : "-"}{formatMoney(tx.amount)}
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