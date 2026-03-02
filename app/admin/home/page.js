"use client";
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase'; // ໃຫ້ເຊັກ Path ໃຫ້ຖືກຕາມທີ່ເຈົ້າຕັ້ງໄວ້
import { QRCodeSVG } from 'qrcode.react';
import { Search, Bell, QrCode, CreditCard, UserPlus, Timer, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);


   // 1. ຟັງຊັນດຶງຂໍ້ມູນໂຕະທັງໝົດ
  const fetchTables = async () => {
    const { data, error } = await supabase
      .from('Tables')
      .select('*')
      .order('table_number', { ascending: true });
    
    if (!error) setTables(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTables();

    // 2. ເປີດ Realtime ເພື່ອໃຫ້ມັນອັບເດດເອງເວລາຂໍ້ມູນໃນ DB ປ່ຽນ
    const channel = supabase
      .channel('table_db_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Tables' }, () => {
        fetchTables();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // 3. ຟັງຊັນ "ເປີດໂຕະ" (Generate Token ໃໝ່)
  const handleOpenTable = async (id) => {
    const newToken = crypto.randomUUID(); 
    const { error } = await supabase
      .from('Tables')
      .update({ 
        status: 'occupied', 
        qr_code_token: newToken,
        // ຖ້າເຈົ້າເພີ່ມ last_session_at ແລ້ວໃຫ້ໃສ່ບ່ອນນີ້:
        // last_session_at: new Date().toISOString() 
      })
      .eq('table_id', id);
    
    if (error) alert("ເກີດຂໍ້ຜິດພາດໃນການເປີດໂຕະ");
  };

  if (loading) return <div className="p-10 text-center font-lao">ກຳລັງໂຫລດຂໍ້ມູນ...</div>;

  return (
    <div className="flex min-h-screen bg-gray-50 font-lao text-slate-800">
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-black">Puckluck POS</h1>
            {/* ... ສ່ວນ Header ອື່ນໆຄືເກົ່າ ... */}
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {tables.map(table => (
            <div 
              key={table.table_id} 
              onClick={() => setSelectedTable(table)}
              className={`p-6 rounded-[32px] border-2 transition-all cursor-pointer ${
                selectedTable?.table_id === table.table_id ? 'border-orange-500 bg-white shadow-xl' : 
                table.status === 'occupied' ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-transparent'
              }`}
            >
              <div className="flex justify-between mb-2">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${table.status === 'occupied' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                  {table.status || 'AVAILABLE'}
                </span>
              </div>
              <h3 className="text-2xl font-black">{table.table_number}</h3>
            </div>
          ))}
        </div>
      </main>

      {/* Sidebar ສະແດງ QR ແລະ ປຸ່ມຈັດການ */}
      {/* Sidebar: ປັບໃຫ້ສະແດງຜົນໄດ້ງ່າຍຂຶ້ນ */}
<aside className="w-80 bg-white border-l p-6 flex flex-col shadow-lg">
  {selectedTable ? (
    <div className="animate-in fade-in slide-in-from-right duration-300">
      <h2 className="text-xl font-bold mb-4">ຈັດການໂຕະ {selectedTable.table_number}</h2>
      
      {selectedTable.status === 'occupied' ? (
        <div className="space-y-4">
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex flex-col items-center">
            <p className="text-xs font-bold text-orange-600 mb-2">QR ສັ່ງອາຫານ</p>
            {/* ສະແດງ QR Code */}
            <div className="bg-white p-2 rounded-xl shadow-sm">
         <QRCodeSVG 
         value={`https://bobo-jade.vercel.app?table=${selectedTable.table_number}&id=${selectedTable.table_id}&token=${selectedTable.qr_code_token}`} 
         size={180} 
         />
         <label>
          {`http://localhost:3000?table=${selectedTable.table_number}&id=${selectedTable.table_id}&token=${selectedTable.qr_code_token}`}
         </label>
            </div>
          </div>
          <button className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-all">
            ໄປໜ້າຊຳລະເງິນ
          </button>
        </div>
      ) : (
        <div className="text-center py-10">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
            <UserPlus size={30} />
          </div>
          <p className="text-gray-500 text-sm mb-6">ໂຕະນີ້ຫວ່າງຢູ່</p>
          <button 
            onClick={() => handleOpenTable(selectedTable.table_id)}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-md"
          >
            ເປີດໂຕະ / Gen QR
          </button>
        </div>
      )}
    </div>
  ) : (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 opacity-50">
      <div className="p-4 bg-gray-50 rounded-full mb-2">
        <CreditCard size={40} />
      </div>
      <p className="text-sm italic italic">ເລືອກໂຕະເພື່ອຈັດການ</p>
    </div>
  )}
</aside>
    </div>
  );
}