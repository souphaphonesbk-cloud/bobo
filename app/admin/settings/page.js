"use client";
import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { User, Save } from 'lucide-react';

export default function SettingsPage() {
  const [profile, setProfile] = useState({ username: '', password: '', role: '' });
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'staff' });

  // ຂັ້ນຕອນທີ 1: ດຶງຂໍ້ມູນຜູ້ໃຊ້ 'bo' ມາສະແດງ
  useEffect(() => {
    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('Users')
        .select('*')
        .eq('username', 'bo')
        .single();
      
      if (data) {
        setProfile(data);
      } else if (error) {
        console.error("Error loading profile:", error);
      }
    };

    loadProfile();
  }, []);

  // ຂັ້ນຕອນທີ 2: ຟັງຊັນສຳລັບປຸ່ມແກ້ໄຂ (ບັນທຶກຂໍ້ມູນກັບເຂົ້າ Database)
  const handleUpdate = async () => {
  const { data, error } = await supabase
    .from('Users')
    .update({ 
      username: profile.username, 
      password: profile.password,
      role: profile.role,
      avatar_url: profile.avatar_url 
    })
    .eq('user_id', 1); 
  if (error) {
    alert("ເກີດຂໍ້ຜິດພາດ: " + error.message);
  } else {
    alert("ແກ້ໄຂຂໍ້ມູນສຳເລັດ!");
  }
};

const handleUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    // 1. ອັບໂຫຼດຮູບ (ໃຊ້ timestamp ເພື່ອໃຫ້ຮູບສົດໃໝ່ສະເໝີ)
    const fileExt = file.name.split('.').pop();
    const fileName = `bo_${Date.now()}.${fileExt}`; // ປ່ຽນຊື່ໄຟລ໌ເພື່ອບໍ່ໃຫ້ຊ້ຳ
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(`public/${fileName}`, file);

    if (uploadError) throw uploadError;

    // 2. ເອົາ Public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(`public/${fileName}`);

    // 3. ອັບເດດ URL ລົງໃນຕາຕະລາງ Users
    const { error: updateError } = await supabase
      .from('Users')
      .update({ avatar_url: urlData.publicUrl })
      .eq('username', 'bo');

    if (updateError) throw updateError;

    setProfile({ ...profile, avatar_url: urlData.publicUrl });
    alert("ອັບໂຫຼດຮູບສຳເລັດ!");
  } catch (error) {
    alert("ເກີດຂໍ້ຜິດພາດ: " + error.message);
    console.error(error);
  }
};

const addUser = async () => {
  // ຢ່າສົ່ງ user_id ໄປ, ເພື່ອໃຫ້ Database ສ້າງໃຫ້ອັດຕະໂນມັດ
  const { data, error } = await supabase
    .from('Users')
    .insert([
      { 
        username: newUser.username, 
        password: newUser.password, 
        role: newUser.role 
      },
    ]);

  if (error) {
    alert("ເພີ່ມຜູ້ໃຊ້ບໍ່ສຳເລັດ: " + error.message);
  } else {
    alert("ເພີ່ມຜູ້ໃຊ້ໃໝ່ສຳເລັດແລ້ວ!");
    setNewUser({ username: '', password: '', role: 'Staff' }); // ລ້າງຟອມ
  }
};

  return (
    <div className="flex min-h-screen bg-gray-50 font-lao text-slate-800 p-8">
      <main className="flex-1 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <User size={20} className="text-orange-500" /> ຂໍ້ມູນສ່ວນຕົວ
        </h3>
        <div className="flex items-center gap-6 mb-8">
  <div className="w-30 h-30 rounded-[30px] overflow-hidden bg-orange-100 flex items-center justify-center">
    {profile.avatar_url ? (
      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
    ) : (
      <span className="text-orange-600 text-2xl font-black">image</span>
    )}
  </div>
  
  {/* ປຸ່ມເລືອກໄຟລ໌ */}
  <label className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer">
    ປ່ຽນຮູບພາບ
    <input type="file" className="hidden" onChange={handleUpload} accept="image/*" />
  </label>
</div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ຊື່ຜູ້ໃຊ້ */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">ຊື່ຜູ້ໃຊ້</label>
              <input 
                type="text" 
                value={profile.username} 
                onChange={(e) => setProfile({...profile, username: e.target.value})}
                className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-orange-200" 
              />
            </div>
            {/* ລະຫັດຜ່ານ */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">ລະຫັດຜ່ານ</label>
              <input 
                type="text" 
                value={profile.password} 
                onChange={(e) => setProfile({...profile, password: e.target.value})}
                className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-orange-200" 
              />
            </div>
            {/* ຕຳແໜ່ງ */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">ຕຳແໜ່ງ</label>
              <input 
                type="text" 
                value={profile.role} 
                onChange={(e) => setProfile({...profile, role: e.target.value})}
                className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-orange-200" 
              />
            </div>
              {/* ປຸ່ມແກ້ໄຂ */}
          <div className="pt-8  flex justify-end">
            <button 
              onClick={handleUpdate}
              className="flex items-center gap-2 bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-orange-600  shadow-lg"
            >
              <Save size={18} /> ແກ້ໄຂຂໍ້ມູນ
            </button>
          </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border shadow-sm mt-8">  
  <h4 className="font-bold mb-4">ເພີ່ມຜູ້ໃຊ້ໃໝ່</h4>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <input 
      type="text" placeholder="ຊື່ຜູ້ໃຊ້" 
      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
      className="p-3 bg-gray-50 rounded-xl"
    />
    <input 
      type="password" placeholder="ລະຫັດຜ່ານ" 
      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
      className="p-3 bg-gray-50 rounded-xl"
    />
    <select 
      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
      className="p-3 bg-gray-50 rounded-xl"
    >
      <option value="staff">Staff</option>
      <option value="admin">Admin</option>
    </select>
  </div>
  <button 
    onClick={() => addUser(newUser)}
    className="mt-4 bg-green-500 text-white px-6 py-2 rounded-xl font-bold"
  >
    ບັນທຶກຜູ້ໃຊ້
  </button>
</div>
      </main>
    </div>
  );
}