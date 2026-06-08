"use client";
import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { User, Save, Trash2, Edit2, Image as ImageIcon } from 'lucide-react';

export default function SettingsPage() {
  const [profile, setProfile] = useState({ username: '', password: '', role: '', avatar_url: '' });
  const [newUser, setNewUser] = useState({ username: '', password: '', role: '' });
  const [roles, setRoles] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const isAdmin = profile?.role === 'ເຈົ້າຂອງຮ້ານ';

const fetchData = async (currentRole, currentUsername) => {
  if (currentRole === 'ເຈົ້າຂອງຮ້ານ') {
    const { data } = await supabase.from('Users').select('*');
    if (data) setUsersList(data);
  } else {
    const { data } = await supabase.from('Users')
      .select('*')
      .eq('username', currentUsername); 
    if (data) setUsersList(data);
  }
};

  // ໃນ SettingsPage.js
useEffect(() => {
    const init = async () => {
      // 1. ດຶງຂໍ້ມູນ User ທີ່ລັອກອິນ (ຈາກ localStorage ຕາມທີ່ເຮົາແກ້ໄຂກ່ອນໜ້າ)
      const savedUser = localStorage.getItem("currentUser");
      if (!savedUser) return;
      const loggedInUser = JSON.parse(savedUser);
      
      const { data: userData } = await supabase
          .from('Users')
          .select('*')
          .eq('user_id', loggedInUser.user_id)
          .single();
          
      if (userData) {
        setProfile(userData);
        await fetchData(userData.role, userData.username);
      }

      // 2. ແກ້ໄຂບ່ອນດຶງ Roles (ໃຫ້ແນ່ໃຈວ່າດຶງມາຖືກ)
      const { data: allUsers, error } = await supabase.from('Users').select('role');
      if (allUsers) {
        // ກັ່ນຕອງເອົາສະເພາະຄ່າທີ່ມີ (ບໍ່ໃຫ້ເປັນ null ຫຼື undefined)
        const rolesList = allUsers.map(u => u.role).filter(role => role && role.trim() !== "");
        const uniqueRoles = [...new Set(rolesList)];
        setRoles(uniqueRoles);
      } else {
        console.error("Error fetching roles:", error);
      }
    };
    init();
  }, []);

  const handleEditClick = (user) => {
    setEditingUserId(user.user_id);
    setProfile(user);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdate = async () => {
    // 1. ກວດສອບສິດກ່ອນ
    if (profile.role !== 'ເຈົ້າຂອງຮ້ານ' && editingUserId !== profile.user_id) {
      return alert("ເຈົ້າບໍ່ມີສິດແກ້ໄຂຂໍ້ມູນນີ້!");
    }

    // 2. ກຳນົດ targetId ໃຫ້ຖືກຕ້ອງ
    const targetId = editingUserId || profile.user_id;
    console.log("ກຳລັງອັບເດດ ID ນີ້:", targetId); // ເພີ່ມບັນທັດນີ້
    console.log("ຂໍ້ມູນທີ່ສົ່ງໄປ:", { username: profile.username, role: profile.role });

    if (!targetId) {
      alert("ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ທີ່ຈະແກ້ໄຂ");
      return;
    }

    // 3. ເຮັດການ Update ຂໍ້ມູນ
    const { error } = await supabase
      .from('Users')
      .update({ 
        username: profile.username, 
        password: profile.password, 
        role: profile.role 
      })
      .eq('user_id', targetId); // ດຽວນີ້ targetId ຈະຮູ້ຈັກແລ້ວ

    if (error) {
      alert("ຜິດພາດ: " + error.message);
    } else {
      alert("ແກ້ໄຂສຳເລັດ!");
        await fetchData(profile.role, profile.username);
    }
  };

  const handleDelete = async (id) => {
  if (profile.role !== 'ເຈົ້າຂອງຮ້ານ') {
    return alert("ເຈົ້າບໍ່ມີສິດລຶບຂໍ້ມູນນີ້!"); // ບລັອກໄວ້ທັນທີ
  }
  if (!confirm("ລຶບຜູ້ໃຊ້ນີ້ແທ້ບໍ່?")) return;
  await supabase.from('Users').delete().eq('user_id', id);
  await fetchData(profile.role, profile.username);
};
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const fileExt = file.name.split('.').pop();
    const fileName = `bo_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage.from('avatars').upload(`public/${fileName}`, file);
    if (uploadError) return alert(uploadError.message);

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(`public/${fileName}`);
    await supabase.from('Users').update({ avatar_url: urlData.publicUrl }).eq('username', 'bo');
    setProfile({ ...profile, avatar_url: urlData.publicUrl });
  };

  const addUser = async () => {
    const { error } = await supabase.from('Users').insert([newUser]);
    if (error) alert("ຜິດພາດ: " + error.message);
    else {
      alert("ເພີ່ມຜູ້ໃຊ້ສຳເລັດ!");
      setNewUser({ username: '', password: '', role: '' });
      await fetchData(profile.role, profile.username);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-slate-800">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        
        {/* ຝັ່ງຊ້າຍ: ຟອມ */}
        <main className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[40px] border shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <User size={20} className="text-orange-500" /> ຂໍ້ມູນສ່ວນຕົວ
            </h3>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-[30px] overflow-hidden bg-orange-100 flex items-center justify-center">
                {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <ImageIcon size={40} className="text-orange-400" />}
              </div>
              <label className="px-4 py-2 border rounded-xl font-bold cursor-pointer">
                ປ່ຽນຮູບ <input type="file" className="hidden" onChange={handleUpload} />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" value={profile.username} onChange={(e) => setProfile({...profile, username: e.target.value})} className="p-4 bg-gray-50 rounded-2xl" placeholder="ຊື່ຜູ້ໃຊ້" />
              <input type="text" value={profile.password} onChange={(e) => setProfile({...profile, password: e.target.value})} className="p-4 bg-gray-50 rounded-2xl" placeholder="ລະຫັດຜ່ານ" />
              <input type="text" value={profile.role} onChange={(e) => setProfile({...profile, role: e.target.value})} className="p-4 bg-gray-50 rounded-2xl" placeholder="ຕຳແໜ່ງ" />
            </div>

            <button onClick={handleUpdate} className="mt-8 bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2">
              <Save size={18} /> {editingUserId ? "ບັນທຶກການແກ້ໄຂ" : "ແກ້ໄຂຂໍ້ມູນ"}
            </button>
          </div>

          {/* ຟອມເພີ່ມຜູ້ໃຊ້ */}
          {isAdmin && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm">
            <h4 className="font-bold mb-4">ເພີ່ມຜູ້ໃຊ້ໃໝ່</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" placeholder="ຊື່" onChange={(e) => setNewUser({...newUser, username: e.target.value})} className="p-3 bg-gray-50 rounded-xl" />
              <input type="password" placeholder="ລະຫັດ" onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="p-3 bg-gray-50 rounded-xl" />
              <select 
  onChange={(e) => setNewUser({...newUser, role: e.target.value})} 
  className="p-3 bg-gray-50 rounded-xl"
>
  <option value="">-- ເລືອກຕຳແໜ່ງ --</option>
  {roles.map(r => <option key={r} value={r}>{r}</option>)}
</select>
            </div>
            <button onClick={addUser} className="mt-4 bg-green-500 text-white px-6 py-2 rounded-xl font-bold">ບັນທຶກຜູ້ໃຊ້</button>
          </div>
          )}
        </main>

        {/* ຝັ່ງຂວາ: ລາຍຊື່ */}
        <aside className="bg-white p-6 rounded-[40px] border shadow-sm h-fit">
          <h4 className="font-bold mb-4">ລາຍຊື່ຜູ້ໃຊ້ທັງໝົດ</h4>
          <div className="space-y-4">
            {usersList.map((user) => (
              <div key={user.user_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <p className="font-bold">{user.username}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
                <div className="flex gap-2">
                  {isAdmin && (
                 <>
                  <button onClick={() => handleEditClick(user)} className="p-2 text-blue-500"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(user.user_id)} className="p-2 text-red-500"><Trash2 size={18} /></button>
                  </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}