"use client";
import { useState, useEffect, useRef } from 'react'; 
import { useReactToPrint } from 'react-to-print';
import { supabase } from '../../../lib/supabase';
import Link from 'next/link'; 
import { QRCodeSVG } from 'qrcode.react';
import { Search, Bell, QrCode, CreditCard, UserPlus, Timer, CheckCircle2, Banknote, ChevronLeft } from 'lucide-react';
import PrintableReceipt from '../../compronent/PrintableReceipt'; 

export default function DashboardPage() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBillingMode, setIsBillingMode] = useState(false); 
  const [tableOrders, setTableOrders] = useState([]); 
  const [paymentMethod, setPaymentMethod] = useState('cash'); 

  // 🎯 1. ສ້າງ Ref ຜູກກັບ Component ໃບບິນທີ່ຈະປຣີ້ນ
  const componentRef = useRef(null);

  // 🎯 2. ຕັ້ງຄ່າການປຣີ້ນດ້ວຍ useReactToPrint
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'QR_Code_Receipt',
  });

  // 🎯 3. ຟັງຊັນຕອນກົດປຸ່ມ "ປຣີ້ນ QR Code" (ເຮັດວຽກສະເພາະຕອນກົດ)
  const handlePrintClick = async () => {
    if (!selectedTable) return;

    // 📱 ເຊັກວ່າ ຖ້າກົດຢູ່ເຄື່ອງ Sunmi ກົງໆ (Android) ໃຫ້ສັ່ງປຣີ້ນອອກເຄື່ອງມັນທັນທີ
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      handlePrint();
      return;
    }

    // 💻 ຖ້າກົດຢູ່ໜ້າຄອມ: ໃຫ້ສົ່ງສັນຍານໄປບອກ Supabase ເພື່ອໃຫ້ Sunmi ປຣີ້ນອັດຕະໂນມັດ
    const { error } = await supabase
      .from('Tables') 
      .update({ trigger_print: true })
      .eq('table_id', selectedTable.table_id);

    if (error) {
      console.error("Error triggering print:", error.message);
      alert("ບໍ່ສາມາດສົ່ງຄຳສັ່ງປຣີ້ນໄດ້: " + error.message);
    } else {
      alert(`🔔 ສົ່ງຄຳສັ່ງປຣີ້ນ ${selectedTable.table_number} ໄປຫາເຄື່ອງ Sunmi ແລ້ວ!`);
    }
  };

  // 🎯 4. ລະບົບ Realtime ດັກຟັງຄຳສັ່ງປຣີ້ນ (ຄອມສັ່ງ -> Sunmi ປຣີ້ນ)
  useEffect(() => {
    const isAndroid = /Android/i.test(navigator.userAgent);

    const channels = supabase
      .channel('table-print-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'Tables' }, 
        async (payload) => {
          // 🔥 ໃຫ້ເຮັດງານ ສະເພາະຢູ່ໃນເຄື່ອງ Sunmi (Android) ເທົ່ານັ້ນ! ຝັ່ງຄອມຈະບໍ່ເອີ້ນໜ້າປຣີ້ນ
          if (payload.new.trigger_print === true && isAndroid) {
            
            // ຄົ້ນຫາໂຕະທີ່ຖືກສັ່ງປຣີ້ນມາ ເພື່ອໃຫ້ Component ໃບບິນອັບເດດຂໍ້ມູນກ່ອນປຣີ້ນ
            const targetTable = tables.find(t => t.table_id === payload.new.table_id) || payload.new;
            setSelectedTable(targetTable);

            // ໜ່ວງເວລາເລັກນ້ອຍໃຫ້ State ອັບເດດ ແລ້ວສັ່ງປຣີ້ນທັນທີ
            setTimeout(async () => {
              handlePrint(); 

              // ປຣີ້ນແລ້ວ ເຄຼຍຄ່າມາເປັນ false ຄືເກົ່າ ເພື່ອຮອງຮັບການກົດເທື່ອໜ້າ
              await supabase
                .from('Tables')
                .update({ trigger_print: false })
                .eq('table_id', payload.new.table_id);
            }, 500);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channels);
    };
  }, [tables]);

  // 🎯 ຟັງຊັນດຶງຂໍ້ມູນໂຕະທັງໝົດ
  const fetchTables = async () => {
    const { data, error } = await supabase
      .from('Tables')
      .select('*')
      .order('table_id', { ascending: true }); 
    
    if (!error) setTables(data);
    setLoading(false);
  };

  // 🎯 ຟັງຊັນດຶງລາຍການອາຫານ
  // 🎯 ເພີ່ມ laoName ເຂົ້າໄປໃນການດຶງຂໍ້ມູນ
const fetchTableOrders = async (tableId) => {
  const { data, error } = await supabase
    .from('Orders')
    .select(`
      order_id,
      total_amount,
      payment_status,
      order_status,
      table_id,
      Order_Details (
        quantity,
        subtotal,
        menu_id,
        drink_id,
        Menus ( menu_name, price, laoName ),   
        Drink ( drink_name, price, laoName )   
      )
    `)
    .eq('table_id', tableId) 
    .in('payment_status', ['unpaid', null]) 
    .order('order_id', { ascending: false });

  if (error) {
    console.error("Error fetching table orders:", error.message);
  } else {
    setTableOrders(data || []);
  }
};

  useEffect(() => {
    fetchTables();
    const channel = supabase
      .channel('table_db_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Tables' }, () => {
        fetchTables();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    if (selectedTable && isBillingMode) {
      fetchTableOrders(selectedTable.table_id);
    }
  }, [selectedTable, isBillingMode]);

  // ຟັງຊັນ "ເປີດໂຕະ"
  const handleOpenTable = async (id) => {
    const newToken = crypto.randomUUID(); 
    const newStatus = 'ບໍ່ຫວ້າງ';

    setTables(prevTables => 
      prevTables.map(t => t.table_id === id ? { ...t, status: newStatus, qr_code_token: newToken } : t)
    );
    
    setSelectedTable(prev => ({ ...prev, status: newStatus, qr_code_token: newToken }));
    
    const { error } = await supabase
      .from('Tables')
      .update({ 
        status: 'ບໍ່ຫວ້າງ', 
        qr_code_token: newToken,
      })
      .eq('table_id', id);
    
    if (error) alert("ເກີດຂໍ້ຜິດພາດໃນການເປີດໂຕະ");
  };

  // ຟັງຊັນ Checkout
  const handleCheckout = async (tableId) => {
    try {
      const { error: tableError } = await supabase
        .from('Tables')
        .update({ status: 'ໂຕະຫວ້າງ', qr_code_token: null })
        .eq('table_id', tableId);

      if (tableError) throw tableError;

      if (tableOrders.length > 0) {
        const orderIds = tableOrders.map(o => o.order_id);
        const { error: orderError } = await supabase
          .from('Orders')
          .update({ 
            payment_status: 'paid', 
            order_status: 'completed',
            payment_method: paymentMethod 
          })
          .in('order_id', orderIds);

        if (orderError) throw orderError;
      }

      setIsBillingMode(false);
      setSelectedTable(null);
      fetchTables();
      alert("🎉 ชຳລະເງິນສຳເລັດແລ້ວ!");

    } catch (error) {
      alert("ເກີດຂໍ້ຜິດພາດ: " + error.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-lao text-slate-800">
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-black">Puckluck POS</h1>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {tables.map(table => (
            <div 
              key={table.table_id} 
              onClick={() => {
                setSelectedTable(table);
                setIsBillingMode(false); 
              }}
              className={`p-6 rounded-[32px] border-2 transition-all cursor-pointer ${
                selectedTable?.table_id === table.table_id ? 'border-orange-500 bg-white shadow-xl scale-105' : 
                table.status === 'ບໍ່หว້າງ' ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-transparent'
              }`}
            >
              <div className="flex justify-between mb-2">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${table.status === 'ບໍ່ຫວ້າງ' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                  {table.status || 'ໂຕະຫວ້າງ'}
                </span>
              </div>
              <h3 className="text-2xl font-black">{table.table_number}</h3>
            </div>
          ))}
        </div>
      </main>

      <aside className="w-80 bg-white border-l p-6 flex flex-col shadow-lg transition-all">
        {selectedTable ? (
          <div className="animate-in fade-in slide-in-from-right duration-300 h-full flex flex-col">
            
            {isBillingMode ? (
              <div className="flex flex-col h-full space-y-6 items-center justify-between">
                <div className="flex justify-between items-center">
                  <button onClick={() => setIsBillingMode(false)} className="p-2 hover:bg-gray-100 rounded-full">
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-xl font-bold ">ບິນ {selectedTable.table_number}</h2>
                </div>

               <div className="flex-1 overflow-y-auto pr-2 space-y-3">
  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ລາຍການອາຫານ</p>
  {tableOrders.length > 0 ? (
    tableOrders.flatMap(order => order.Order_Details || []).map((item, idx) => {
      
      // 🎯 ວິທີແກ້ໄຂ: ໃຫ້ກວດເຊັກ ແລະ ສະແດງຜົນທັງ 2 ພາສາ (ຫຼື ພາສາທີ່ມີ)
      let name = "ບໍ່ມີຊື່ລາຍການ";
      
      if (item.Menus) {
        // ຖ້າມີທັງສອງພາສາ ໃຫ້ສະແດງ "ຊື່ລາວ (ຊື່ມີອັງກິດ)" ຖ້າມີແຕ່ອັງກິດໃຫ້ສະແດງອັງກິດ
        name = item.Menus.laoName && item.Menus.menu_name
          ? `${item.Menus.laoName} (${item.Menus.menu_name})`
          : (item.Menus.laoName || item.Menus.menu_name);
      } else if (item.Drink) {
        name = item.Drink.laoName && item.Drink.drink_name
          ? `${item.Drink.laoName} (${item.Drink.drink_name})`
          : (item.Drink.laoName || item.Drink.drink_name);
      }

      const price = item.Menus?.price || item.Drink?.price || 0;

      return (
        <div key={idx} className="flex justify-between items-start text-sm border-b border-gray-50 pb-2">
          <div className="flex gap-2">
            <span className="font-bold text-orange-500">{item.quantity}x</span>
            <span className="text-slate-700 font-medium">{name}</span>
          </div>
          <span className="font-bold">{(price * item.quantity).toLocaleString()}</span>
        </div>
      );
    })
  ) : (
    <p className="text-center text-gray-400 py-10 italic">ບໍ່ມີລາຍการອາຫານ</p>
  )}
</div>

                <div className="border-t border-dashed pt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">ຍອດລວມທັງໝົດ</span>
                    <span className="text-2xl font-black text-orange-500">
                      {tableOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                        paymentMethod === 'cash' 
                        ? 'border-orange-500 bg-orange-50 text-orange-600' 
                        : 'border-gray-100 bg-gray-50 text-gray-400'
                      }`}
                    >
                      <Banknote size={20} /> 
                      <span className="text-[10px] font-bold">ເງິນສົດ</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setPaymentMethod('transfer')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                        paymentMethod === 'transfer' 
                        ? 'border-blue-500 bg-blue-50 text-blue-600' 
                        : 'border-gray-100 bg-gray-50 text-gray-400'
                      }`}
                    >
                      <QrCode size={20} /> 
                      <span className="text-[10px] font-bold">ໂອນເງິນ (OnePay)</span>
                    </button>
                  </div>
                  <button 
                    onClick={() => handleCheckout(selectedTable.table_id)}
                    className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold hover:bg-orange-600 shadow-lg"
                  >
                    ຢືນຢັນການຊຳລະເງິນ
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4"> {selectedTable.table_number}</h2>
                {selectedTable.status === 'ບໍ່ຫວ້າງ' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex flex-col items-center">
                      <p className="text-xs font-bold text-orange-600 mb-2">QR ສັ່ງອາຫານ</p>
                      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center">
                        <QRCodeSVG 
                          value={`https://bobo-jade.vercel.app?table=${selectedTable.table_number}&id=${selectedTable.table_id}&token=${selectedTable.qr_code_token}`} 
                          size={180} 
                        />
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={handlePrintClick} 
                      className="w-full bg-green-600 text-white py-3 font-bold hover:bg-green-700 transition-all flex rounded-2xl items-center justify-center gap-2"
                    >
                      <QrCode size={18} /> ປຣີ້ນ QR Code
                    </button>
                    <button 
                      onClick={() => setIsBillingMode(true)}
                      className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-all"
                    >
                      ໄປໜ້າຊຳລະເງິນ ( {selectedTable.table_number} )
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                      <UserPlus size={30} />
                    </div>
                    <p className="text-gray-500 text-sm mb-6">...ໂຕະນີ້ຫວ່າງຢູ່...</p>
                    <button onClick={() => handleOpenTable(selectedTable.table_id)} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700">
                      \ ເປີດໂຕະ / Gen QR
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 opacity-50">
            <div className="p-4 bg-gray-50 rounded-full mb-2">
              <CreditCard size={40} />
            </div>
            <p className="text-sm italic">ເລືອກໂຕະເພື່ອຈັດການ</p>
          </div>
        )}
      </aside>

     {/* 🎯 ແກ້ໄຂຈຸດທີ 5: ປ່ຽນຈາກ className="hidden" ມາໃຊ້ style ຊ່ອງໜ້າຈໍແທນ */}
      {selectedTable && (
        <div style={{ display: 'none' }} className="print:block">
          <div ref={componentRef}>
            <PrintableReceipt 
              tableNumber={selectedTable.table_number} 
              qrValue={`https://bobo-jade.vercel.app?table=${selectedTable.table_number}&id=${selectedTable.table_id}&token=${selectedTable.qr_code_token}`} 
            />
          </div>
        </div>
      )}
    </div>
  ); 
}