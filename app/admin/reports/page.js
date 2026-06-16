"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import * as XLSX from "xlsx";

export default function ReportsPage() {
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [allTransactions, setAllTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // ຟັງຊັນ Export Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredTransactions);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
    XLSX.writeFile(workbook, "Financial_Report.xlsx");
  };

  // ຂໍ້ມູນສຳລັບ Chart (ຈັດຮູບແບບຂໍ້ມູນ)
  const chartData = [
    { name: "ລາຍຮັບ", amount: totalIncome },
    { name: "ລາຍຈ່າຍ", amount: totalExpense },
  ];

  useEffect(() => { fetchReportData(); }, [startDate, endDate]);

  useEffect(() => {
    if (filterType === "all") setFilteredTransactions(allTransactions);
    else setFilteredTransactions(allTransactions.filter(tx => tx.type === filterType));
  }, [filterType, allTransactions]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const [incomeRes, expenseRes] = await Promise.all([
        supabase
          .from("Orders")
          .select("order_id, total_amount, order_date")
          .eq("payment_status", "paid")
          .gte("order_date", start.toISOString())
          .lte("order_date", end.toISOString()),
        supabase
          .from("Stock_Transactions")
          .select("id, item_name, quantity, cost_price, created_at")
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString())
      ]);

      const uniqueIncome = [];
      const incomeMap = new Map();
      (incomeRes.data || []).forEach(item => {
        if (!incomeMap.has(item.order_id)) {
          const formatted = {
            id: `IN-${item.order_id}`,
            type: "ລາຍຮັບ",
            details: ` #${item.order_id}`,
            amount: Number(item.total_amount),
            date: item.order_date,
            color: "text-green-600"
          };
          uniqueIncome.push(formatted);
          incomeMap.set(item.order_id, true);
        }
      });

      const formattedExpense = (expenseRes.data || []).map(item => ({
        id: `EX-${item.id}`,
        type: "ລາຍຈ່າຍ",
        details: `ຊື້: ${item.item_name} (${item.quantity} ໜ່ວຍ)`,
        amount: Number(item.cost_price),
        date: item.created_at,
        color: "text-red-600"
      }));

      const all = [...uniqueIncome, ...formattedExpense].sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setAllTransactions(all);
      setTotalIncome(uniqueIncome.reduce((sum, item) => sum + item.amount, 0));
      setTotalExpense(formattedExpense.reduce((sum, item) => sum + item.amount, 0));
    } catch (err) {
      console.error("Error fetching report:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val) => new Intl.NumberFormat("lo-LA").format(val) + " ກີບ";

  return (
    <div className="h-screen flex flex-col p-6 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full gap-4">
        
        {/* Header & Export Button */}
        <div className="flex justify-between items-center shrink-0">
            <h1 className="text-2xl font-bold text-gray-800">📊 ລາຍງານການເງິນ</h1>
            <button onClick={exportToExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">Export Excel</button>
        </div>

        {/* Top Area: Minimized Chart & Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
            {/* ປັບໃຫ້ກຣາຟນ້ອຍລົງ (ຫຍໍ້ຄວາມສູງເຫຼືອ h-32) */}
            <div className="bg-white p-4 rounded-xl shadow-sm h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" fontSize={12} />
                  <Bar dataKey="amount" fill="#8884d8" barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Date Filter ແລະ Summary Cards ທີ່ກະທັດຮັດຂຶ້ນ */}
            <div className="flex flex-col gap-4">
                <div className="flex gap-2 text-black items-center">
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border p-2 rounded-lg text-sm" />
                  <span>ເຖິງ</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border p-2 rounded-lg text-sm" />
                  <button onClick={fetchReportData} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600">ຄົ້ນຫາ</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div onClick={() => setFilterType("ລາຍຮັບ")} className={`cursor-pointer p-4 rounded-xl shadow-sm border-2 ${filterType === "ລາຍຮັບ" ? "border-green-500 bg-green-50" : "bg-white border-gray-100"}`}>
                        <p className="text-gray-500 text-sm">ລາຍຮັບ</p>
                        <h2 className="text-xl font-bold text-green-600">{formatMoney(totalIncome)}</h2>
                    </div>
                    <div onClick={() => setFilterType("ລາຍຈ່າຍ")} className={`cursor-pointer p-4 rounded-xl shadow-sm border-2 ${filterType === "ລາຍຈ່າຍ" ? "border-red-500 bg-red-50" : "bg-white border-gray-100"}`}>
                        <p className="text-gray-500 text-sm">ລາຍຈ່າຍ</p>
                        <h2 className="text-xl font-bold text-red-600">{formatMoney(totalExpense)}</h2>
                    </div>
                </div>
            </div>
        </div>

        <button onClick={() => setFilterType("all")} className="mb-2 text-sm text-gray-500 underline hover:text-gray-800 shrink-0">
          ລາຍການທັງໝົດ
        </button>

        {/* Transactions Table Area: Maximize height (flex-1 and overflow-y-auto) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col flex-1">
          <div className="sticky top-0 bg-gray-50 border-b shrink-0 z-10">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-500 text-xs uppercase font-semibold">
                  <th className="p-3 w-1/4">ວັນທີ</th>
                  <th className="p-3 w-1/4">ປະເພດ</th>
                  <th className="p-3 w-1/4">ເລກອໍເດີ</th>
                  <th className="p-3 w-1/4 text-right">ຈຳນວນເງິນ</th>
                </tr>
              </thead>
            </table>
          </div>
          
          <div className="overflow-y-auto flex-1"> 
            <table className="w-full text-left">
              <tbody className="divide-y divide-gray-50">
                {filteredTransactions.map((tx, index) => (
                  <tr key={`${tx.id}-${index}`} className="hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-600 w-1/4">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="p-3 w-1/4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 w-max ${tx.type === "ລາຍຮັບ" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {tx.type === "ລາຍຮັບ" ? "💰" : "📉"} {tx.type}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-700 w-1/4">{tx.details}</td>
                    <td className={`p-3 text-right font-bold w-1/4 ${tx.color}`}>
                      {tx.type === "ລາຍຮັບ" ? "+" : "-"}{formatMoney(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}