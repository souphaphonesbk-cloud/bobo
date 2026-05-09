"use client";
import { useState,useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Banknote, QrCode, Printer, Clock, CheckCircle2
} from 'lucide-react';

export default function BillingPage() {
  const [selectedTable, setSelectedTable] = useState('ໂຕະ 3');
  const [history, setHistory] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('Cash');
  const [billItems, setBillItems] = useState([]);
  const [tables, setTables] = useState([]); // ເກັບຂໍ້ມູນໂຕະຈາກ DB
  const [currentTableId, setCurrentTableId] = useState(null);
  const [activeTab, setActiveTab] = useState('billing'); // ເພີ່ມແຖວນີ້

const fetchActiveOrders = async (tableNumber) => {
  // 1. ດຶງຂໍ້ມູນ table_id ຈາກເລກໂຕະກ່ອນ
  const { data: tableData, error: tableError } = await supabase
    .from('Tables')
    .select('table_id')
    .eq('table_number', tableNumber)
    .single();

  if (tableError) {
    console.error("ຫາຂໍ້ມູນໂຕະບໍ່ເຫັນ:", tableError.message);
    return;
  }

  // 2. ເມື່ອມີ tableData ແລ້ວ ຈຶ່ງໄປຫາອໍເດີ
  if (tableData) {
    setCurrentTableId(tableData.table_id);
    
    const { data: orders, error: orderError } = await supabase
      .from('Orders')
      .select(`
        order_id,
        Order_Details (
          quantity,
          subtotal, 
          Menus ( laoName )
        )
      `)
      .eq('table_id', tableData.table_id)
      // ✅ ດຶງທັງອໍເດີທີ່ກຳລັງເຮັດ ແລະ ອໍເດີທີ່ເຮັດແລ້ວ (completed)
      .or('order_status.eq.pending,order_status.eq.cooking,order_status.eq.completed')
      // ✅ ທີ່ສຳຄັນ: ຕ້ອງເປັນອໍເດີທີ່ "ຍັງບໍ່ທັນຈ່າຍເງິນ" ເທົ່ານັ້ນ
      .eq('payment_status', 'unpaid'); 

    if (orderError) {
      console.error("ດຶງອໍເດີຜິດພາດ:", orderError.message);
      return;
    }

    if (orders && orders.length > 0) {
      const allItems = orders.flatMap(order => 
        order.Order_Details.map(detail => ({
          id: Math.random(), 
          name: detail.Menus?.laoName || 'ບໍ່ມີຊື່ມີນູ',
          qty: detail.quantity,
          price: detail.subtotal / detail.quantity 
        }))
      );
      setBillItems(allItems);
    } else {
      setBillItems([]);
    }
  }
};

// ຟັງຊັນດຶງຂໍ້ມູນໂຕະທັງໝົດ
const fetchTables = async () => {
  const { data, error } = await supabase
    .from('Tables')
    .select('*')
    .order('table_number', { ascending: true });
  
  if (!error) setTables(data);
};

// ເອີ້ນໃຊ້ fetchTables ເມື່ອເປີດໜ້າຈໍຄັ້ງທໍາອິດ
useEffect(() => {
  fetchTables();
}, []);

// ເພີ່ມຟັງຊັນດຶງປະຫວັດການຊຳລະ
const fetchPaymentHistory = async () => {
  const { data, error } = await supabase
    .from('Payments')
    .select(`
      payment_id,
      amount_received,
      payment_method,
      payment_date,
      table_id,
      Tables (
        table_number
      )
    `)
    .order('payment_date', { ascending: false });

  if (error) {
    console.error("Error fetching history:", error.message);
    return;
  }

  if (data) {
    const formattedHistory = data.map(item => {
      // ✅ ຕ້ອງເພີ່ມແຖວນີ້ເພື່ອສ້າງ dateObj ຈາກ payment_date ໃນ DB
      const dateObj = new Date(item.payment_date); 

      return {
        id: item.payment_id,
        table: item.Tables?.table_number || 'N/A', 
        total: item.amount_received,
        method: item.payment_method,
        // ✅ ຕອນນີ້ dateObj ຈະມີຕົວຕົນໃຫ້ເອີ້ນໃຊ້ແລ້ວ
        fullDate: dateObj.toLocaleDateString('lo-LA'), 
        time: dateObj.toLocaleTimeString('lo-LA', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
    });
    setHistory(formattedHistory);
  }
};
// ເອີ້ນໃຊ້ໃນ useEffect
useEffect(() => {
  fetchTables();
  fetchPaymentHistory(); // ດຶງປະຫວັດຕອນເປີດໜ້າ
}, []);


  // ຄິດໄລ່ເງິນ (ຕ້ອງຢູ່ພາຍໃຕ້ Component function)
  const subtotal = billItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const total = subtotal; // ສາມາດເພີ່ມ Service charge ຫຼື Tax ໄດ້ບ່ອນນີ້

const handlePayment = async () => {
  try {
    const currentTable = tables.find(t => t.table_number === selectedTable);
    
    if (!currentTable || billItems.length === 0) {
      alert("ກະລຸນາເລືອກໂຕະທີ່ມີລາຍການອາຫານ!");
      return;
    }

    const targetTableId = currentTable.table_id;

    // 1. ດຶງ order_id ທີ່ຄ້າງຊຳລະ
    const { data: activeOrder, error: findOrderError } = await supabase
      .from('Orders')
      .select('order_id')
      .eq('table_id', targetTableId)
      .or('payment_status.eq.unpaid,payment_status.is.null') 
      .limit(1)
      .maybeSingle();

    if (findOrderError) throw findOrderError;
    if (!activeOrder) throw new Error("ບໍ່ພົບອໍເດີທີ່ຄ້າງຊຳລະຂອງໂຕະນີ້");

    // 2. ບັນທຶກລົງ Table Payments
    const { error: paymentError } = await supabase
      .from('Payments')
      .insert([{
        order_id: activeOrder.order_id, 
        table_id: targetTableId,
        payment_method: selectedMethod, 
        amount_received: total,
        change_amount: 0,
        payment_date: new Date().toISOString()
      }]);

    if (paymentError) throw paymentError;

    // ✅ 3. ອັບເດດສະຖານະອໍເດີໃຫ້ເປັນ 'paid'
    const { error: updateOrderError } = await supabase
      .from('Orders')
      .update({ payment_status: 'paid', order_status: 'completed' })
      .eq('order_id', activeOrder.order_id);

    if (updateOrderError) throw updateOrderError;

    // ✅ 4. ອັບເດດສະຖານະໂຕະໃຫ້ເປັນ 'ໂຕະຫວ້າງ'
    const { error: updateTableError } = await supabase
      .from('Tables')
      .update({ status: 'ໂຕະຫວ້າງ' })
      .eq('table_id', targetTableId);

    if (updateTableError) throw updateTableError;

    // ສຸດທ້າຍ: ເຄຼຍຂໍ້ມູນໜ້າຈໍ
    alert("ຊຳລະເງິນສຳເລັດ!");
    fetchPaymentHistory(); 
    fetchTables();         
    setBillItems([]);      
    setSelectedTable(null); // ເຄຼຍການເລືອກໂຕະ

  } catch (error) {
    console.error("Payment Error:", error);
    alert("ເກີດຂໍ້ຜິດພາດ: " + error.message);
  }
};

useEffect(() => {
  if (selectedTable) {
    fetchActiveOrders(selectedTable);
  }
}, [selectedTable]);

  return (
    <div className="flex min-h-screen bg-gray-50 font-lao text-slate-800">
      <main className="flex-1 p-8 grid grid-cols-12 gap-8">
        
        {/* ເບື້ອງຊ້າຍ: ເລືອກໂຕະ & ປະຫວັດ */}
        {/* ... ດ້ານເທິງຄືເກົ່າ ... */}
<div className="col-span-12 lg:col-span-7">
  <header className="mb-8">
    <h1 className="text-2xl font-bold text-gray-800">ການຊຳລະເງິນ</h1>
    <p className="text-gray-400 text-sm">ເລືອກໂຕະເພື່ອອອກບິນ ແລະ ຊຳລະເງິນ</p>
  </header>

  {/* --- ເລີ່ມວາງສ່ວນ Tabs Switcher ບ່ອນນີ້ --- */}
  <div className="flex gap-4 mb-6 bg-gray-100 p-1 rounded-2xl w-fit">
    <button 
      onClick={() => setActiveTab('billing')}
      className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'billing' ? 'bg-white shadow-sm text-orange-500' : 'text-gray-500'}`}
    >
      ຊຳລະເງິນ
    </button>
    <button 
      onClick={() => setActiveTab('history')}
      className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'history' ? 'bg-white shadow-sm text-orange-500' : 'text-gray-500'}`}
    >
      ປະຫວັດການຊຳລະເງິນ
    </button>
  </div>

  {/* ສ່ວນເນື້ອຫາທີ່ຈະສະຫຼັບຕາມ Tab */}
  {activeTab === 'billing' ? (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-12 animate-in fade-in duration-300">
      {tables.map((table) => (
        <div 
          key={table.table_id}
          onClick={() => setSelectedTable(table.table_number)}
          className={`p-6 rounded-3xl border-2 text-center cursor-pointer transition-all ${
            selectedTable === table.table_number 
            ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-md scale-105' 
            : 'border-white bg-white text-gray-400 hover:border-gray-200'
          }`}
        >
          <div className="font-black text-xl">{table.table_number}</div>nnp
        </div>
      ))}
    </div>
  ) : (
    <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm animate-in slide-in-from-left duration-300">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Clock size={20} className="text-orange-500" /> ປະຫວັດການຊຳລະເງິນ
      </h2>
      <div className="space-y-3">
        {history.length === 0 ? (
          <p className="text-center py-6 text-gray-300 italic">ຍັງບໍ່ມີລາຍການຊຳລະ</p>
        ) : (
          history.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${item.method === 'Cash' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                  {item.method === 'Cash' ? <Banknote size={18} /> : <QrCode size={18} />}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-700">{item.table}</p>
                  <p className="text-[10px] text-gray-400">{item.fullDate} • {item.time} • {item.method === 'Cash' ? 'ເງິນສົດ' : 'ໂອນເງິນ'}</p>
                </div>
              </div>
              <p className="font-black text-slate-700">{item.total.toLocaleString()} KIP</p>
            </div>
          ))
        )}
      </div>
    </div>
  )}
  {/* --- ສິ້ນສຸດສ່ວນທີ່ວາງໃໝ່ --- */}

</div>

        {/* ເບື້ອງຂວາ: Preview ບິນ */}
        <div className="col-span-12 lg:col-span-5">
          <div className="bg-white rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 p-8 sticky top-8">
            <div className="flex justify-between items-center mb-6">
              <span className="font-black text-xl">ບິນເກັບເງິນ {selectedTable}</span>
              <button className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600">
                <Printer size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2">
              {billItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex gap-3">
                    <span className="text-gray-400 font-bold">{item.qty}x</span>
                    <span className="text-gray-700 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold">{(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-200 pt-6 space-y-3">
              <div className="flex justify-between text-gray-400 text-sm">
                <span>ລວມຍອດອາຫານ</span>
                <span>{subtotal.toLocaleString()} KIP</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-lg text-gray-800">ຍອດລວມທັງໝົດ</span>
                <span className="font-black text-2xl text-orange-600">{total.toLocaleString()} KIP</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
          {/* ປຸ່ມເງິນສົດ */}
        <button 
    onClick={() => setSelectedMethod('Cash')}
    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
      selectedMethod === 'Cash' ? 'border-orange-500 bg-orange-50' : 'border-gray-50'
    }`}
  >
    <Banknote className="text-green-500" />
    <span className="text-xs font-bold">ເງິນສົດ</span>
  </button>

  {/* ປຸ່ມໂອນເງິນ */}
  <button 
    onClick={() => setSelectedMethod('Transfer')}
    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
      selectedMethod === 'Transfer' ? 'border-orange-500 bg-orange-50' : 'border-gray-50'
    }`}
  >
    <QrCode className="text-blue-500" />
    <span className="text-xs font-bold">ໂອນເງິນ (OnePay)</span>
  </button>
</div>

            <button 
              onClick={handlePayment}
              className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold mt-6 shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95"
            >
              ຢືນຢັນການຊຳລະເງິນ
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}