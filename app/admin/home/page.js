"use client";
import { useState, useEffect,useRef} from 'react'; 
import{useReactToPrint} from 'react-to-print';
import { supabase } from '../../../lib/supabase';
import Link from 'next/link'; 
import { QRCodeSVG } from 'qrcode.react';
import { Search, Bell, QrCode, CreditCard, UserPlus, Timer, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const qrRef=useRef();
   
  const handlePrint= useReactToPrint({
    contentRef: qrRef,
    documentTitle: `QR_Table_${selectedTable?.table_number}`,
  })


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
    const newStatus = 'ບໍ່ຫວ້າງ';

  // --- ສ່ວນທີ່ເພີ່ມເຂົ້າມາ: ອັບເດດ State ຢູ່ໜ້າຈໍທັນທີ ---
  // 1. ອັບເດດລາຍຊື່ໂຕະທັງໝົດໃນ State
  setTables(prevTables => 
    prevTables.map(t => t.table_id === id ? { ...t, status: newStatus, qr_code_token: newToken } : t)
  );
  
  // 2. ອັບເດດໂຕະທີ່ກຳລັງເລືອກຢູ່ (Sidebar ຈຶ່ງຈະປ່ຽນທັນທີ)
  setSelectedTable(prev => ({ ...prev, status: newStatus, qr_code_token: newToken }));
    const { error } = await supabase

    
      .from('Tables')
      .update({ 
        status: 'ບໍ່ຫວ້າງ', 
        qr_code_token: newToken,
        // ຖ້າເຈົ້າເພີ່ມ last_session_at ແລ້ວໃຫ້ໃສ່ບ່ອນນີ້:
        // last_session_at: new Date().toISOString() 
      })
      .eq('table_id', id);
    
    if (error) alert("ເກີດຂໍ້ຜິດພາດໃນການເປີດໂຕະ");
  };

  if (loading) return <div className="p-10 text-center font-lao">ກຳລັງໂຫລດຂໍ້ມູນ...</div>;

  // ຟັງຊັນປິດໂຕະ
  const handleCheckout = async (id) => {
  const { error } = await supabase
    .from('Tables')
    .update({ 
      status: 'ໂຕະຫວ້າງ', // ປ່ຽນສະຖານະກັບມາຫວ່າງ
      qr_code_token: null   // ລ້າງ Token ເກົ່າຖິ້ມເພື່ອຄວາມປອດໄພ
    })
    .eq('table_id', id);
  
  if (error) {
    alert("ເກີດຂໍ້ຜິດພາດໃນການປິດໂຕະ");
  } else {
    setSelectedTable(null); // ເຊົາເລືອກໂຕະນັ້ນໃນ Sidebar
  }
};

  return (
    <div className="flex min-h-screen bg-gray-50 font-lao text-slate-800">
      <style>{`
  @media print {
    @page { 
      /* กำหนดให้ความสูงเป็น auto เพื่อให้เครื่องตัดกระดาษตามเนื้อหาจริง */
      size: 80mm auto; 
      margin: 0; 
    }
    body { 
      margin: 0; 
      background: white; 
    }
    /* บังคับให้ส่วนที่จะปริ้นมีความสูงแค่พอดีเนื้อหา */
    .print-container { 
      width: 80mm; 
      height: fit-content; 
      padding: 10px;
      margin: 0;
    }
  }
`}</style>
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
                table.status === 'ບໍ່ຫວ້າງ' ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-transparent'
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

      {/* Sidebar ສະແດງ QR ແລະ ປຸ່ມຈັດການ */}
      {/* Sidebar: ປັບໃຫ້ສະແດງຜົນໄດ້ງ່າຍຂຶ້ນ */}
<aside className="w-80 bg-white border-l p-6 flex flex-col shadow-lg">
  {selectedTable ? (
    <div className="animate-in fade-in slide-in-from-right duration-300">
      <h2 className="text-xl font-bold mb-4">ຈັດການໂຕະ {selectedTable.table_number}</h2>
      
      {selectedTable.status === 'ບໍ່ຫວ້າງ' ? (
        <div className="space-y-4">
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex flex-col items-center">
            <p className="text-xs font-bold text-orange-600 mb-2">QR ສັ່ງອາຫານ</p>
           <div ref={qrRef} className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center">
              <div className="hidden print:block text-center mb-2">
                <h2 className="text-lg font-bold">Puckluck Restaurant</h2>
                <p className="text-sm"> {selectedTable.table_number}</p>
              </div>
         <QRCodeSVG 
         value={`https://bobo-jade.vercel.app?table=${selectedTable.table_number}&id=${selectedTable.table_id}&token=${selectedTable.qr_code_token}`} 
         size={180} 
         />
         <p className="print:hidden text-[10px] mt-2 break-all text-gray-500 text-center max-w-[180px]">
         {`http://localhost:3000?table=${selectedTable.table_number}&id=${selectedTable.table_id}&token=${selectedTable.qr_code_token}`}
         </p>
            </div>
          </div>

          <button 
            onClick={handlePrint} // เรียกฟังก์ชันที่เราสร้างไว้ (จาก step ก่อนหน้า)
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <QrCode size={20} />
            ປຣີ້ນ QR Code
          </button>
          
          <Link href={`/admin/billing?table=${selectedTable.table_number}`} className="w-full">
  <button className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-all">
    ໄປໜ້າຊຳລະເງິນ ( {selectedTable.table_number} )
  </button>
</Link>
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