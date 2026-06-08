"use client";

export default function PrintableReceipt({ tableNumber, qrValue, items = [], totalAmount = 0 }) {
  const isBill = items.length > 0; // ກວດສອບວ່ານີ້ແມ່ນໃບບິນ ຫຼື QR Code

  return (
    <div 
      id="receipt-print-area" 
      className="hidden print:block bg-white text-black p-4 font-lao mx-auto" 
      style={{ width: '58mm', fontSize: '12px' }}
    >
      {/* ຫົວໃບບິນ */}
      <div className="text-center border-b border-dashed border-black pb-3 mb-3">
        <h2 className="text-base font-black">ຮ້ານ Puckluck</h2>
        <div className="text-lg font-black mt-2 bg-black text-white py-1 rounded">
           {tableNumber}
        </div>
      </div>

      {isBill ? (
        /* ຖ້າເປັນໃບບິນຊຳລະເງິນ */
        <div className="space-y-2">
          {items.map((item, idx) => {
  // 🎯 ກຳນົດຊື່ໃຫ້ສະແດງທັງລາວ ແລະ ອັງກິດ
  const laoName = item.laoName || "";
  const englishName = item.menu_name || item.drink_name || "";
  const displayName = laoName && englishName 
    ? `${laoName} (${englishName})` 
    : (laoName || englishName || "ລາຍການບໍ່ລະບຸຊື່");

  return (
    <div key={idx} className="flex justify-between text-[11px] mb-1">
      <span>{item.quantity}x {displayName}</span>
      <span>{Number(item.subtotal || 0).toLocaleString()}</span>
    </div>
  );
})}
          <div className="border-t border-dashed border-black pt-2 mt-2 flex justify-between font-bold">
            <span>ລວມທັງໝົດ</span>
            <span>{totalAmount.toLocaleString()} ₭</span>
          </div>
        </div>
      ) : (
        /* ຖ້າເປັນ QR Code (ກໍລະນີເປີດໂຕະ) */
        <div className="flex flex-col items-center">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrValue)}`}
            className="w-32 h-32 border p-1"
          />
          <p className="text-[10px] text-center mt-2">ສະແກນເພື່ອສັ່ງອາຫານ</p>
        </div>
      )}

      {/* ທ້າຍໃບບິນ */}
      <div className="text-center text-[9px] mt-6 pt-2 border-t border-gray-300">
        <p>ຂໍຂອບໃຈທີ່ໃຊ້ບໍລິການ</p>
      </div>
    </div>
  );
}