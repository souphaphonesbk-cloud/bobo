"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";



export default function Page() {
    const [username, setUsername] = useState(""); // ປ່ຽນຕາມ Column ໃນ Supabase ຂອງເຈົ້າ (username)
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handlelogin = async (e) =>{
      e.preventDefault();

      const {data,error}= await supabase
      .from("Users")
      .select("*")
      .eq("username",username)
      .eq("password",password)
      .single()

      if(error){
        alert("ລະຫັດບໍ່ຖືກຕ້ອງ");
      } else {
  alert("ເຂົ້າລະບົບສຳເລັດ");
  // ບັນທຶກຂໍ້ມູນ User ໄວ້
  localStorage.setItem("currentUser", JSON.stringify(data)); 
  router.push("/admin/home");
}
    }
    return (
        /* 1. ตัวแม่: ใช้ relative และสั่งให้สูงเต็มจอ (h-screen) */
        /* และใช้ flex items-center เพื่อจัดลูกให้ร่วงลงมาอยู่ตรงกลาง */
        <div className="relative w-full h-screen flex items-center justify-center  overflow-hidden">
            
            {/* 2. รูปภาพ: ใช้ absolute เพื่อให้มันลอยไปเป็นพื้นหลัง (อยู่ชั้นล่างสุด) */}
            <img 
                className="absolute inset-0 w-full h-full object-cover" 
                src="/icon/puckluck.jpg"
            />

            {/* 3. กล่อง: ใช้ z-10 เพื่อให้มันลอยทับรูปขึ้นมา */}
            <div className="relative z-10 flex h-[70%] w-[30%] bg-gray-50 border-4 flex-col border-yellow-800 rounded-[40px] shadow-2xl items-center justify-center">
                <h1 className="text-5xl font-bold text-yellow-700 mb-10"> Login</h1>
                <form onSubmit={handlelogin} className="flex flex-col gap-4 w-full px-10">
  {/* ช่องกรอก Email */}
  <div className="flex flex-col gap-1">
    <label className="text-sm font-semibold text-yellow-600">Username</label>
    <input 
              type="text" 
              placeholder="Enter your username"
              value={username} // ເຊື່ອມກັບ State
              onChange={(e) => setUsername(e.target.value)} // ອັບເດດຄ່າເມື່ອພິມ
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all text-black"
              required
            />
  </div>

  {/* ช่องกรอก Password */}
  <div className="flex flex-col gap-1">
    <label className="text-sm font-semibold text-yellow-600">Password</label>
   <input 
              type="password" 
              placeholder="Enter your password"
              value={password} // ເຊື່ອມກັບ State
              onChange={(e) => setPassword(e.target.value)} // ອັບເດດຄ່າເມື່ອພິມ
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all text-black"
              required
            />
  </div>

  {/* ปุ่ม Login */}
  <button 
            type="submit" // ຕ້ອງເປັນ type="submit" ເພື່ອໃຫ້ Form ເຮັດວຽກ
            className="w-full py-3 mt-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            Log in
          </button>
</form>
            </div>

        </div>
    );
}