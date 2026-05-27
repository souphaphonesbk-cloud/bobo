"use client";

export default function PrintableReceipt({ tableNumber, qrValue }) {
  return (
    /* 🔥 ໃຊ້ id "receipt-print-area" ແລະ class "print:block" ເພື່ອໃຫ້ສະແດງສະເພາະຕອນປຣີ້ນ */
    <div 
      id="receipt-print-area" 
      className="hidden print:block bg-white text-black p-4 font-lao mx-auto" 
      style={{ width: '58mm', minHeight: '100mm', fontSize: '12px' }}
    >
      {/* ຫົວໃບບິນ */}
      <div className="text-center border-b border-dashed border-black pb-3 mb-3">
        <h2 className="text-base font-black tracking-wide">ຮ້ານ Puckluck</h2> {/* */}
        <p className="text-[10px] text-gray-700">ຄິວທຳນຽມສັ່ງອາຫານ</p>
        <div className="text-lg font-black mt-2 bg-black text-white py-1 rounded">
          {tableNumber ? `ໂຕະ: ${tableNumber}` : "ບໍ່ມີເລກໂຕະ"}
        </div>
      </div>

      {/* 🎯 ສ່ວນສະແດງ QR Code ໃຫຍ່ໆຈະແຈ້ງ */}
      <div className="flex flex-col items-center justify-center my-4 pb-3 border-b border-dashed border-black">
        {qrValue ? (
          <>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrValue)}`}
              alt="Table QR Code"
              className="w-36 h-36 border p-1"
            />
            <p className="text-[11px] font-bold text-center mt-2">
              ລູກຄ້າສະແກນ QR ນີ້ <br/> ເພື່ອເບິ່ງເມນູ ແລະ ສັ່ງອາຫານ
            </p>
          </>
        ) : (
          <p className="text-xs text-red-500 font-bold">⚠️ ບໍ່ມີຂໍ້ມູນ QR Code</p>
        )}
      </div>

      {/* ທ້າຍໃບບິນ */}
      <div className="text-center text-[9px] text-gray-600 mt-6 pt-2 border-t border-gray-300">
        <p>ຍິນດີຕ້ອນຮັບ / ຂໍຂອບໃຈ</p>
        <p className="mt-1 opacity-50">Powered by Puckluck POS</p> {/* */}
      </div>
    </div>
  );
}