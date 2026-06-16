'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // 🌟 ເພີ່ມ useRouter ເພື່ອໃຊ້ດີດໜ້າເວັບ
import Link from 'next/link';
import { 
  LayoutDashboard, UtensilsCrossed, Table2, History, 
  Wallet, User, LogOut, BarChart3 // 🌟 ເພີ່ມ LogOut icon ເພື່ອຄວາມສວຍງາມ
} from 'lucide-react';
import Swal from 'sweetalert2';

const Sidebar = ({}) => {
  const [activeTab, setActiveTab] = useState('home');
  const [currentUser, setCurrentUser] = useState(null); // 🌟 State ເກັບຂໍ້ມູນ User ປັດຈຸບັນ
  const router = useRouter();

  // 🌟 ດຶງຂໍ້ມູນ User ມາຈາກ localStorage ຕອນເປີດໜ້າເວັບ
  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  // 🌟 🎯 ຟັງຊັນສຳລັບການລັອກເອົ້າ
  const handleLogout = async (e) => { // 🌟 ປ່ຽນເປັນ async
  e.preventDefault();
  
  // 🌟 ໃຊ້ Swal ແທນ confirm()
  const result = await Swal.fire({
    title: 'ທ່ານຕ້ອງການອອກຈາກລະບົບແທ້ບໍ່?',
    text: "ເມື່ອອອກຈາກລະບົບແລ້ວ ທ່ານຈະຕ້ອງໄດ້ລັອກອິນໃໝ່!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#f97316', // ສີສົ້ມໃຫ້ເຂົ້າກັບຕີມ
    cancelButtonColor: '#d1d5db',  // ສີເທົາ
    confirmButtonText: 'ແມ່ນ, ອອກຈາກລະບົບ',
    cancelButtonText: 'ຍົກເລີກ'
  });

  // 🌟 ເຊັກຜົນຕອບຮັບ
  if (result.isConfirmed) {
    // 1. ລຶບ Cookie
    document.cookie = "isLoggedIn=; path=/; max-age=0;";
    document.cookie = "userRole=; path=/; max-age=0;";

    // 2. ລຶບຂໍ້ມູນ User ໃນ localStorage
    localStorage.removeItem("currentUser");

    // 3. ແຈ້ງເຕືອນສຳເລັດ
    Swal.fire(
      'ອອກຈາກລະບົບສຳເລັດ!',
      'ທ່ານໄດ້ອອກຈາກລະບົບຮຽບຮ້ອຍແລ້ວ.',
      'success'
    ).then(() => {
        // 4. ດີດກັບໄປໜ້າ login
        router.push('/login');
        router.refresh();
    });
  }
};

  return (
    <div>
      {/* 1. Sidebar */}
      <aside className="w-64 h-screen bg-white border-r p-6 hidden lg:flex flex-col justify-between">
        
        {/* ส่วนบน: โลโก้ และ เมนู */}
        <div>
          <div className='flex items-center gap-3 mb-10'>
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm border border-gray-100">
              <img src="/icon/logo.jpg" alt="Logo" />
            </div>
            <div className="text-yellow-500 font-bold text-2xl tracking-tight">Puckluck</div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'home', name: 'ໜ້າຫຼັກ', icon: <LayoutDashboard size={20} />, path: '/admin/home' },
              { id: 'counter-order', name: 'ສັ່ງອາຫານ', icon: <LayoutDashboard size={20} />, path: '/admin/counter-order' },
              { id: 'orders', name: 'ການຂາຍ', icon: <History size={20} />, path: '/admin/orders' },
              { id: 'tables', name: 'ສະຖານະໂຕະ', icon: <Table2 size={20} />, path: '/admin/tables' },
              { id: 'stock-in', name: 'ນຳເຂົ້າສິນຄ້າ', icon: <Wallet size={20} />, path: '/admin/stock-in' },
              { id: 'menu', name: 'ຈັດການເມນູ', icon: <UtensilsCrossed size={20} />, path: '/admin/menu' },
              { id: 'reports', name: 'ລາຍຮັບລາຍຈ່າຍ', icon: <BarChart3 size={20} />, path: '/admin/reports' },
              { id: 'settings', name: 'ຜູ້ໃຊ້', icon: <User size={20} />, path: '/admin/settings' },
              { id: 'logout', name: 'ອອກຈາກລະບົບ', icon: <LogOut size={20} />, path: '#', isLogout: true }, // 🌟 ປ່ຽນ icon ແລະ ໃສ່ Flag ໄວ້ເຊັກ
            ].map((item) => (
              <Link 
                key={item.id}
                href={item.path} 
                onClick={(e) => {
                  if (item.isLogout) {
                    handleLogout(e); // 🌟 ຖ້າເປັນປຸ່ມລັອກເອົ້າ ໃຫ້ຮ້ອງໃຊ້ຟັງຊັນ logout
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                  item.isLogout 
                    ? 'text-red-500 hover:bg-red-50' // 🌟 ປ່ຽນປຸ່ມ Logout ໃຫ້ເປັນສີແດງຊັດເຈນ
                    : activeTab === item.id 
                      ? 'bg-orange-50 text-orange-600 font-bold' 
                      : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>

        {/* 🌟 ส่วนล่าง: แสดงชื่อพนักงานที่ Login อยู่ปัจจุบัน */}
        {currentUser && (
          <div className="border-t pt-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 font-bold">
              {currentUser.username?.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-gray-800 truncate">{currentUser.username}</span>
              <span className="text-xs text-gray-400">{currentUser.role || 'ພະນັກງານ'}</span>
            </div>
          </div>
        )}

      </aside>
    </div>
  )
}

export default Sidebar;