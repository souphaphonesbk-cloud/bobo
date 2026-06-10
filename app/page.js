"use client";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Page() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [myFoods, setMyFoods] = useState([]);
  const [cart, setCart] = useState({});

  function TableSessionManager() {
    const searchParams = useSearchParams();

    useEffect(() => {
      const table = searchParams.get('table');
      const id = searchParams.get('id');
      
      if (table && id) {
        localStorage.setItem("puckluck_table_number", table);
        localStorage.setItem("puckluck_table_id", id);
        console.log("✅ Saved Table:", table);
      }
    }, [searchParams]);

    return null;
  }

  const updateQty = (id, delta) => {
    setCart((prev) => {
      const currentQty = prev[id] || 0;
      const newQty = Math.max(0, currentQty + delta);
      const newCart = { ...prev, [id]: newQty };

      if (newQty === 0) {
        delete newCart[id];
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("puckluck_cart", JSON.stringify(newCart));
      }

      return newCart;
    });
  };

  async function fetchData() {
    try {
      // 1. ດຶງຂໍ້ມູນໝວດໝູ່ອາຫານທັງໝົດ
      const { data: catData, error: catError } = await supabase
        .from("Categories")
        .select("*");
      if (catError) throw catError;

      // 1.2 ດຶງຂໍ້ມູນໝວດໝູ່ເຄື່ອງດື່ມ
      const { data: catDrinkData, error: catDrinkError } = await supabase
        .from("Category_drink")
        .select("*");
      if (catDrinkError) throw catDrinkError;

      // ລວມປຸ່ມໝວດໝູ່ທັງໝົດ
      if (catData && catDrinkData) {
        const formattedCatDrinks = catDrinkData.map(cd => ({
          category_id: `drink_${cd.category_drink_id}`,
          category_name: cd.category_drink_name
        }));

        const allCategories = catData.concat(formattedCatDrinks);

        // ກັ່ນຕອງເອົາວັດຖຸດິບອອກ
        const filteredCategories = allCategories.filter(cat => 
          !cat.category_name.includes("ວັດຖຸດິບອາຫານ") && 
          !cat.category_name.includes("ວັດຖຸດິບເຄື່ອງດື່ມ") 
        );
        
        setCategories(filteredCategories);

        // ✅ ແກ້ໄຂຈຸດທີ 1: ໃຫ້ເລືອກໝວດທຳອິດຈາກ filteredCategories ທີ່ກັ່ນຕອງແລ້ວ
        if (filteredCategories.length > 0 && !selectedCategory) {
          setSelectedCategory(filteredCategories[0].category_name);
        }
      }

      // 2. ດຶງຂໍ້ມູນອາຫານ (Menus) ແລະ ເອົາ Column is_available ມາພ້ອມ
      const { data: menuData, error: menuError } = await supabase
        .from("Menus")
        .select("*, category:Categories!category_id(category_name)");
      if (menuError) throw menuError;

      // 3. ດຶງຂໍ້ມູນເຄື່ອງດື່ມ (Drink) ແລະ ເອົາ Column is_available ມາພ້ອມ
      const { data: drinkData, error: drinkError } = await supabase
        .from("Drink")
        .select("*, category_drink:Category_drink!category_drink_id(category_drink_name)"); 
      if (drinkError) throw drinkError;

      // 4. ແປງ Format ຂອງເຄື່ອງດື່ມໃຫ້ມີ Object category ຄືກັນກັບອາຫານ
      const formattedDrinks = drinkData ? drinkData.map(d => ({
        id: d.drink_id,
        menu_id: d.drink_id, 
        menu_name: d.drink_name,
        laoName: d.laoName || "",
        price: d.price,
        image: d.image,
        is_available: d.is_available ?? true, // ✅ ຮອງຮັບການເປີດ-ປິດເມນູ
        category: {
          category_name: d.category_drink?.category_drink_name 
        }
      })) : [];

      // ✅ ແປງ Format ຝັ່ງເມນູອາຫານໃຫ້ແນ່ໃຈວ່າໂຄງສ້າງ category ຕົງກັນ
      const formattedMenus = menuData ? menuData.map(m => ({
        ...m,
        is_available: m.is_available ?? true, // ✅ ຮອງຮັບການເປີດ-ປິດເມນູ
        category: {
          category_name: m.category?.category_name
        }
      })) : [];

      // 5. ລວມຂໍ້ມູນແລ້ວເຊັດລົງ State
      const allFoodsAndDrinks = formattedMenus.concat(formattedDrinks);
      setMyFoods(allFoodsAndDrinks);
      console.log("🚀 All Combined Data:", allFoodsAndDrinks);

    } catch (error) {
      console.error("Fetch Data Error:", error);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="w-full bg-white min-h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <TableSessionManager />
      </Suspense>
      <div className="flex flex-col min-h-screen w-full relative">
        {/* Banner */}
        <div className="relative w-full h-[200px]">
          <img
            src="/icon/puckluck.jpg"
            className="absolute inset-0 w-full h-full object-cover"
            alt="background"
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="relative z-10 px-5 mt-10 text-white">
            <h1 className="font-bold text-2xl drop-shadow-lg">Puckluck Restaurant</h1>
            <div className="flex items-center mt-2 gap-3">
              <img className="h-15 w-15 rounded-full" src="/icon/logo.jpg" alt="logo" />
              <span className="font-semibold text-sm drop-shadow-md">ບ້ານ ປັກຫລັກ</span>
            </div>
            <p className="font-medium mt-3 text-lg italic drop-shadow-md text-yellow-400">
              "Beef noodle soup are delicious"
            </p>
          </div>
        </div>

        {/* Menu Categories Tab */}
        <div className="flex gap-3 px-5 mt-6 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.category_id}
              onClick={() => setSelectedCategory(cat.category_name)}
              className={`px-6 py-2 rounded-2xl border whitespace-nowrap transition-all ${
                selectedCategory === cat.category_name
                  ? "bg-amber-400 border-amber-400 font-bold text-white"
                  : "bg-white border-gray-200 text-gray-400"
              }`}
            >
              {cat.category_name}
            </button>
          ))}
        </div>

        {/* Food & Drink List */}
        <div className="flex flex-col gap-2 px-5 mt-8 pb-10">
          {myFoods
            .filter((food) => {
              // ✅ Filter ຕາມໝວດໝູ່ ແລະ ສະແດງສະເພາະເມນູທີ່ພ້ອມຂາຍ (is_available !== false)
              return food.category?.category_name === selectedCategory && food.is_available !== false;
            })
            .map((food) => (
              <div
                key={food.menu_id}
                className="flex items-center bg-white rounded-3xl p-3 shadow-md border border-gray-50 gap-3"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
                  <img
                    className="w-full h-full object-cover scale-120"
                    src={food.image}
                    alt={food.menu_name}
                  />
                </div>
                <div className="flex flex-col flex-grow">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-bold text-lg text-gray-800">{food.menu_name}</span>
                      <span className="text-gray-500 text-sm font-medium">{food.laoName}</span>
                    </div>

                    {/* Quantity Counter */}
                    <div className="flex items-center gap-3 bg-gray-50 px-2 py-1 rounded-xl shadow-inner">
                      <button
                        onClick={() => updateQty(food.menu_id, -1)}
                        className="text-yellow-500 font-bold w-6 h-6 flex items-center justify-center hover:scale-125 transition-all"
                      >
                        -
                      </button>
                      <span className="font-bold text-sm text-black min-w-[15px] text-center">
                        {cart[food.menu_id] || 0}
                      </span>
                      <button
                        onClick={() => updateQty(food.menu_id, 1)}
                        className="text-yellow-500 font-bold w-6 h-6 flex items-center justify-center hover:scale-125 transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <span className="text-yellow-500 font-bold mt-1 text-xl">
                    {food.price ? food.price.toLocaleString() : 0} kip
                  </span>
                </div>
              </div>
            ))}
        </div>

        {/* Floating Cart Button */}
        <Link href="/my-oder/">
          <div className="fixed bottom-8 right-6 z-50">
            <button className="flex items-center bg-yellow-400 p-1.5 pl-4 rounded-full shadow-lg hover:bg-yellow-500 transition-colors border-0">
              <div className="mr-3">
                <img src="/icon/paper-bag.svg" className="w-6 h-6" alt="cart-icon" />
              </div>
            </button>
          </div>
        </Link>
      </div>
    </div>
  );
}