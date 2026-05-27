"use client";
import Link from "next/link";
import React from "react";
import { supabase } from "@/lib/supabase";

export default function Page({ params }) {
  const { id } = React.use(params);
  // 1. 🌟 ປ່ຽນຄ່າເລີ່ມຕົ້ນໃຫ້ເປັນຄ່າຫວ່າງກ່ອນ ເພາະເຮົາບໍ່ມີປຸ່ມ Recommend ແລ້ວ
  const [selectedCategory, setSelectedCategory] = React.useState("");
  const [categories, setCategories] = React.useState([]);
  const [allItems, setAllItems] = React.useState([]); 

  React.useEffect(() => {
    console.log("Table number:", id);
    
    async function fetchData() {
      try {
        // 1. ດຶງຂໍ້ມູນປະເພດອາຫານ
        const { data: catFoodData, error: catFoodError } = await supabase
          .from("Categories")
          .select("*");
        if (catFoodError) throw catFoodError;

        // 2. ດຶງຂໍ້ມູນປະເພດເຄື່ອງດື່ມ
        const { data: catDrinkData, error: catDrinkError } = await supabase
          .from("Category_drink")
          .select("*");
        if (catDrinkError) throw catDrinkError;

        // --- ລວມປະເພດອາຫານ ແລະ ເຄື່ອງດື່ມເຂົ້າກັນ ---
        const formattedCatFood = catFoodData.map(c => ({ id: c.category_id, name: c.category_name, isDrink: false }));
        const formattedCatDrink = catDrinkData.map(c => ({ id: c.category_drink_id, name: c.category_drink_name, isDrink: true }));
        
        const allCategories = [...formattedCatFood, ...formattedCatDrink];
        setCategories(allCategories);

        // 🌟 2. ຕັ້ງຄ່າໃຫ້ມັນ Select ໝວດໝູ່ທຳອິດໂດຍອັດຕະໂນມັດ ເວລາໂຫຼດໜ້າຈໍເທື່ອທຳອິດ
        if (allCategories.length > 0) {
          setSelectedCategory(allCategories[0].category_name || allCategories[0].name);
        }

        // 3. ດຶງຂໍ້ມູນເມນູອາຫານ
        const { data: menuData, error: menuError } = await supabase
          .from("Menus")
          .select("*, category:Categories!category_id(category_name)");
        if (menuError) throw menuError;

        // 4. ດຶງຂໍ້ມູນເມນູເຄື່ອງດື່ມ
        const { data: drinkData, error: drinkError } = await supabase
          .from("Drink")
          .select("*, Category_drink:Category_drink!category_drink_id(category_drink_name)");
        if (drinkError) throw drinkError;

        // --- ລວມລາຍການອາຫານ ແລະ ເຄື່ອງດື່ມເຂົ້າກັນ ---
        const formattedFoods = menuData.map(f => ({
          id: f.menu_id,
          name: f.menu_name,
          laoName: f.laoName || "",
          price: f.price,
          image: f.image,
          category_name: f.category?.category_name, 
          isDrink: false
        }));

        const formattedDrinks = drinkData.map(d => ({
          id: d.drink_id,
          name: d.drink_name,
          laoName: d.laoName || "", 
          price: d.price,
          image: d.image,
          category_name: d.Category_drink?.category_drink_name, 
          isDrink: true
        }));

        setAllItems([...formattedFoods, ...formattedDrinks]);

      } catch (error) {
        console.error("Error fetching data:", error.message);
      }
    }
    
    fetchData();
  }, [id]);

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="flex flex-col min-h-screen w-full relative">
        {/* Header ສ່ວນຫົວຮ້ານ */}
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
              <img className="h-15 w-15 rounded-full" src="/icon/logo.jpg" />
              <span className="font-semibold text-sm drop-shadow-md">ບ້ານ ປັກຫລັກ</span>
            </div>
            <p className="font-medium mt-3 text-lg italic drop-shadow-md text-yellow-400">
              "Beef noodle soup are delicious"
            </p>
          </div>
        </div>

        {/* ປຸ່ມເລືອກ Categories */}
        <div className="flex gap-3 px-5 mt-6 overflow-x-auto no-scrollbar">
          {/* 🌟 3. ລົບປຸ່ມ <button> Recommend ໂຕເກົ່າຖິ້ມແລ້ວ ເຫຼືອແຕ່ການ Map ຈາກ Database ໂດຍກົງ */}
          {categories.map((cat, index) => (
            <button
              key={index}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-6 py-2 rounded-2xl border whitespace-nowrap transition-all ${
                selectedCategory === cat.name
                  ? "bg-amber-400 border-amber-400 font-bold text-white"
                  : "bg-white border-gray-200 text-gray-400"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* ແຜງສະແດງລາຍການ (Food & Drink List) */}
        <div className="flex flex-col gap-2 px-5 mt-8 pb-10">
          {allItems
            .filter((item) => {
              // 🌟 4. ລົບເງື່ອນໄຂ Recommend ຖິ້ມ, ໃຫ້ເຫຼືອແຕ່ການກອງຕາມໝວດໝູ່ແທ້ໆ
              if (selectedCategory?.toLowerCase() === "drink") {
                return item.isDrink === true;
              }
              return item.category_name?.toLowerCase().trim() === selectedCategory?.toLowerCase().trim();
            })
            .map((item, index) => (
              <div
                key={index}
                className="flex items-center bg-white rounded-3xl p-3 shadow-md border border-gray-50 gap-3"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
                  <img
                    className="w-full h-full object-cover scale-120"
                    src={item.image || "/icon/no-image.png"}
                    alt={item.name}
                  />
                </div>
                <div className="flex flex-col flex-grow">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        {item.name}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          item.isDrink ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                        }`}>
                          {item.isDrink ? "Drink" : "Food"}
                        </span>
                      </h3>
                      {item.laoName && (
                        <span className="text-gray-500 text-sm font-medium">
                          {item.laoName}
                        </span>
                      )}
                    </div>
                    <Link href={`/my-oder?id=${item.id}&type=${item.isDrink ? 'drink' : 'food'}`}>
                      <div className="p-1 border rounded-md hover:bg-gray-100 transition-colors">
                        <img
                          className="h-3 w-3"
                          src="/icon/next.svg"
                          alt="next"
                        />
                      </div>
                    </Link>
                  </div>
                  <span className="text-yellow-500 font-bold mt-1 text-xl">
                    {item.price ? item.price.toLocaleString() : 0} kip
                  </span>
                </div>
              </div>
            ))}
            
          {allItems.filter(item => {
            if (selectedCategory?.toLowerCase() === "drink") return item.isDrink === true;
            return item.category_name?.toLowerCase().trim() === selectedCategory?.toLowerCase().trim();
          }).length === 0 && (
            <div className="text-center py-10 text-gray-400">
              ຍັງບໍ່ມີລາຍການໃນໝວດໝູ່ນີ້
            </div>
          )}
        </div>

        {/* ປຸ່ມລອຍໄປຕັກກ້າ */}
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