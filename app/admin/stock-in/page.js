"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { PackagePlus, History, ArrowLeft, Save, Loader2, Trash2, Edit2, X } from 'lucide-react';
import Link from 'next/link';

export default function StockInPage() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false); // ສະຖານະວ່າກຳລັງແກ້ໄຂຫຼືບໍ່
  const [editId, setEditId] = useState(null);       // ເກັບ ID ຂອງແຖວທີ່ກຳລັງແກ້ໄຂ
  
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: '',
    unit: 'ແກ້ວ',
    cost_price: '',
    supplier: ''
  });

  // ດຶງຂໍ້ມູນປະຫວັດ
  const fetchStockHistory = async () => {
    const { data, error } = await supabase
      .from('Stock_Transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    if (!error) setHistory(data);
  };

  useEffect(() => {
    fetchStockHistory();
  }, []);

  // ຟັງຊັນ Submit (ຮອງຮັບທັງ ເພີ່ມໃໝ່ ແລະ ອັບເດດ)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = { 
      item_name: formData.item_name,
      quantity: parseInt(formData.quantity),
      unit: formData.unit,
      cost_price: parseInt(formData.cost_price),
      supplier: formData.supplier
    };

    if (isEditing) {
      // ກໍລະນີ: ແກ້ໄຂຂໍ້ມູນ (Update)
      const { error } = await supabase
        .from('Stock_Transactions')
        .update(payload)
        .eq('id', editId);

      if (!error) {
        alert("ອັບເດດຂໍ້ມູນສຳເລັດ!");
        resetForm();
        fetchStockHistory();
      } else {
        alert("ຜິດພາດໃນການອັບເດດ: " + error.message);
      }
    } else {
      // ກໍລະນີ: ເພີ່ມຂໍ້ມູນໃໝ່ (Insert)
      const { error } = await supabase
        .from('Stock_Transactions')
        .insert([payload]);

      if (!error) {
        alert("ບັນທຶກການນຳເຂົ້າສຳເລັດ!");
        resetForm();
        fetchStockHistory();
      } else {
        alert("ຜິດພາດ: " + error.message);
      }
    }
    setLoading(false);
  };

  // ຟັງຊັນລົບຂໍ້ມູນ
  const handleDelete = async (id, itemName) => {
    const confirmDelete = window.confirm(`ເຈົ້າຕ້ອງການລົບລາຍການ "${itemName}" ແທ້ຫຼືບໍ່?`);
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('Stock_Transactions')
      .delete()
      .eq('id', id);

    if (!error) {
      alert("ລົບລາຍການສຳເລັດ!");
      // ຖ້າລາຍການທີ່ກຳລັງແກ້ໄຂຖືກລົບ ໃຫ້ເຄຼຍຟອມນຳ
      if (editId === id) resetForm();
      fetchStockHistory();
    } else {
      alert("ຜິດພາດໃນການລົບ: " + error.message);
    }
  };

  // ຟັງຊັນເລືອກຂໍ້ມູນມາແກ້ໄຂ
  const handleEditSelect = (item) => {
    setIsEditing(true);
    setEditId(item.id);
    setFormData({
      item_name: item.item_name,
      quantity: item.quantity.toString(),
      unit: item.unit,
      cost_price: item.cost_price.toString(),
      supplier: item.supplier || ''
    });
  };

  // ຟັງຊັນລ້າງຂໍ້ມູນໃນຟອມ
  const resetForm = () => {
    setFormData({ item_name: '', quantity: '', unit: 'ແກ້ວ', cost_price: '', supplier: '' });
    setIsEditing(false);
    setEditId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-lao p-4 md:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/admin/tables" className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-900" />
          </Link>
          <h1 className="text-2xl font-black flex items-center gap-2 text-gray-900">
            <PackagePlus className="text-orange-500" /> Stock In ສິນຄ້ານຳເຂົ້າ
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Form ປ້ອນຂໍ້ມູນ */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-200 space-y-4">
            
            {/* ສະແດງສະຖານະຖ້າກຳລັງຢູ່ໃນໂຫມດແກ້ໄຂ */}
            {isEditing && (
              <div className="flex justify-between items-center bg-orange-50 text-orange-800 px-4 py-2 rounded-xl text-sm font-bold">
                <span>⚠️ ກຳລັງແກ້ໄຂລາຍການ</span>
                <button type="button" onClick={resetForm} className="text-gray-500 hover:text-gray-800 flex items-center gap-1">
                  <X size={16} /> ຍົກເລີກ
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 ml-2 uppercase">Schuhesິນຄ້າ / ວັດຖຸດິບ</label>
                <input 
                  required
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 text-gray-900 font-medium focus:ring-2 focus:ring-orange-500 transition-all mt-1 outline-none"
                  placeholder="ລະບຸຊື່ສິນຄ້າ..."
                  value={formData.item_name}
                  onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 ml-2 uppercase">ຈຳນວນ</label>
                  <input 
                    required
                    type="number"
                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 text-gray-900 font-medium focus:ring-2 focus:ring-orange-500 transition-all mt-1 outline-none"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 ml-2 uppercase">ຫົວໜ່ວຍ</label>
                  <select 
                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 text-gray-900 font-medium focus:ring-2 focus:ring-orange-500 transition-all mt-1 outline-none appearance-none"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  >
                    <option>ແກ້ວ</option>
                    <option>ແກັດ</option>
                    <option>ກິໂລ</option>
                    <option>ຖົງ</option>
                    <option>ແພັກ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 ml-2 uppercase">ລາຄານຳເຂົ້າລວມ (KIP)</label>
                  <input 
                    required
                    type="text" 
                    inputMode="numeric" 
                    pattern="[0-9]*"
                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 text-gray-900 font-medium focus:ring-2 focus:ring-orange-500 transition-all mt-1 outline-none"
                    placeholder="0"
                    value={formData.cost_price}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setFormData({...formData, cost_price: value});
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 ml-2 uppercase">ຜູ້ສະໜອງ (Supplier)</label>
                  <input 
                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 text-gray-900 font-medium focus:ring-2 focus:ring-orange-500 transition-all mt-1 outline-none"
                    placeholder="ຊື່ຮ້ານຄ້າ..."
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <button 
              disabled={loading}
              className={`w-full text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 mt-4 ${
                isEditing ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-900 hover:bg-black'
              }`}
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : isEditing ? (
                <Save size={20} />
              ) : (
                <Save size={20} />
              )}
              {isEditing ? "ອັບເດດຂໍ້ມູນການນຳເຂົ້າ" : "ບັນທຶກການນຳເຂົ້າ"}
            </button>
          </form>
        </div>

        {/* ປະຫວັດການນຳເຂົ້າຫຼ້າສຸດ */}
        <div className="space-y-4">
          <h3 className="font-bold flex items-center gap-2 ml-2 text-gray-900">
            <History size={18} className="text-orange-500" /> ນຳເຂົ້າຫຼ້າສຸດ
          </h3>
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-1 group relative">
                
                <div className="flex justify-between items-start">
                  <span className="font-bold text-sm text-gray-900">{item.item_name}</span>
                  <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-md font-black">
                    +{item.quantity} {item.unit}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-[11px] text-gray-600 uppercase font-bold mt-1">
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  <span className="text-gray-900">{parseInt(item.cost_price).toLocaleString()} KIP</span>
                </div>

                {/* ສ່ວນປຸ່ມ ລົບ ແລະ ແກ້ໄຂ */}
                <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-100">
                  <button 
                    onClick={() => handleEditSelect(item)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                    title="ແກ້ໄຂ"
                  >
                    <Edit2 size={14} /> ແກ້ໄຂ
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id, item.item_name)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                    title="ລົບ"
                  >
                    <Trash2 size={14} /> ລົບ
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}