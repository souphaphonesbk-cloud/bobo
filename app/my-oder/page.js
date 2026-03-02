"use client";
import Link from 'next/link';
import {useState,useEffect} from "react";
import {supabase} from '../../lib/supabase'
import { useSearchParams } from 'next/navigation';

export default function MyOrderPage() {
  const [cartItems, setCartItems] =useState([]);
  const [loading, setLoading] = useState(true);
  const [isOrdered, setIsOrdered] = useState(false);
  const [mounted, setMounted] =useState(false);
  const searchParams = useSearchParams();
  const tableNumber = searchParams.get('table') || "??"; 
  const tableId = searchParams.get('id');

     useEffect(() => {
     setMounted(true);
      }, []);

  useEffect(() => {
    async function fetchCartData() {
      // 1. ດຶງຂໍ້ມູນ ID ທີ່ Save ໄວ້ໃນ localStorage
      const savedCart = JSON.parse(localStorage.getItem("puckluck_cart") || "{}");
      const menuIds = Object.keys(savedCart);

      if (menuIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        
    // 2. ດຶງຂໍ້ມູນລາຍລະອຽດອາຫານຈາກ Supabase ໂດຍໃຊ້ ID ທີ່ມີໃນ Cart
        const { data, error } = await supabase
          .from("Menus")
          .select("*")
          .in("menu_id", menuIds); // ດຶງສະເພາະ ID ທີ່ເຮົາເລືອກ

        if (error) throw error;

        if (data) {

  // ฟังก์ชันเพิ่ม/ลดจำนวน (เพื่อให้ Subtotal เปลี่ยนตาม)
  const updateQty = (id, delta) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    ));
  };

  // 3. ເອົາຂໍ້ມູນຈາກ DB ມາລວມກັບ "ຈຳນວນ (qty)" ທີ່ຢູ່ໃນ localStorage
          const formattedData = data.map(item => ({
            id: item.menu_id,
            name: item.menu_name,
            laoName: item.laoName,
            price: item.price,
            img: item.image,
            qty: savedCart[item.menu_id] || 0
          }));
          
          setCartItems(formattedData.filter(item => item.qty > 0));
        }
      } catch (error) {
        console.error("Error loading cart:", error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCartData();
  }, []);

  // ຟັງຊັນປັບຈຳນວນໃນໜ້ານີ້ ແລະ Update localStorage ໄປພ້ອມ
  const updateQty = (id, delta) => {
    const newItems = cartItems.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0);

    setCartItems(newItems);

    // Update localStorage ໃຫ້ກົງກັນ
    const updatedCart = {};
    newItems.forEach(item => {
      updatedCart[item.id] = item.qty;
    });
    localStorage.setItem("puckluck_cart", JSON.stringify(updatedCart));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
const handleConfirmOrder = async () => {
  if (!tableId) {
    alert("ກະລຸນາສະແກນ QR Code ໃໝ່ ເພື່ອລະບຸໝາຍເລກໂຕະ");
    return;
  }
    try {
      // 1. ບັນທຶກລົງຕາຕະລາງ Orders ຫຼັກ
      const { data: order, error: orderError } = await supabase
        .from('Orders')
        .insert([
          { 
            table_id: tableId, // ອ້າງອີງ ID ຈາກຕາຕະລາງ Tables
            total_amount: subtotal,
            order_status: 'pending',
            payment_status: 'unpaid'
          }
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. ກຽມຂໍ້ມູນສຳລັບ Order_Details ໂດຍໃຊ້ order_id ທີ່ໄດ້ມາໃໝ່
      const orderDetails = cartItems.map(item => ({
        order_id: order.order_id, 
        menu_id: item.id,
        quantity: item.qty,
        subtotal: item.price * item.qty 
      }));

      // 3. ບັນທຶກລົງຕາຕະລາງ Order_Details
      const { error: detailError } = await supabase
        .from('Order_Details')
        .insert(orderDetails);

      if (detailError) throw detailError;

      // 4. ຖ້າສຳເລັດທັງໝົດ
      setIsOrdered(true);
      localStorage.removeItem("puckluck_cart");
      alert("ສົ່ງອໍເດີສຳເລັດ!");

    } catch (error) {
      console.error("Error confirming order:", error.message);
      alert("ເກີດຂໍ້ຜິດພາດ: " + error.message);
    }
  };


  return (
    <div className="bg-gray-50 min-h-screen pb-10 w-full flex flex-col ">
      <div className=" bg-white min-h-screen flex  flex-col shadow-lg relative">
        
        {/* Header */}
        <div className="flex items-center p-6 mt-4">
          <Link href="/">
            <button className="p-2 bg-gray-100 rounded-xl">
              <img src="/icon/left.svg" className="w-4 h-4" alt="back" />
            </button>
          </Link>
          <h1 className="flex-1 text-center font-bold text-xl text-gray-800">ລາຍການຂອງຂ້ອຍ</h1>
        </div>

            {/* Table & Info Section */}
            <div className="px-6 mb-4 flex justify-between items-end">
            <div>
             <p className="text-gray-400 text-xs uppercase tracking-wider ">ໝາຍເລກໂຕະ</p>
               <h2 className="text-2xl font-black text-gray-800">ໂຕະທີ #{tableNumber}</h2>
                </div>
             <div className="text-right">
  {mounted && (
    <>
      <p className="text-gray-400 text-[10px]">
        {new Date().toLocaleDateString('lo-LA')}
      </p>
      <p className="text-gray-800 font-medium text-xs">
        ເວລາ: {new Date().toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </>
  )}
</div>
         </div>
        {/* Item List */}
       <div className="flex-1 px-6 space-y-4 overflow-y-auto">
  {cartItems.map((item) => (
    <div key={item.id} className="flex items-center gap-4 bg-white p-3 rounded-3xl shadow-sm border border-gray-50">
      {/* รูปภาพอาหาร */}
      <img src={item.img} className="w-20 h-20 rounded-2xl object-cover" alt={item.name} />
      
      <div className="flex-1">
        {/* บรรทัดบน: ชื่ออาหาร (ซ้าย) และ ราคารวมตัวเล็ก ขวา  */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
          <h3 className="font-bold text-gray-800 text-base leading-tight">{item.name}</h3>
           <span className="text-gray-500 text-sm font-medium">{item.laoName}</span>
           </div>
          <span className="text-gray-400 text-[10px] font-medium">
            {(item.price * item.qty).toLocaleString()} ລວມ
          </span>
        </div>

        {/* บรรทัดล่าง: ราคาต่อหน่วย (ซ้าย) และ ปุ่มเพิ่มลด (ขวา) */}
        <div className="flex items-center justify-between mt-3">
          {/* ราคาหลักสีส้ม (เหมือนรูปที่ 1) */}
         <div className="flex justify-between text-gray-500">
              <span className="font-bold text-yellow-500">{item.price.toLocaleString()} kip</span>
            </div>
          
          {/* ปุ่มเพิ่มลดจำนวนจำนวน (ดีไซน์ตามรูป) */}
          <div className="flex items-center gap-3 bg-gray-50 px-2 py-1 rounded-xl shadow-inner">
            <button 
              onClick={() => updateQty(item.id, -1)}
              className="text-yellow-400 font-bold w-5 hover:scale-110 active:opacity-50 transition-all">-</button>
            
            <span className="font-bold text-sm text-black w-3 text-center">{item.qty}</span>
            
            <button 
              onClick={() => updateQty(item.id, 1)}
              className="text-yellow-500 font-bold w-5 hover:scale-110 active:opacity-50 transition-all">+</button>
          </div>
        </div>
      </div>
    </div>
  ))}
</div>

        {/* Summary Box */}
        <div className=" flex-1 p-6 bg-white  mt-10 rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="space-y-3 mb-6 ">
            

            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
              <span className="font-bold text-lg text-gray-800">ຍອດລວມທັງໝົດ</span>
              <span className="font-bold text-xl text-yellow-500">{subtotal.toLocaleString()} kip</span>
            </div>
          </div>

          <button 
  onClick={handleConfirmOrder}
  disabled={isOrdered} // ถ้าสั่งแล้วจะกดซ้ำไม่ได้
  className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all 
    ${isOrdered 
      ? "bg-green-500 text-white cursor-default" // สีเขียวเมื่อสำเร็จ
      : "bg-yellow-400 text-white active:scale-95 hover:bg-yellow-500" // สีเหลืองตอนปกติ
    }`}
>
  {isOrdered ? (
    <div className="flex items-center justify-center gap-2">
      ສຳເລັດ
    </div>
  ) : (
    "ຢືນຢັນການສັ່ງຊື້"
  )}
</button>
        </div>
      </div>
    </div>
  );
}