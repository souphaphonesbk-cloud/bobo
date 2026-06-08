"use client";
import { useState, useEffect,useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useReactToPrint } from 'react-to-print';
import PrintableReceipt from '../../compronent/PrintableReceipt';
import { ShoppingBag, Utensils, ShoppingCart, Plus, Minus, Trash2, Loader2, CheckCircle, Image as ImageIcon, Coffee } from 'lucide-react';

export default function CounterOrderPage() {
  const [allMeals, setAllMeals] = useState([]);    
  const [allDrinks, setAllDrinks] = useState([]);   
  const [filteredMenus, setFilteredMenus] = useState([]); 
  const [selectedCategory, setSelectedCategory] = useState('ອາຫານ'); 
  
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [orderType, setOrderType] = useState('takeaway'); 
  const [tableId, setTableId] = useState(''); 
  const [orderNote, setOrderNote] = useState("");
  const componentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Receipt_' + new Date().getTime(),
  });


// 1. ດຶງຂໍ້ມູນເມນູອາຫານ ແລະ ເຄື່ອງດື່ມ
useEffect(() => {
  const fetchData = async () => {
    try {
      const [mealsResponse, drinksResponse] = await Promise.all([
        supabase
          .from('Menus')
          .select(`
            *,
            Categories (
              category_name
            )
          `)
          .order('menu_name', { ascending: true }),
          
        supabase
  .from('Drink')
  .select(`
    *,
    Category_drink (
      category_drink_name
    )
  `) // 🎯 ເພີ່ມການ Join ຕາຕະລາງນີ້
  .order('drink_name', { ascending: true }),
  ]);

      if (mealsResponse.error) throw mealsResponse.error;
      if (drinksResponse.error) throw drinksResponse.error;

      // 🎯 ກັ່ນກອງອາຫານ: ເອົາສະເພາະອັນທີ່ບໍ່ແມ່ນ "ວັດຖຸດິບອາຫານ"
      const filteredMeals = (mealsResponse.data || []).filter(item => 
        item.Categories?.category_name !== 'ວັດຖຸດິບອາຫານ'
      );

      // 🎯 ກັ່ນກອງເຄື່ອງດື່ມ: ເອົາສະເພາະອັນທີ່ບໍ່ແມ່ນ "ວັດຖຸດິບເຄື່ອງດື່ມ"
      const formattedDrinks = (drinksResponse.data || [])
  .filter(drink => {
    // ກວດສອບຊື່ໝວດໝູ່ທີ່ Join ມາ
    const categoryName = drink.Category_drink?.category_drink_name;
    return categoryName !== 'ວັດຖຸດິບເຄື່ອງດື່ມ'; 
  })
  .map(drink => ({
    ...drink,
    menu_id: `drink_${drink.drink_id}`, 
    menu_name: drink.drink_name,
    laoName: drink.laoName || drink.drink_name, 
    is_drink: true 
  }));

setAllDrinks(formattedDrinks);

      if (selectedCategory === 'ເຄື່ອງດື່ມ') {
        setFilteredMenus(formattedDrinks);
      } else {
        setFilteredMenus(filteredMeals);
      }

    } catch (err) {
      console.error("Fetch data error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [selectedCategory]);   

  // 2. ຟັງຊັນສະຫຼັບໝວດໝູ່
const filterMenus = (category) => {
  setSelectedCategory(category);
  if (category === 'ເຄື່ອງດື່ມ') {
    setFilteredMenus(allDrinks);
  } else {
    setFilteredMenus(allMeals);
  }
};

  // 3. ເpreີ່ມເມນູເຂົ້າກະຕ່າ
  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.menu_id === item.menu_id);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.menu_id === item.menu_id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  // 4. ປັບຫຼຸດ/ເພີ່ມຈຳນວນໃນກະຕ່າ
  const updateQuantity = (menuId, amount) => {
    setCart(cart.map(item => {
      if (item.menu_id === menuId) {
        const newQty = item.quantity + amount;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  // 5. ลົບລາຍການອອກຈາກກະຕ່າ
  const removeFromCart = (menuId) => {
    setCart(cart.filter(item => item.menu_id !== menuId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // 6. ຟັງຊັນສົ່ງອໍເດີ (ສະບັບປັບປຸງ - ໃຊ້ JSONB ໃນ Orders)
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert("ກະລຸນາເລືອກລາຍການອາຫານກ່ອນ!");
      return;
    }
    if (orderType === 'eating_in' && !tableId) {
      alert("ກະລຸນາລະບຸເລກໂຕະ!");
      return;
    }

    let chosenPaymentMethod = null;
    if (orderType === 'takeaway') {
      const isCash = window.confirm("💰 ລູກຄ້າຊຳລະດ້ວຍ [ ເງິນສົດ ] ແມ່ນບໍ່?\n\n(ກົດ OK = ເງິນສົດ / ກົດ Cancel = ໂອນເງິນ OnePay)");
      chosenPaymentMethod = isCash ? 'cash' : 'transfer';
    }

    setSubmitting(true);
    try {
      const formattedTableNumber = `ໂຕະ ${tableId}`;
      let actualTableId = null;

      if (orderType === 'eating_in') {
        const { data: tableData, error: tableFetchError } = await supabase
          .from('Tables')
          .select('table_id')
          .eq('table_number', formattedTableNumber)
          .single();

        if (tableFetchError || !tableData) {
          throw new Error(`ບໍ່ພົບຂໍ້ມູນ "${formattedTableNumber}" ນີ້ໃນລະບົບ Database!`);
        }
        actualTableId = tableData.table_id;
      }

      // ສ້າງ JSON ຂໍ້ມູນລາຍການອາຫານ (Snapshot)
      const itemsJson = cart.map(item => ({
        menu_id: item.menu_id,
        menu_name: item.laoName || item.menu_name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
        is_drink: item.is_drink || false
      }));

      // ບັນທຶກອໍເດີ (insert ໃສ່ Orders ບ່ອນດຽວ)
      const { data: orderData, error: orderError } = await supabase
        .from('Orders')
        .insert([{
          total_amount: totalAmount,
          table_id: actualTableId,
          order_date: new Date().toISOString(),
          order_status: 'pending',
          payment_status: orderType === 'eating_in' ? 'unpaid' : 'paid',
          payment_method: chosenPaymentMethod,
          order_type: orderType === 'eating_in' ? 'dine_in' : 'take_away',
          items: itemsJson, 
          order_note: orderNote
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // ອັບເດດສະຖານະໂຕະ (ຖ້າກິນຢູ່ຮ້ານ)
      if (orderType === 'eating_in' && actualTableId) {
        await supabase
          .from('Tables')
          .update({ status: 'ບໍ່ຫວ້າງ' })
          .eq('table_id', actualTableId);
      };
      handlePrint();

      alert(orderType === 'takeaway' 
        ? `🛍️ ສັ່ງກັບບ້ານສຳເລັດ! ໝາຍເລກຄິວ: ${orderData.order_id}` 
        : 'ສັ່ງອາຫານສຳເລັດ');

      setCart([]);
      setTableId('');
    } catch (err) {
      console.error("Order error:", err.message);
      alert("ເກີດຂໍ້ຜິດພາດ: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-lao flex flex-col md:flex-row">
      
      {/* ດ້ານຊ້າຍ: ສະແດງເມນູອາຫານ */}
      <div className="flex-1 p-6 overflow-y-auto max-h-screen">
       <header className="mb-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Counter Ordering</h1>
              <p className="text-sm text-gray-700 font-medium">ລະບົບສັ່ງອາຫານໜ້າເຄົາເຕີ</p>
            </div>
            <span className="text-sm bg-white border border-gray-300 px-4 py-2 rounded-full text-gray-900 font-bold shadow-sm flex items-center gap-2">
               {selectedCategory === 'ເຄື່ອງດື່ມ' || selectedCategory === 'เครื่องดื่ม' ? <Coffee size={16} className="text-orange-500" /> : <Utensils size={16} className="text-orange-500" />}
               ໝວດໝູ່ <span className="font-black text-orange-600">{selectedCategory}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 bg-white p-2 rounded-full border border-gray-200 shadow-inner w-fit">
            <button
              onClick={() => filterMenus('ອາຫານ')}
              className={`px-8 py-2.5 rounded-full font-black text-sm transition-all flex items-center gap-2 ${
                selectedCategory === 'ອາຫານ' || selectedCategory === 'ອາຫານ' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Utensils size={16} /> ອາຫານ ({allMeals.length})
            </button>
            
            <button
              onClick={() => filterMenus('ເຄື່ອງດື່ມ')}
              className={`px-8 py-2.5 rounded-full font-black text-sm transition-all flex items-center gap-2 ${
                selectedCategory === 'ເຄື່ອງດື່ມ' || selectedCategory === 'ເຄື່ອງດື່ມ' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Coffee size={16} /> ເຄື່ອງດື່ມ ({allDrinks.length})
            </button>
          </div>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMenus.map((item) => (
            <div 
              key={item.menu_id} 
              onClick={() => addToCart(item)}
              className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group border-b-2"
            >
              <div className="aspect-square w-full bg-gray-50 rounded-xl mb-3 overflow-hidden flex items-center justify-center border border-gray-200">
                {item.image ? (
                  <img src={item.image} alt={item.laoName || item.menu_name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={36} className="text-gray-400" /> 
                )}
              </div>
              <div>
                <h3 className="font-black text-gray-950 line-clamp-2 text-sm md:text-base leading-snug">{item.laoName || item.menu_name}</h3> {/* 🎯 ເພີ່ມຄວາມເຂັ້ມ ແລະ ຂະໜາດ */}
                <p className="text-xs text-orange-700 font-black mt-1.5 bg-orange-50 px-2 py-0.5 rounded-md w-fit border border-orange-100">
                  {item.is_drink ? 'ເຄື່ອງດື່ມ' : (item.Categories?.category_name || 'ອາຫານ')}
                </p>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
                  <span className="text-orange-600 font-black text-base md:text-lg">{parseInt(item.price).toLocaleString()} ₭</span> {/* 🎯 ປັບລາຄາໃຫ້ໃຫຍ່ຂຶ້ນ */}
                  <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors border border-orange-100">
                    <Plus size={16} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ດ້ານຂວາ: ກະຕ່າ */}
      <div className="w-full md:w-[420px] bg-white border-l border-gray-200 flex flex-col h-screen shadow-xl">
        <div className="p-4 border-b flex items-center bg-gray-50 border-gray-200">
          <ShoppingCart className="text-orange-500" size={24} />
          <h2 className="font-black text-xl text-gray-900 ml-2">ລາຍການສັ່ງອາຫານ</h2>
        </div>

        <div className="p-4 space-y-3 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            <button 
              type="button"
              onClick={() => { setOrderType('takeaway'); setTableId(''); }}
              className={`p-3 rounded-xl font-black text-sm transition-all ${orderType === 'takeaway' ? 'bg-orange-500 text-white shadow-sm' : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'}`}
            >
              🛍️ ສັ່ງກັບບ້ານ
            </button>
            <button 
              type="button"
              onClick={() => setOrderType('eating_in')}
              className={`p-3 rounded-xl font-black text-sm transition-all ${orderType === 'eating_in' ? 'bg-orange-500 text-white shadow-sm' : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'}`}
            >
              🍽️ ກິນຢູ່ຮ້ານ
            </button>
          </div>

          {orderType === 'eating_in' && (
            <input 
              type="number"
              placeholder="ລະບຸໝາຍເລກໂຕະ"
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              className="w-full p-2.5 border border-gray-400 rounded-xl text-center font-black text-2xl text-gray-950 focus:border-orange-500 focus:outline-none placeholder:text-gray-400"
            />
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {cart.map((item) => (
            <div key={item.menu_id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex-1 min-w-0 pr-2">
                <h4 className="font-black text-sm text-gray-950 truncate">{item.laoName || item.menu_name}</h4> {/* 🎯 ປັບຊື່ໃນຕາຕະລາງໃຫ້ເຂັ້ມຫຼຸດການເບິ່ງຍາກ */}
                <p className="text-xs text-orange-600 font-black mt-0.5">{(item.price * item.quantity).toLocaleString()} ₭</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item.menu_id, -1)} className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded transition-colors"><Minus size={12} /></button>
                <span className="font-black text-sm text-gray-900 w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.menu_id, 1)} className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded transition-colors"><Plus size={12} /></button>
                <button onClick={() => removeFromCart(item.menu_id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors ml-1"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 bg-white space-y-4">
          <div className="flex justify-between items-center text-gray-900 text-xl font-bold">
            <span>ລາຄາລວມ:</span>
            <span className="text-orange-600 font-black text-2xl">{totalAmount.toLocaleString()} ₭</span>
          </div>
<div className="p-4 bg-gray-50 border-t border-gray-200">
  <textarea
    value={orderNote}
    onChange={(e) => setOrderNote(e.target.value)}
    placeholder="  ເຜັດໜ້ອຍ, ບໍ່ໃສ່ຜັກ"
    className="w-full p-3 border border-gray-300 rounded-xl  text-gray-500 text-sm focus:border-orange-500 focus:outline-none"
    rows="2"
  />
</div>
          <button
            disabled={submitting || cart.length === 0}
            onClick={handlePlaceOrder}
            className="w-full bg-gray-950 hover:bg-gray-900 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-colors disabled:bg-gray-300 disabled:text-gray-500 shadow-md"
          >
            {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
            {submitting ? "ກຳລັງສົ່ງອໍເດີ..." : "ຢືນຢັນການສັ່ງອາຫານ"}
          </button>
        </div>

      </div>
      <div style={{ display: 'none' }}>
  <div ref={componentRef}>
    <PrintableReceipt 
      tableNumber={orderType === 'eating_in' ? `ໂຕະ ${tableId}` : 'ສັ່ງກັບບ້ານ'} 
      items={cart.map(item => ({
        ...item,
        subtotal: item.price * item.quantity 
      }))}
      totalAmount={totalAmount}
    />
  </div>
</div>
    </div>
  );
}