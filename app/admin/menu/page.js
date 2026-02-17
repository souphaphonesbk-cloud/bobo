"use client";
import { useState } from 'react';
import { 
  LayoutDashboard, UtensilsCrossed, Table2, History, 
  Wallet, User, Search, Bell, TrendingUp, Users, ShoppingBag, Plus, Trash2, Edit3, Save, Image as ImageIcon,BarChart3
} from 'lucide-react';

export default function CounterPage() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('All');
const categories = ['Recommend', 'Drink','Stir-fries','Rice from the heart','Noodles and soup']; // ລາຍຊື່ໝວດໝູ່

 const [foods, setFoods] = useState([
    { id: 1, name:"Beef noodle soup",laoName: "ເຝີເນື້ອ", price: 25000, category: 'Noodles and soup',img: "/icon/beef-noodle-soup.jpg" },
    { id: 2, name: "Phut tai",laoName: "ຜັດໄທ", price: 18000, category: 'Stir-fries',img: "/icon/ผัดไทย.png" },
  ]);
  const filteredFoods = (selectedCategory === 'All'|| selectedCategory === 'Recommend' )
  ? foods 
  : foods.filter(food => food.category === selectedCategory);

  return (
    <div className="flex min-h-screen bg-gray-50 font-lao text-slate-800">
      
      
        {/* 2. Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* Top Header Section (Search & Profile) */}
        <header className="flex items-center justify-between mb-10">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="ຄົ້ນຫາຂໍ້ມູນ..." 
              className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-orange-200 outline-none text-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-orange-500 transition-all">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-bold">DB</div>
              <span className="text-sm font-bold text-gray-700">David Brown</span>
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Side: Form Section (ປັບຕາມຮູບຕົວຢ່າງໃໝ່ຂອງທ່ານ) */}
          <div className="w-full lg:w-[450px] bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-gray-800">
              <Plus className="text-orange-500" size={24} /> ເພີ່ມເມນູໃໝ່
            </h2>
            
            <div className="space-y-6">
              
              {/* 1. Upload Image Box */}
              <div className="border-2 border-dashed border-gray-100 rounded-[30px] p-12 flex flex-col items-center justify-center text-gray-400 hover:bg-orange-50 hover:border-orange-200 transition-all cursor-pointer bg-gray-50/30">
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                  <ImageIcon size={32} className="text-gray-300" />
                </div>
                <p className="font-bold text-gray-500 text-sm">ກົດເພື່ອອັບໂຫຼດຮູບ</p>
                <p className="text-[12px] text-gray-400 mt-1 uppercase">PNG, JPG ບໍ່ເກີນ 5MB</p>
              </div>

              {/* 2. ຊື່ລາຍການ */}
              <div>
                <label className="text-sm font-bold text-gray-400 mb-2 block ml-1 uppercase">Name food</label>
                <input 
                  type="text" 
                  placeholder="beef noodle soup" 
                  className="w-full p-4 bg-gray-50/50 border-none rounded-2xl focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium" 
                />
              </div>
               <div>
                <label className="text-sm font-bold text-gray-400 mb-2 block ml-1 uppercase">ຊື່ລາຍການ</label>
                <input 
                  type="text" 
                  placeholder="ເຝີເນື້ອ" 
                  className="w-full p-4 bg-gray-50/50 border-none rounded-2xl focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium" 
                />
              </div>

              {/* 3. ໝວດໝູ່ ແລະ ລາຄາ (Grid 2 Cols) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-400 mb-2 block ml-1 uppercase">ໝວດໝູ່</label>
                  <select className="w-full p-4 bg-gray-50/50 border-none rounded-2xl focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium cursor-pointer">
                    <option>ອາຫານຄາວ</option>
                    <option>ເຄື່ອງດື່ມ</option>
                    <option>ຂອງຫວານ</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-400 mb-2 block ml-1 uppercase">ລາຄາ (KIP)</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    className="w-full p-4 bg-gray-50/50 border-none rounded-2xl focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium" 
                  />
                </div>
              </div>

              {/* 4. ຄຳອະທິບາຍ */}
              <div>
                <label className="text-sm font-bold text-gray-400 mb-2 block ml-1 uppercase">ຄຳອະທິບາຍ</label>
                <textarea 
                  rows={3}
                  placeholder="ລາຍລະອຽດອາຫານ..." 
                  className="w-full p-4 bg-gray-50/50 border-none rounded-2xl focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium resize-none"
                ></textarea>
              </div>

              <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-5 rounded-[20px] font-bold mt-4 flex items-center justify-center gap-3 transition-all shadow-lg shadow-yellow-200 active:scale-[0.98]">
                <Save size={20} /> ບັນທຶກ
              </button>
            </div>
          </div>

          {/* Right Side: List Section */}
          <div className="flex-1 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 w-50 ">
            <h1 className='text-gray-800 font-bold text-xl '>ລາຍການທັງໝົດ</h1>
  <h2 className="text-sm font-bold text-gray-800 mb-8"></h2>
  <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl overflow-auto  ">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setSelectedCategory(cat)}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 snap-center${
            selectedCategory === cat 
            ? 'bg-white text-orange-600 shadow-sm' 
            : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {cat === 'All' ? 'ທັງໝົດ' : cat}
        </button>
      ))}
    </div>
  <div className="grid grid-cols-1 gap-4">
    {filteredFoods.map((food) => (
      <div key={food.id} className="flex items-center gap-5 p-5 border border-gray-50 rounded-[24px] hover:bg-gray-50/50 transition-all group">
        
        {/* ຮູບພາບອາຫານ */}
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300">
          <img className="w-full h-full object-cover scale-120" src={food.img} alt="food" />
        </div>

        {/* ລາຍລະອຽດຊື່ ແລະ ລາຄາ */}
        <div className="flex-1">
           <div className="flex justify-between items-start">
            <div className='flex flex-col '>
          <h3 className="font-bold text-gray-800">{food.name}</h3>
           <span className="text-gray-500 text-sm font-medium">{food.laoName}</span>
           </div>
          </div>

          <div className="flex justify-between text-gray-500 ">
              <span className="font-bold text-yellow-500">{food.price.toLocaleString()} kip</span>
            </div>
  
        </div>


         
      </div>
    ))}
  </div>
    </div>
        </div>
      </main>
    </div>
  );
}
