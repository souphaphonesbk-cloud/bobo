export default function Page() {
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
                <form className="flex flex-col gap-4 w-full px-10">
  {/* ช่องกรอก Email */}
  <div className="flex flex-col gap-1">
    <label className="text-sm font-semibold text-yellow-600">Email address</label>
    <input 
      type="email" 
      placeholder="Enter your email"
      className="w-full px-4 py-3 rounded-xl border border-gray-300  focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
    />
  </div>

  {/* ช่องกรอก Password */}
  <div className="flex flex-col gap-1">
    <label className="text-sm font-semibold text-yellow-600">Password</label>
    <input 
      type="password" 
      placeholder="Enter your password"
      className="w-full px-4 py-3 rounded-xl border border-gray-300  focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
    />
  </div>

  {/* ปุ่ม Login */}
  <button className="w-full py-3 mt-4 bg-yellow-400 hover:bg-yellow-400 text-white font-bold rounded-xl shadow-md transition-all">
    Log in
  </button>
</form>
            </div>

        </div>
    );
}