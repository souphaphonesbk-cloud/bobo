"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useReactToPrint } from 'react-to-print';
import PrintableReceipt from '../../compronent/PrintableReceipt';
import Swal from 'sweetalert2';
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

  // ✅ ແກ້ໄຂຈຸດທີ 1: Fetch ຂໍ້ມູນແທ້ໆ ພຽງແຕ່ຄັ້ງທຳອິດທີ່ໂຫຼດໜ້າ (ຫຼຸດການຍິງ API ໄປ Supabase ໂດຍບໍ່ຈຳເປັນ)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
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
            `) 
            .order('drink_name', { ascending: true }),
        ]);

        if (mealsResponse.error) throw mealsResponse.error;
        if (drinksResponse.error) throw drinksResponse.error;

        // ✅ ກັ່ນຕອງເອົາວັດຖຸດິບອອກ ແລະ ເອົາສະເພາະເມນູທີ່ພ້ອມຂາຍ (is_available !== false)
        const filteredMeals = (mealsResponse.data || [])
          .filter(item => item.Categories?.category_name !== 'ວັດຖຸດິບອາຫານ' && item.is_available !== false);

        // ✅ ແປງ Format ເຄື່ອງດື່ມ ແລະ ເອົາສະເພາະເຄື່ອງດື່ມທີ່ພ້ອມຂາຍ (is_available !== false)
        const formattedDrinks = (drinksResponse.data || [])
          .filter(drink => drink.Category_drink?.category_drink_name !== 'ວັດຖຸດິບເຄື່ອງດື່ມ' && drink.is_available !== false)
          .map(drink => ({
            ...drink,
            menu_id: `drink_${drink.drink_id}`, 
            menu_name: drink.drink_name,
            laoName: drink.laoName || drink.drink_name, 
            is_drink: true 
          }));

        setAllMeals(filteredMeals); 
        setAllDrinks(formattedDrinks);

        // ຕັ້ງຄ່າເມນູສະແດງຜົນເລີ່ມຕົ້ນ (ອາຫານ)
        setFilteredMenus(filteredMeals);

      } catch (err) {
        console.error("Fetch data error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // 👈 ປ່ຽນເປັນ Array ຫວ່າງ ເພື່ອໃຫ້ run ຮອບດຽວພໍ

  // ✅ ແກ້ໄຂຈຸດທີ 2: ໃຊ້ useEffect ໂຕນີ້ຄອຍກວດຈັບການປ່ຽນແປງຂອງ selectedCategory ເພື່ອ Filter ແທນ
  useEffect(() => {
    if (selectedCategory === 'ເຄື່ອງດື່ມ') {
      setFilteredMenus(allDrinks);
    } else {
      setFilteredMenus(allMeals);
    }
  }, [selectedCategory, allMeals, allDrinks]);

  // ຟັງຊັນສະຫຼັບໝວດໝູ່
  const filterMenus = (category) => {
    setSelectedCategory(category);
  };

  // ເພີ່ມເມນູເຂົ້າກະຕ່າ
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

  // ປັບຫຼຸດ/ເພີ່ມຈຳນວນໃນກະຕ່າ
  const updateQuantity = (menuId, amount) => {
    setCart(cart.map(item => {
      if (item.menu_id === menuId) {
        const newQty = item.quantity + amount;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  // ລົບລາຍການອອກຈາກກະຕ່າ
  const removeFromCart = (menuId) => {
    setCart(cart.filter(item => item.menu_id !== menuId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // ຟັງຊັນສົ່ງອໍເດີ
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      Swal.fire('⚠️ ແຈ້ງເຕືອນ', 'ກະລຸນາເລືອກລາຍການອາຫານກ່ອນ!', 'warning');
      return;
    }
    if (orderType === 'eating_in' && !tableId) {
      Swal.fire('⚠️ ແຈ້ງເຕືອນ', 'ກະລຸນາລະບຸເລກໂຕະ!', 'warning');
      return;
    }

    let chosenPaymentMethod = null;
    if (orderType === 'takeaway') {
      const result = await Swal.fire({
        title: '💰 ເລືອກຊ່ອງທາງຊຳລະເງິນ',
        text: 'ລູກຄ້າຕ້ອງການຊຳລະດ້ວຍວິທີໃດ?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Cash (เງິນສົດ)',
        cancelButtonText: 'Transfer (ໂອນ OnePay)',
        confirmButtonColor: '#f97316', 
        cancelButtonColor: '#3b82f6',  
        reverseButtons: true 
      });

      if (result.isConfirmed) {
        chosenPaymentMethod = 'cash';
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        chosenPaymentMethod = 'transfer';
      } else {
        return; 
      }
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

      const generatedOrderId = Math.floor(1000 + Math.random() * 9000);

      const insertRows = cart.map(item => {
        const isDrink = item.is_drink || false;

        return {
          order_id: generatedOrderId,                    
          total_amount: totalAmount,
          table_id: actualTableId,
          order_date: new Date().toISOString(),
          order_status: 'pending',
          payment_status: orderType === 'eating_in' ? 'unpaid' : 'paid',
          payment_method: chosenPaymentMethod,
          order_type: orderType === 'eating_in' ? 'dine_in' : 'take_away',
          order_note: orderNote,
          items: cart.map(c => ({                            
            menu_id: c.menu_id,
            menu_name: c.laoName || c.menu_name,
            quantity: c.quantity,
            price: c.price,
            subtotal: c.price * c.quantity,
            is_drink: c.is_drink || false
          })),

          menu_id: !isDrink ? item.menu_id : null,          
          category_id: !isDrink ? item.category_id : null,   
          drink_id: isDrink ? item.drink_id : null,          
          category_drink_id: isDrink ? item.category_drink_id : null 
        };
      });

      const { data: insertedData, error: orderError } = await supabase
        .from('Orders')
        .insert(insertRows)
        .select();

      if (orderError) throw orderError;

      if (orderType === 'eating_in' && actualTableId) {
        await supabase
          .from('Tables')
          .update({ status: 'ບໍ່ຫວ້າງ' })
          .eq('table_id', actualTableId);
      }
      
      if (orderType === 'takeaway') {
        handlePrint();
      }

      Swal.fire({
        title: '🎉 ສຳເລັດ!',
        text: orderType === 'takeaway' 
          ? `🛍️ ສັ່ງກັບບ້ານສຳເລັດ! (ພິມໃບບິນຮຽບຮ້ອຍ)` 
          : `🍽️ ສັ່ງເຂົ້າໂຕະ ${tableId} ສຳເລັດ! `,
        icon: 'success',
        confirmButtonColor: '#f97316'
      });

      setCart([]);
      setTableId('');
      setOrderNote('');
    } catch (err) {
      console.error("Order error:", err.message);
      Swal.fire('❌ ເກີດຂໍ້ຜິດພາດ', err.message, 'error');
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
               {selectedCategory === 'ເຄື່ອງດື່ມ' ? <Coffee size={16} className="text-orange-500" /> : <Utensils size={16} className="text-orange-500" />}
               ໝວດໝູ່ <span className="font-black text-orange-600">{selectedCategory}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 bg-white p-2 rounded-full border border-gray-200 shadow-inner w-fit">
            <button
              onClick={() => filterMenus('ອາຫານ')}
              className={`px-8 py-2.5 rounded-full font-black text-sm transition-all flex items-center gap-2 ${
                selectedCategory === 'อาหาร' || selectedCategory === 'ອາຫານ' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Utensils size={16} /> ອາຫານ ({allMeals.length})
            </button>
            
            <button
              onClick={() => filterMenus('ເຄື່ອງດື່ມ')}
              className={`px-8 py-2.5 rounded-full font-black text-sm transition-all flex items-center gap-2 ${
                selectedCategory === 'ເຄື່ອງດື່ມ' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Coffee size={16} /> ເຄື່ອງດື່ມ ({allDrinks.length})
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-orange-500" size={40} />
          </div>
        ) : (
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
                  <h3 className="font-black text-gray-950 line-clamp-2 text-sm md:text-base leading-snug">{item.laoName || item.menu_name}</h3>
                  <p className="text-xs text-orange-700 font-black mt-1.5 bg-orange-50 px-2 py-0.5 rounded-md w-fit border border-orange-100">
                    {item.is_drink ? 'ເຄື່ອງດື່ມ' : (item.Categories?.category_name || 'ອາຫານ')}
                  </p>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
                    <span className="text-orange-600 font-black text-base md:text-lg">{parseInt(item.price).toLocaleString()} ₭</span>
                    <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors border border-orange-100">
                      <Plus size={16} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
                <h4 className="font-black text-sm text-gray-950 truncate">{item.laoName || item.menu_name}</h4>
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
          <div className="p-2 bg-gray-50 border border-gray-200 rounded-xl">
            <textarea
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              placeholder="ໝາຍເຫດ: ເຜັດໜ້ອຍ, ບໍ່ໃສ່ຜັກ..."
              className="w-full p-2 bg-transparent text-gray-700 text-sm focus:outline-none resize-none"
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

      {/* ສ່ວນ Printable Component */}
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