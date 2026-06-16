"use client";
import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { User, Save, Trash2, Edit2, Image as ImageIcon } from 'lucide-react';
import Swal from 'sweetalert2'; // ນຳເຂົ້າ SweetAlert2

export default function SettingsPage() {
  const [profile, setProfile] = useState({ username: '', password: '', role: '', avatar_url: '',address: '', phone: '' });
  const [newUser, setNewUser] = useState({ username: '', password: '', role: '',address: '', phone: '' });
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

  useEffect(() => {
    const init = async () => {
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

      const { data: allUsers, error } = await supabase.from('Users').select('role');
      if (allUsers) {
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
    if (profile.role !== 'ເຈົ້າຂອງຮ້ານ' && editingUserId !== profile.user_id) {
      return Swal.fire({ icon: 'error', title: 'ບໍ່ມີສິດ!', text: 'ເຈົ້າບໍ່ມີສິດແກ້ໄຂຂໍ້ມູນນີ້!' });
    }

    const targetId = editingUserId || profile.user_id;
    if (!targetId) {
      return Swal.fire({ icon: 'warning', title: 'ຜິດພາດ', text: 'ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ທີ່ຈະແກ້ໄຂ' });
    }

    const { error } = await supabase
      .from('Users')
      .update({ 
        username: profile.username, 
        password: profile.password, 
        role: profile.role,
        address: profile.address, 
        phone: profile.phone
      })
      .eq('user_id', targetId);

    if (error) {
      Swal.fire({ icon: 'error', title: 'ຜິດພາດ', text: error.message });
    } else {
      Swal.fire({ icon: 'success', title: 'ສຳເລັດ!', text: 'ແກ້ໄຂຂໍ້ມູນສຳເລັດ!' });
      await fetchData(profile.role, profile.username);
      setEditingUserId(null);
    }
  };

  const handleDelete = async (id) => {
    if (profile.role !== 'ເຈົ້າຂອງຮ້ານ') {
      return Swal.fire({ icon: 'error', title: 'ບໍ່ມີສິດ!', text: 'ເຈົ້າບໍ່ມີສິດລຶບຂໍ້ມູນນີ້!' });
    }
    
    const result = await Swal.fire({
      title: 'ເຈົ້າແນ່ໃຈບໍ່?',
      text: "ການລຶບນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ລຶບເລີຍ',
      cancelButtonText: 'ຍົກເລີກ'
    });

    if (result.isConfirmed) {
      await supabase.from('Users').delete().eq('user_id', id);
      Swal.fire('ສຳເລັດ!', 'ລຶບຜູ້ໃຊ້ນີ້ອອກແລ້ວ', 'success');
      await fetchData(profile.role, profile.username);
    }
  };

 // handleUpload ທີ່ແກ້ໄຂແລ້ວ
const handleUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const fileExt = file.name.split('.').pop();
  const fileName = `bo_${Date.now()}.${fileExt}`;
  
  // ອັບໂຫຼດຮູບພາບ
  const { error: uploadError } = await supabase.storage.from('avatars').upload(`public/${fileName}`, file);
  if (uploadError) return Swal.fire({ icon: 'error', title: 'ຜິດພາດ', text: uploadError.message });

  // ດຶງ Public URL
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(`public/${fileName}`);

  const targetId = editingUserId || profile.user_id;
  if (!targetId) {
    return Swal.fire({ icon: 'warning', title: 'ຜິດພາດ', text: 'ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ທີ່ຈະອັບເດດຮູບພາບ' });
  }

  // ອັບເດດໃນ Table Users
  const { error: updateError } = await supabase
    .from('Users')
    .update({ avatar_url: urlData.publicUrl })
    .eq('user_id', targetId); // ອັບເດດສະເພາະ ID ນີ້

  if (updateError) {
    Swal.fire({ icon: 'error', title: 'ຜິດພາດ', text: updateError.message });
  } else {
    // ອັບເດດຮູບພາບໃນໜ້າຈໍທັນທີ (state Profile)
    setProfile({ ...profile, avatar_url: urlData.publicUrl });
    Swal.fire({ icon: 'success', title: 'ສຳເລັດ!', text: 'ປ່ຽນຮູບພາບສຳເລັດແລ້ວ' });
    // ອາດຈະຕ້ອງການດຶງຂໍ້ມູນຜູ້ໃຊ້ໃໝ່ເພື່ອໃຫ້ລາຍຊື່ຜູ້ໃຊ້ທັງໝົດອັບເດດນຳ
    await fetchData(profile.role, profile.username);
  }
};

  const addUser = async () => {
  if (!newUser.username || !newUser.password || !newUser.role) {
    return Swal.fire({ icon: 'info', title: 'ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບ' });
  }
  
  const { error } = await supabase.from('Users').insert([{
    username: newUser.username,
    password: newUser.password,
    role: newUser.role,
    address: newUser.address, // ເພີ່ມໃໝ່
    phone: newUser.phone      // ເພີ່ມໃໝ່
  }]);

  if (error) Swal.fire({ icon: 'error', title: 'ຜິດພາດ', text: error.message });
  else {
    Swal.fire({ icon: 'success', title: 'ສຳເລັດ!', text: 'ເພີ່ມຜູ້ໃຊ້ໃໝ່ສຳເລັດ!' });
    setNewUser({ username: '', password: '', role: '', address: '', phone: '' }); // ເຄຼຍຄ່າໃຫ້ໝົດ
    await fetchData(profile.role, profile.username);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-slate-800 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
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
              <input type="text" value={profile.username || ""} onChange={(e) => setProfile({...profile, username: e.target.value})} className="p-4 bg-gray-50 rounded-2xl" placeholder="ຊື່ຜູ້ໃຊ້" />
              <input type="text" value={profile.password || ""} onChange={(e) => setProfile({...profile, password: e.target.value})} className="p-4 bg-gray-50 rounded-2xl" placeholder="ລະຫັດຜ່ານ" />
              <input type="text" value={profile.role || ""} onChange={(e) => setProfile({...profile, role: e.target.value})} className="p-4 bg-gray-50 rounded-2xl" placeholder="ຕຳແໜ່ງ" />
              <input type="text" value={profile.address || ""} onChange={(e) => setProfile({...profile, address: e.target.value})} className="p-4 bg-gray-50 rounded-2xl" placeholder="ທີ່ຢູ່" />
              <input type="tel" value={profile.phone || ""} onChange={(e) => setProfile({...profile, phone: e.target.value})} className="p-4 bg-gray-50 rounded-2xl" placeholder="ເບີໂທລະສັບ" />
            </div>
            <button onClick={handleUpdate} className="mt-8 bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2">
              <Save size={18} /> {editingUserId ? "ບັນທຶກການແກ້ໄຂ" : "ແກ້ໄຂຂໍ້ມູນ"}
            </button>
          </div>
          {isAdmin && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm">
            <h4 className="font-bold mb-4">ເພີ່ມຜູ້ໃຊ້ໃໝ່</h4>
           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-1">
              <input type="text" placeholder="ຊື່" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} className="p-3 bg-gray-50 rounded-xl" />
              <input type="password" placeholder="ລະຫັດ" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="p-3 bg-gray-50 rounded-xl" />
              <input type="text" placeholder="ທີ່ຢູ່" value={newUser.address || ""} onChange={(e) => setNewUser({...newUser, address: e.target.value})} className="p-3 bg-gray-50 rounded-xl" />
              <input type="tel" placeholder="ເບີໂທ" value={newUser.phone || ""} onChange={(e) => setNewUser({...newUser, phone: e.target.value})} className="p-3 bg-gray-50 rounded-xl" />
               <select onChange={(e) => setNewUser({...newUser, role: e.target.value})} className="p-3 bg-gray-50 rounded-xl">
                <option value="">-- ເລືອກຕຳແໜ່ງ --</option>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>             
           <button onClick={addUser} className="bg-green-500 text-white p-3 rounded-xl font-bold">
      ບັນທຶກຜູ້ໃຊ້
    </button>
            </div>
             
          </div>
          )}
        </main>
        <aside className="bg-white p-6 rounded-[40px] border shadow-sm h-fit">
          <h4 className="font-bold mb-4">ລາຍຊື່ຜູ້ໃຊ້ທັງໝົດ</h4>
          <div className="space-y-4">
            {usersList.map((user) => (
              <div key={user.user_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <p className="font-bold">{user.username}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                  {user.phone && <p className="text-xs text-orange-500 mt-1">📞 {user.phone}</p>}
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