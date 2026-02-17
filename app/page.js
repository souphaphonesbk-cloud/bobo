"use client";
import Link from 'next/link';
import { useState,useEffect } from 'react';
import {supabase} from '@/lib/supabase';

export default function Page() {
  const [selectedCategory, setSelectedCategory] = useState('Recommend');
  const [categories,setCategories]=useState([]);
  const [myFoods,setMyFoods]=useState([]);

  useEffect(()=>{
    async function fetchData() {
    const { data: catData, error: catError } = await supabase.from('Categories').select('*');
      if (catData) setCategories(catData);
      if (catError) console.error("Error Categories:", catError.message);

    const { data: menuData, error: menuError } = await supabase.from('Menus').select('*');
      if (menuData) setMyFoods(menuData);
      if (menuError) console.error("Error Menus:", menuError.message);
  }
  fetchData();
}, []);
  
  return (
    <div className="w-full bg-white min-h-screen">
      <div className=" flex flex-col min-h-screen w-full relative">
        
        {/* --- ส่วนหัวที่มีรูปพื้นหลัง --- */}
        <div className="relative w-full h-[200px]"> 
          {/* รูปพื้นหลังที่เต็มพื้นที่ส่วนบน */}
          <img 
            src="/icon/puckluck.jpg" 
            className="absolute inset-0 w-full h-full object-cover" 
            alt="background"
          />
          {/* Overlay สีดำจางๆ เพื่อให้ตัวหนังสืออ่านง่ายขึ้น */}
          <div className="absolute inset-0 bg-black/40"></div>

          {/* Restaurant Info ที่วางทับบนรูปด้านล่าง */}
          <div className="relative z-10 px-5 mt-10 text-white">
            <h1 className="font-bold text-2xl drop-shadow-lg">Puckluck Restaurant</h1>
            <div className="flex items-center mt-2 gap-3">
            <img className='h-15 w-15 rounded-full'
             src="/icon/logo.jpg"/>
              <span className="font-semibold text-sm drop-shadow-md ">ບ້ານ ປັກຫລັກ</span>
            </div>
            <p className="font-medium mt-3 text-lg italic drop-shadow-md text-yellow-400">
              "Beef noodle soup are delicious"
            </p>
          </div>
        </div>
        {/* --- จบส่วนหัว --- */}

        {/* Menu Categories (อยู่นอกเขตพื้นที่รูปพื้นหลัง) */}
        <div className="flex gap-3 px-5 mt-6 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
            <button 
            key={cat.category_id}
           onClick={()=> setSelectedCategory(cat.category_name)}
           className={`px-6 py-2 rounded-2xl border whitespace-nowrap transition-all ${
        selectedCategory === cat.category_name ? 'bg-amber-400 border-amber-400 font-bold text-white' : 'bg-white border-gray-200 text-gray-400'
      }`} 
      >
        {cat.category_name}
            </button>
          ))}
        </div>

        {/* Food List */}
        <div className="flex flex-col gap-2 px-5 mt-8 pb-10">
          {myFoods
            .filter((food) => selectedCategory === 'Recommend' || food.category === selectedCategory)
            .map((food) => (
              <div key={food.menu_id} className="flex items-center bg-white rounded-3xl p-3 shadow-md border border-gray-50 gap-3">
                <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
                  <img className="w-full h-full object-cover scale-120" src={food.image} alt="food" />
                </div>
                <div className="flex flex-col flex-grow">
                  <div className="flex justify-between items-center">
                    <div className='flex flex-col'>
                    <span className="font-bold text-lg text-gray-800">{food.menu_name}</span>
                    <span className="text-gray-500 text-sm font-medium">{food.laoName}</span>
                    </div>
                    <Link href={`/product/${food.menu_id}`}>
                    <div className="p-1 border rounded-md"><img className="h-3 w-3" src="/icon/next.svg" alt="next" /></div>
                  </Link>
                  </div>
                 <span className="text-yellow-500 font-bold mt-1 text-xl">{food.price.toLocaleString()} kip</span>
                </div>
              </div>
            ))}
        </div>
        {/* ปุ่มลอย */}
        <Link href="/my-oder/">
         <div className="fixed bottom-8 right-6 z-50">
            <button className="flex items-center bg-yellow-400 p-1.5 pl-4 rounded-full shadow-lg hover:bg-yellow-500 transition-colors border-0">
    
           <div className="mr-3">
           <img 
            src="/icon/paper-bag.svg"  
            className="w-6 h-6" 
           alt="cart-icon" 
           />
             </div>
            </button>
           </div>
           </Link>
      </div>
    </div>
  );
}