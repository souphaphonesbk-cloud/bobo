"use client";
import Link from 'next/link';
import { useState, useEffect, Suspense } from "react";
import { supabase } from '../../lib/supabase';

export function MyOrderPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOrdered, setIsOrdered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tableInfo, setTableInfo] = useState({ number: "??", id: null });
  const [orderNote, setOrderNote] = useState("");

  useEffect(() => {
    setMounted(true);
    const storedTable = localStorage.getItem("puckluck_table_number");
    const storedId = localStorage.getItem("puckluck_table_id");

    if (storedTable && storedId) {
      setTableInfo({ number: storedTable, id: storedId });
    } else {
      alert("ກະລຸນາສະແກນ QR Code ທີ່ໂຕະຂອງທ່ານ");
    }
  }, []);

useEffect(() => {
    async function fetchCartData() {
      const savedCart = JSON.parse(localStorage.getItem("puckluck_cart") || "{}");
      const customIds = Object.keys(savedCart); // ຈະໄດ້ເປັນ ['menu_63', 'menu_18', ...]

      if (customIds.length === 0) {
        setLoading(false);
        return;
      }

      // ✨ ປັບປຸງ: ຕັດເອົາແຕ່ຕົວເລກ ID ລ້າໆອອກມາ ໂດຍບໍ່ສົນວ່າມັນຈະຂຶ້ນຕົ້ນດ້ວຍ menu_ ຫຼື drink_
      const cleanIds = customIds.map(id => id.replace('menu_', '').replace('drink_', ''));

      try {
        let combinedData = [];

        // 1. ດຶງຂໍ້ມູນຈາກຕາຕະລາງ Menus (ອາຫານ)
        const { data: menuData, error: menuError } = await supabase
          .from("Menus")
          .select("*")
          .in("menu_id", cleanIds);

        if (menuError) throw menuError;
        if (menuData) {
          menuData.forEach(item => {
            // ຊອກຫາ Key ຕົວຈິງໃນ LocalStorage ທີ່ກົງກັບອາຫານນີ້ (ເຊັ່ນ 'menu_1')
            const matchedKey = customIds.find(id => id === `menu_${item.menu_id}` || id === String(item.menu_id));
            if (matchedKey) {
              combinedData.push({
                id: item.menu_id,
                custom_id: matchedKey,
                name: item.menu_name,
                laoName: item.laoName || "",
                price: Number(item.price),
                image: item.image, 
                qty: savedCart[matchedKey] || 0,
                is_drink: false
              });
            }
          });
        }

        // 2. ດຶງຂໍ້ມູນຈາກຕາຕະລາງ Drink (ເຄື່ອງດື່ມ) 🎯 [ດຶງມາໄວ້ຄືກັນ ປ້ອງກັນໜ້າເມນູສົ່ງ prefix ມາຜິດ]
        const { data: drinkData, error: drinkError } = await supabase
          .from("Drink")
          .select("*")
          .in("drink_id", cleanIds);

        if (drinkError) throw drinkError;
        if (drinkData) {
          drinkData.forEach(item => {
            // 🔥 ຈຸດສຳຄັນ: ຊອກຫາ Key ທີ່ມີໃນ LocalStorage ບໍ່ວ່າຈະເປັນ 'menu_63' ຫຼື 'drink_63' ກໍໃຫ້ດຶງມາສະແດງ
            const matchedKey = customIds.find(id => 
              id === `drink_${item.drink_id}` || 
              id === `menu_${item.drink_id}` || 
              id === String(item.drink_id)
            );
            
            if (matchedKey) {
              combinedData.push({
                id: item.drink_id,
                custom_id: matchedKey,
                name: item.drink_name,       // ຕົງກັບ drink_name ໃນ DB
                laoName: item.laoName || "", // ຕົງກັບ laoName ໃນ DB
                price: Number(item.price),   // ຕົງກັບ price ໃນ DB
                image: item.image,           // ຕົງກັບ image ໃນ DB
                qty: savedCart[matchedKey] || 0,
                is_drink: true
              });
            }
          });
        }
        
        // ເກັບລາຍການທີ່ມີຈຳນວນຫຼາຍກວ່າ 0
        setCartItems(combinedData.filter(item => item.qty > 0));
      } catch (error) {
        console.error("Error loading cart:", error.message);
        alert("ເກີດຂໍ້ຜິດພາດໃນການໂຫລດຕະກ້າ: " + error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCartData();
  }, []);

  const updateQty = (custom_id, delta) => {
    const newItems = cartItems.map(item => {
      if (item.custom_id === custom_id) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0);

    setCartItems(newItems);
    const updatedCart = {};
    newItems.forEach(item => {
      updatedCart[item.custom_id] = item.qty;
    });
    localStorage.setItem("puckluck_cart", JSON.stringify(updatedCart));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleConfirmOrder = async () => {
    // 1. ຄິດໄລ່ຍອດລວມກ່ອນ (ຕ້ອງມີການປະກາດຕົວປ່ຽນນີ້)
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // 2. ສ້າງຂໍ້ມູນລາຍການອາຫານ
    const orderItemsJson = cartItems.map(item => ({
      menu_id: item.is_drink ? null : (Number(item.id) || null),
      drink_id: item.is_drink ? (Number(item.id) || null) : null,
      menu_name: item.name || "Unknown",
      laoName: item.laoName || "",
      quantity: Number(item.qty) || 1,
      price: Number(item.price) || 0,
      subtotal: Number(item.price * item.qty) || 0
    }));

    try {
      // ກວດສອບກ່ອນສົ່ງ
      if (orderItemsJson.length === 0) {
        alert("ບໍ່ມີລາຍການອາຫານໃນຕະກ້າ");
        return;
      }

      const { data, error: orderError } = await supabase
        .from('Orders')
        .insert([
          { 
            table_id: tableInfo.id, 
            total_amount: totalAmount, // ໃຊ້ totalAmount ທີ່ຄິດໄລ່ຂ້າງເທິງ
            payment_status: 'unpaid',
            order_status: 'pending',
            items: orderItemsJson, // ຂໍ້ມູນ JSON
            order_note: orderNote
          }
        ]);

      if (orderError) {
        console.error("Supabase Error:", orderError); // ເບິ່ງ Error ທີ່ນີ້ຖ້າມັນບໍ່ຂຶ້ນ
        throw orderError;
      }
      
      setIsOrdered(true); // ປ່ຽນສະຖານະປຸ່ມ
      alert("ສັ່ງອາຫານສຳເລັດແລ້ວ!");
      localStorage.removeItem('puckluck_cart');
      
    } catch (error) {
      console.error("Error:", error.message);
      alert("ເກີດຂໍ້ຜິດພາດ: " + error.message);
    }
  };
  
  return (
    <div className="bg-gray-50 min-h-screen pb-10 w-full flex flex-col ">
      <div className=" bg-white min-h-screen flex flex-col shadow-lg relative">
        
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
            <h2 className="text-2xl font-black text-gray-800">ໂຕະທີ #{tableInfo.number}</h2>
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
          {cartItems.length === 0 ? (
            <div className="text-center py-20 text-gray-400">ບໍ່ມີລາຍການໃນຕະກ້າ</div>
          ) : (
            cartItems.map((item) => (
              <div key={item.custom_id} className="flex items-center gap-4 bg-white p-3 rounded-3xl shadow-sm border border-gray-50">
                <img 
                  src={item.image || "/icon/no-image.png"} 
                  className="w-20 h-20 rounded-2xl object-cover bg-gray-100" 
                  alt={item.name} 
                />
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <h3 className="font-bold text-gray-800 text-base leading-tight">
                        {item.name}
                        <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                          item.is_drink ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                        }`}>
                          {item.is_drink ? "Drink" : "Food"}
                        </span>
                      </h3>
                      <span className="text-gray-500 text-sm font-medium">{item.laoName}</span>
                    </div>
                    <span className="text-gray-400 text-[10px] font-medium">
                      {(item.price * item.qty).toLocaleString()} ລວມ
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex justify-between text-gray-500">
                      <span className="font-bold text-yellow-500">{item.price.toLocaleString()} kip</span>
                    </div>
                    
                    {/* ປຸ່ມເພີ່ມ-ລົບຈຳນວນ */}
                    <div className="flex items-center gap-3 bg-gray-50 px-2 py-1 rounded-xl shadow-inner">
                      <button 
                        onClick={() => updateQty(item.custom_id, -1)}
                        className="text-yellow-400 font-bold w-5 hover:scale-110 active:opacity-50 transition-all">-</button>
                      
                      <span className="font-bold text-sm text-black w-3 text-center">{item.qty}</span>
                      
                      <button 
                        onClick={() => updateQty(item.custom_id, 1)}
                        className="text-yellow-400 font-bold w-5 hover:scale-110 active:opacity-50 transition-all">+</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Box */}
        <div className="p-6 bg-white mt-10 rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="mb-4">
    <label className="text-sm font-bold text-gray-700 mb-1 block">ຄຳສັ່ງພິເສດ (ເລືອກໃສ່):</label>
    <textarea
      value={orderNote}
      onChange={(e) => setOrderNote(e.target.value)}
      placeholder=" ບໍ່ໃສ່ຜັກ, ເຜັດໜ້ອຍ..."
      className="w-full p-3 border border-gray-200 rounded-2xl text-sm text-gray-500 focus:border-yellow-400 outline-none"
      rows="2"
    />
  </div>

          <div className="space-y-3 mb-6 ">
            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
              <span className="font-bold text-lg text-gray-800">ຍອດລວມທັງໝົດ</span>
              <span className="font-bold text-xl text-yellow-500">{subtotal.toLocaleString()} kip</span>
            </div>
          </div>

          <button 
            onClick={handleConfirmOrder}
            disabled={isOrdered || cartItems.length === 0}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all 
              ${isOrdered 
                ? "bg-green-500 text-white cursor-default" 
                : cartItems.length === 0 
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                  : "bg-yellow-400 text-white active:scale-95 hover:bg-yellow-500"
              }`}
          >
            {isOrdered ? "ສົ່ງອໍເດີສຳເລັດແລ້ວ" : "ຢືນຢັນການສັ່ງຊື້"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderPageWithSuspense() {
  return (
    <Suspense fallback={<div className="p-10 text-center">ກຳລັງໂຫລດ...</div>}>
      <MyOrderPage />
    </Suspense>
  );
}