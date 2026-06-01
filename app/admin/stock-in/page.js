"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { PackagePlus, History, ArrowLeft, Save, Loader2, Trash2, Edit2, X } from 'lucide-react';
import Link from 'next/link';

export default function StockInPage() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [type, setType] = useState('menu');
  const [productList, setProductList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    item_name: '',
    quantity: '',
    unit: 'ແກ້ວ',
    cost_price: '',
    supplier: '',
    selected_id: ''
  });

  // ຟັງຊັນດຶງຂໍ້ມູນຕາມປະເພດ
  const fetchProducts = async (selectedType) => {
    const table = selectedType === 'menu' ? 'Menus' : 'Drink';
    const selectQuery = selectedType === 'menu' 
    ? 'menu_id, menu_name, category_id' 
    : 'drink_id, drink_name, category_drink_id';
    
    const { data, error } = await supabase
      .from(table)
      .select(selectQuery)
      .eq('is_ingredient', true);
      
    if (error) {
      console.error("Error:", error);
    } else {
      const formattedData = data.map(item => ({
        id: selectedType === 'menu' ? item.menu_id : item.drink_id,
        name: selectedType === 'menu' ? item.menu_name : item.drink_name,
        catId: selectedType === 'menu' ? item.category_id : item.category_drink_id
      }));
      setProductList(formattedData);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      let table = type === 'menu' ? 'Categories' : 'Category_drink';
      let idCol = type === 'menu' ? 'category_id' : 'category_drink_id';
      let nameCol = type === 'menu' ? 'category_name' : 'category_drink_name';

      const { data, error } = await supabase.from(table).select(`${idCol}, ${nameCol}`);
      
      if (!error && data) {
        // ກັ່ນກອງເອົາສະເພາະອັນທີ່ມີຄຳວ່າ "ວັດຖຸດິບ"
        const filtered = data
          .map(c => ({ id: c[idCol], name: c[nameCol] }))
          .filter(c => c.name.includes("ວັດຖຸດິບ"));
        
        setCategories(filtered);
      }
    };

    fetchCategories();
    fetchProducts(type);
    setFormData(prev => ({ ...prev, selected_id: '', item_name: '' }));
    setSelectedCategory(''); 
  }, [type]);

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

  // ຟັງຊັນ Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const selectedProduct = productList.find(i => i.id == formData.selected_id);
     if (!selectedProduct?.catId) {
    alert("ກະລຸນາໄປກຳນົດ Category ໃຫ້ສິນຄ້ານີ້ໃນໜ້າຈັດການສິນຄ້າກ່ອນ!");
    return;
  }
  setLoading(true);

    const payload = { 
      item_name: formData.item_name,
      quantity: parseInt(formData.quantity),
      unit: formData.unit,
      cost_price: parseInt(formData.cost_price),
      supplier: formData.supplier,
      menu_id: type === 'menu' ? formData.selected_id : null,
      drink_id: type === 'drink' ? formData.selected_id : null,
      category_id: type === 'menu' ? selectedProduct?.catId : null,
    category_drink_id: type === 'drink' ? selectedProduct?.catId : null
    };

    if (isEditing) {
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

  const handleAddNewProduct = async () => {
    const table = type === 'menu' ? 'Menus' : 'Drink';
    const nameField = type === 'menu' ? 'menu_name' : 'drink_name';
    const catField = type === 'menu' ? 'category_id' : 'category_drink_id';

    const { error } = await supabase
      .from(table)
      .insert([{ 
        [nameField]: newProductName, 
        is_ingredient: true,
        [catField]: selectedCategory // ໃຊ້ຄ່າທີ່ເລືອກຈາກ Dropdown
      }]);

    if (!error) {
      alert("ເພີ່ມສິນຄ້າໃໝ່ສຳເລັດ!");
      setIsModalOpen(false);
      setNewProductName('');
      fetchProducts(type);
    } else {
      alert("ຜິດພາດ: " + error.message);
    }
  };

  const resetForm = () => {
    setFormData({ item_name: '', quantity: '', unit: 'ແກ້ວ', cost_price: '', supplier: '', selected_id: '' });
    setIsEditing(false);
    setEditId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-lao p-4 md:p-8">
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
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-200 space-y-4">
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
                <label className="text-xs font-bold text-gray-700 ml-2 uppercase">ສິນຄ້າ / ວັດຖຸດິບ</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 ml-2 uppercase">ປະເພດ</label>
                    <select 
                      className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 text-black mt-1"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="menu">ອາຫານ / ວັດຖຸດິບ</option>
                      <option value="drink">ເຄື່ອງດື່ມ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 ml-2 uppercase">ເລືອກລາຍການ</label>
                    <button type="button" onClick={() => setIsModalOpen(true)} className="text-xs text-orange-600 font-bold underline mt-1 block">
                      + ເພີ່ມວັດຖຸດິບໃໝ່
                    </button>
                    <select 
                      required
                      className="w-full p-4 bg-gray-50 rounded-2xl border text-black border-gray-200 mt-1"
                      value={formData.selected_id}
                      onChange={(e) => {
                        const selected = productList.find(i => i.id == e.target.value);
                        setFormData({...formData, item_name: selected?.name, selected_id: e.target.value});
                      }}
                    >
                      <option value="">-- ເລືອກ --</option>
                      {productList.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 ml-2 uppercase">ຈຳນວນ</label>
                  <input 
                    required type="number"
                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 text-gray-900 font-medium focus:ring-2 focus:ring-orange-500 transition-all mt-1 outline-none"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 ml-2 uppercase">ຫົວໜ່ວຍ</label>
                  <select 
                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 text-gray-900 font-medium focus:ring-2 focus:ring-orange-500 transition-all mt-1 outline-none"
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
                    required type="text" inputMode="numeric" pattern="[0-9]*"
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
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              {isEditing ? "ອັບເດດຂໍ້ມູນການນຳເຂົ້າ" : "ບັນທຶກການນຳເຂົ້າ"}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold flex items-center gap-2 ml-2 text-gray-900">
            <History size={18} className="text-orange-500" /> ນຳເຂົ້າຫຼ້າສຸດ
          </h3>
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-sm text-gray-900">{item.item_name}</span>
                  <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-md font-black">+{item.quantity} {item.unit}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-gray-600 uppercase font-bold mt-1">
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  <span className="text-gray-900">{parseInt(item.cost_price || 0).toLocaleString()} KIP</span>
                </div>
                <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-100">
                  <button onClick={() => handleEditSelect(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold flex items-center gap-1">
                    <Edit2 size={14} /> ແກ້ໄຂ
                  </button>
                  <button onClick={() => handleDelete(item.id, item.item_name)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold flex items-center gap-1">
                    <Trash2 size={14} /> ລົບ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && (
  <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-black text-lg text-gray-900">ເພີ່ມວັດຖຸດິບໃໝ່</h2>
        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      {/* ເພີ່ມ Select ໃຫ້ເລືອກຕາຕະລາງທີ່ຈະບັນທຶກ */}
      <div className="mb-4">
        <label className="text-xs font-bold text-gray-700 ml-2 uppercase">ເລືອກປະເພດທີ່ຈະເພີ່ມ:</label>
        <select 
          className="w-full p-4 bg-gray-50 rounded-2xl border text-black border-gray-200 mt-1"
          value={type} // ໃຊ້ state type ທີ່ມີຢູ່ແລ້ວ
          onChange={(e) => setType(e.target.value)}
        >
          <option value="menu">ອາຫານ / ວັດຖຸດິບ</option>
          <option value="drink">ເຄື່ອງດື່ມ/ ວັດຖຸດິບ</option>
        </select>
      </div>

      <div className="mb-4">
  <label className="text-xs font-bold text-gray-700 ml-2 uppercase">ເລືອກໝວດໝູ່:</label>
  <select 
    className="w-full p-4 bg-gray-50 rounded-2xl border text-black border-gray-200 mt-1"
    value={selectedCategory}
    onChange={(e) => setSelectedCategory(e.target.value)}
  >
    <option value="">-- ເລືອກໝວດໝູ່ --</option>
    {categories.map(cat => (
      <option key={cat.id} value={cat.id}>{cat.name}</option>
    ))}
  </select>
</div>
      <input 
        type="text"
        placeholder="ຊື່ວັດຖຸດິບ..."
        className="w-full p-4 bg-gray-50 rounded-2xl border text-black border-gray-200 mb-6 outline-none focus:ring-2 focus:ring-orange-500"
        value={newProductName}
        onChange={(e) => setNewProductName(e.target.value)}
      />
      
      <button 
        onClick={handleAddNewProduct} 
        className="w-full p-4 rounded-2xl bg-gray-900 text-white font-bold hover:bg-black transition-all"
      >
        ບັນທຶກວັດຖຸດິບ
      </button>
    </div>
  </div>
)}
    </div>
  );
}