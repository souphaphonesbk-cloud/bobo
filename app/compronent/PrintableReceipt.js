"use client";

export default function PrintableReceipt({ tableNumber, qrValue, items = [], totalAmount = 0, orderId, createdAt }) {
  console.log("OrderID:", orderId);
  console.log("CreatedAt:", createdAt);
  const isBill = items.length > 0;

  return (
    <div 
      id="receipt-print-area" 
      className="hidden print:block bg-white text-black p-4 font-lao mx-auto" 
      style={{ width: '58mm', fontSize: '12px' ,fontFamily: "'Phetsarath OT', sans-serif"}}
      
    >
      {/* ຫົວໃບບິນ */}
      <div className="text-center border-b border-dashed border-black pb-3 mb-3">
        <h2 className="text-base font-black">ຮ້ານ Puckluck</h2>
        
       {/* ຂໍ້ມູນອໍເດີ ແລະ ເວລາ */}
{isBill && (
  <div className="text-[10px] text-left mt-2 space-y-0.5">
 <div>ເລກທີບິນ: {orderId ? orderId : "---"}</div>
    <div>
      ວັນທີ: {createdAt && !isNaN(new Date(createdAt).getTime()) 
        ? new Date(createdAt).toLocaleDateString('lo-LA') 
        : new Date().toLocaleDateString('lo-LA')}
    </div>
    <div>
      ເວລາ: {createdAt && !isNaN(new Date(createdAt).getTime()) 
        ? new Date(createdAt).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' }) 
        : new Date().toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })}
    </div>  
  </div>
)}
<div>
       {tableNumber}
    </div>
      </div>

      {isBill ? (
        /* ຖ້າເປັນໃບບິນຊຳລະເງິນ */
        <div className="space-y-2">
          {items.map((item, idx) => {
  // 1. ອີງຕາມ Database: menu_name ແມ່ນຊື່ພາສາອັງກິດ, laoName ແມ່ນຊື່ພາສາລາວ
  const laoName = item.laoName;
  const englishName = item.menu_name; // ໃຊ້ menu_name ເປັນຊື່ພາສາອັງກິດ

  // 2. Logic ການສະແດງຜົນ
  // ຖ້າມີທັງສອງຊື່ ແລະ ບໍ່ແມ່ນຊື່ດຽວກັນ ໃຫ້ສະແດງຄູ່ກັນ
  let displayName = laoName;
  if (laoName && englishName && laoName !== englishName) {
    displayName = `${laoName} (${englishName})`;
  } else if (!laoName && englishName) {
    displayName = englishName; // ຖ້າບໍ່ມີຊື່ລາວ ໃຫ້ເອົາຊື່ອັງກິດ
  }
  
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