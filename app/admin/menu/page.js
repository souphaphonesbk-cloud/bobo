"use client";
import React from "react";
import {
  fetchData,
  insertdata,
  uploadimages,
  updateData,
  deletedata,
} from "../../services/actions";
import { cn } from "../../../lib/utils/cn";
import {
  Search,
  X,
  Bell,
  Plus,
  Trash2,
  Pencil,
  Save,
  Image as ImageIcon,
  Eye,
  EyeOff
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function CounterPage() {
  const [itemType, setItemType] = React.useState("food"); 
  const [categories, setCategories] = React.useState([]); 
  const [editId, setEditId] = React.useState(null); 
  const [preview, setPreview] = React.useState(null);
  const [imagelink, setimagelink] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [files, setfiles] = React.useState([]);
  const [statusupload, setstatusupload] = React.useState(false);
  const [isedit, setisedit] = React.useState(false);
  const [foods, setFoods] = React.useState([]); 
  const [searchQuery, setSearchQuery] = React.useState(""); 

  const [fromData, setfromData] = React.useState({
    name: "",
    laoName: "",
    category_id: "",    
    category_drink_id: "",  
    price: "",
  });

  const [isCatModalOpen, setIsCatModalOpen] = React.useState(false);
  const [newCatName, setNewCatName] = React.useState("");

  // 🌟 ຟັງຊັນສຳລັບ ເປີດ-ປິດ ເມນູອາຫານ/ເຄື່ອງດື່ມ (Toggle Availability)
  const toggleAvailability = async (item) => {
    const isDrinkItem = Object.prototype.hasOwnProperty.call(item, "drink_id") || item.drink_name !== undefined;
    const tableName = isDrinkItem ? "Drink" : "Menus";
    const idColumn = isDrinkItem ? "drink_id" : "menu_id";
    const currentId = isDrinkItem ? item.drink_id : item.menu_id;
    
    // ສະຫຼັບສະຖານະ (ຖ້າບໍ່ມີຄ່າ ຫຼື ເປັນ true ໃຫ້ປ່ຽນເປັນ false, ຖ້າເປັນ false ໃຫ້ປ່ຽນເປັນ true)
    const newStatus = item.is_available === false ? true : false;

    try {
      const { error } = await supabase
        .from(tableName)
        .update({ is_available: newStatus })
        .eq(idColumn, currentId);

      if (!error) {
        // ອັບເດດ State ໃນໜ້າຈໍທັນທີໂດຍບໍ່ຕ້ອງ Reload ໜ້າ
        setFoods((prev) =>
          prev.map((f) => {
            const fId = isDrinkItem ? f.drink_id : f.menu_id;
            if (fId === currentId) {
              return { ...f, is_available: newStatus };
            }
            return f;
          })
        );
      } else {
        alert("ບໍ່ສາມາດປ່ຽນສະຖານະໄດ້: " + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName) return alert("ກະລຸນາໃສ່ຊື່ໝວດໝູ່");
    
    const tableName = itemType === "food" ? "Categories" : "Category_drink";
    const nameColumn = itemType === "food" ? "category_name" : "category_drink_name";
    
    const { error } = await supabase.from(tableName).insert([{ [nameColumn]: newCatName }]);
    
    if (!error) {
      setNewCatName("");
      setIsCatModalOpen(false);
      updateCategorySelect(itemType); 
    } else {
      alert("ຜິດພາດ: " + error.message);
    }
  };

  const updateCategorySelect = async (type) => {
    if (type === "food") {
      const catData = await fetchData("Categories");
      if (catData && catData.length > 0) {
        setCategories(catData);
        setfromData(prev => ({ 
          ...prev, 
          category_id: String(catData[0].category_id),
          category_drink_id: "" 
        }));
      } else {
        setCategories([]);
      }
    } else {
      const catDrinkData = await fetchData("Category_drink");
      if (catDrinkData && catDrinkData.length > 0) {
        setCategories(catDrinkData);
        setfromData(prev => ({ 
          ...prev, 
          category_drink_id: String(catDrinkData[0].category_drink_id),
          category_id: "" 
        }));
      } else {
        setCategories([]);
      }
    }
  };

  React.useEffect(() => {
    if (!isedit) {
      updateCategorySelect(itemType);
    }
  }, [itemType, isedit]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setfiles(file);
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setstatusupload(false);
    }
  };

  const handleTypeChange = (type) => {
    setItemType(type);
  };

  const handleEdit = async (item) => {
    const isDrinkItem = Object.prototype.hasOwnProperty.call(item, "drink_id") || item.drink_name !== undefined;
    const currentType = isDrinkItem ? "drink" : "food";
    
    setisedit(true); 
    setItemType(currentType);
    setEditId(isDrinkItem ? item.drink_id : item.menu_id);

    if (currentType === "food") {
      const catData = await fetchData("Categories");
      setCategories(catData || []);
      setfromData({
        name: item.menu_name,
        laoName: item.laoName || "",
        category_id: String(item.category_id),
        category_drink_id: "", 
        price: String(item.price),
      });
    } else {
      const catDrinkData = await fetchData("Category_drink");
      setCategories(catDrinkData || []);
      setfromData({
        name: item.drink_name,
        laoName: item.laoName || "",
        category_id: "", 
        category_drink_id: String(item.category_drink_id),
        price: String(item.price),
      });
    }

    setPreview(item.image);
    setimagelink(item.image);
    setstatusupload(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (item) => {
    if (window.confirm("ແນ່ໃຈບໍ່ທີ່ຈະລົບຂໍ້ມູນນີ້?")) {
      const isDrinkItem = Object.prototype.hasOwnProperty.call(item, "drink_id") || item.drink_name !== undefined;
      const tableName = isDrinkItem ? "Drink" : "Menus";
      const matchCondition = isDrinkItem ? { drink_id: item.drink_id } : { menu_id: item.menu_id };

      const result = await deletedata(tableName, matchCondition);
      if (result) {
        refreshMenus();
      }
    }
  };

  const removeImage = (e) => {
    e.preventDefault();
    setstatusupload(false);
    setPreview(null);
    setfiles([]);
    setimagelink(null);
  };

  const adddata = async () => {
    const currentCategoryId = itemType === "food" ? fromData.category_id : fromData.category_drink_id;

    if (!fromData.name || !fromData.price || !currentCategoryId) {
      alert("กະລຸນາກອກຂໍ້ມູນໃຫ້ຄົບຖ້ວນ (ຊື່, ລາຄາ, ໝວດໝູ່)");
      return;
    }

    setLoading(true);
    let finalImageUrl = imagelink;

    if (files && files.name && !statusupload) {
      const urlimg = await uploadimages(files);
      if (urlimg) {
        finalImageUrl = urlimg;
      } else {
        alert("ເກີດຂໍ້ຜິດພາດໃນການອັບໂຫຼດຮູບພາບ");
        setLoading(false);
        return;
      }
    }

    const targetTable = itemType === "food" ? "Menus" : "Drink";
    const parsedCategoryId = Number(currentCategoryId);
    
    if (isNaN(parsedCategoryId)) {
      alert("ໝວດໝູ່ບໍ່ຖືກຕ້ອງ, ກະລຸນາເລືອກໝວດໝູ່ໃໝ່ອີກຄັ້ງ");
      return;
    }

    const recordData = itemType === "food" ? {
      menu_name: fromData.name,
      price: Number(fromData.price),
      laoName: fromData.laoName,
      category_id: parsedCategoryId,
      image: finalImageUrl,
    } : {
      drink_name: fromData.name,
      price: Number(fromData.price),
      laoName: fromData.laoName,
      category_drink_id: parsedCategoryId, 
      image: finalImageUrl,
    };

    try {
      if (isedit) {
        const editdata = await updateData(targetTable, recordData, editId, itemType);
        if (editdata) {
          resetForm();
          await refreshMenus();
        } else {
          alert("ບໍ່ສາມາດແກ້ໄຂຂໍ້ມູນໄດ້");
        }
      } else {
        const menudata = await insertdata(targetTable, [recordData]);
        if (menudata) {
          resetForm();
          await refreshMenus();
        } else {
          alert("ບໍ່ສາມາດບັນທຶກຂໍ້ມູນໄດ້");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setfromData({ name: "", laoName: "", category_id: "", category_drink_id: "", price: "" });
    setPreview(null);
    setimagelink(null);
    setfiles([]);
    setstatusupload(false);
    setisedit(false);
    setEditId(null);
    updateCategorySelect(itemType); 
  };

  const refreshMenus = async () => {
    try {
      const { data: menuList } = await supabase  
        .from('Menus')
        .select('*')
        .or('is_ingredient.eq.false,is_ingredient.is.null');

      const { data: drinkList } = await supabase
        .from('Drink')
        .select('*')
        .or('is_ingredient.eq.false,is_ingredient.is.null');

      const safeMenus = Array.isArray(menuList) ? menuList : [];
      const safeDrinks = Array.isArray(drinkList) ? drinkList : [];
      
      setFoods([...safeMenus, ...safeDrinks]);
    } catch (error) {
      console.error(error);
    }
  };

  React.useEffect(() => {
    refreshMenus();
  }, []);

  const filteredFoods = foods.filter((item) => {
    const isDrinkItem = Object.prototype.hasOwnProperty.call(item, "drink_id") || item.drink_name !== undefined;
    const name = (isDrinkItem ? item.drink_name : item.menu_name) || "";
    const laoName = item.laoName || "";
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || laoName.toLowerCase().includes(query);
  });

  return (
    <div className="flex min-h-screen bg-gray-50 font-lao text-slate-800">
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ຄົ້ນຫາຊື່ເມນູ ຫຼື ພາສາລາວ..."
              className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-orange-200 outline-none text-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-orange-500 transition-all">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-bold">DB</div>
              <span className="text-sm font-bold text-gray-700">Counter Admin</span>
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Form Section */}
          <div className="w-full lg:w-[450px] bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-gray-800">
              <Plus className="text-orange-500" size={24} /> {isedit ? "ແກ້ໄຂເມນູ" : "ເພີ່ມເມນູໃໝ່"}
            </h2>

            <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl mb-6">
              <button
                type="button"
                disabled={isedit} 
                onClick={() => handleTypeChange("food")}
                className={cn(
                  "flex-1 py-2 text-sm font-bold rounded-xl transition-all",
                  itemType === "food" ? "bg-white text-orange-500 shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
              >
                🍽️ ໝວດອາຫານ
              </button>
              <button
                type="button"
                disabled={isedit}
                onClick={() => handleTypeChange("drink")}
                className={cn(
                  "flex-1 py-2 text-sm font-bold rounded-xl transition-all",
                  itemType === "drink" ? "bg-white text-orange-500 shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
              >
                🥤 ໝວດເຄື່ອງດື່ມ
              </button>
            </div>

            <div className="space-y-6">
              {/* Image Upload */}
              <label className={`border-2 border-dashed rounded-[30px] p-12 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden ${preview ? "border-orange-200 bg-orange-50" : "border-gray-100 bg-gray-50/30"}`}>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                {preview ? (
                  <div className="relative w-full h-full flex flex-col items-center">
                    <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-2xl mb-2" />
                    <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors">
                      <X size={16} />
                    </button>
                    <p className="text-xs text-orange-600 font-medium">ຄລິກເພື່ອປ່ຽນຮູບໃໝ່</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                      <ImageIcon size={32} className="text-gray-300" />
                    </div>
                    <p className="font-bold text-gray-500 text-sm">ກົດເພື່ອອັບໂຫຼດຮູບ</p>
                    <p className="text-[12px] text-gray-400 mt-1 uppercase">PNG, JPG ບໍ່ເກີນ 5MB</p>
                  </>
                )}
              </label>

              {/* Inputs */}
              <div>
                <label className="text-sm font-bold text-gray-400 mb-2 block ml-1 uppercase">Name (English)</label>
                <input
                  onChange={(e) => setfromData({ ...fromData, name: e.target.value })}
                  value={fromData.name || ""}
                  type="text"
                  placeholder="Orange Juice "
                  className="w-full p-4 bg-gray-50/50 border-none rounded-2xl focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-400 mb-2 block ml-1 uppercase">ຊື່ລາຍການ (ພາສາລາວ)</label>
                <input
                  onChange={(e) => setfromData({ ...fromData, laoName: e.target.value })}
                  value={fromData.laoName || ""}
                  type="text"
                  placeholder="ຜັດເຕົາຫູ່ຊົງເຄື່ອງ"
                  className="w-full p-4 bg-gray-50/50 border-none rounded-2xl focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-gray-400 uppercase">ໝວດໝູ່</label>
                    <button 
                      type="button" 
                      onClick={() => setIsCatModalOpen(true)} 
                      className="text-[10px] font-bold text-orange-500 hover:underline cursor-pointer"
                    >
                      + ເພີ່ມໃໝ່
                    </button>
                  </div>
                  <select
                    onChange={(e) => {
                      if (itemType === "food") {
                        setfromData({ ...fromData, category_id: e.target.value });
                      } else {
                        setfromData({ ...fromData, category_drink_id: e.target.value });
                      }
                    }}
                    value={itemType === "food" ? fromData.category_id : fromData.category_drink_id}
                    className="w-full p-4 bg-gray-50/50 border-none rounded-2xl focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium cursor-pointer"
                  >
                    {categories.map((x, index) => {
                      const idValue = itemType === "food" ? x.category_id : x.category_drink_id;
                      const nameValue = itemType === "food" ? x.category_name : x.category_drink_name;
                      return (
                        <option key={index} value={String(idValue)}>
                          {nameValue}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-400 mb-2 block ml-1 uppercase">ລາຄາ (KIP)</label>
                  <input
                    onChange={(e) => setfromData({ ...fromData, price: e.target.value })}
                    value={fromData.price || ""}
                    type="number"
                    placeholder="0"
                    className="w-full p-4 bg-gray-50/50 border-none rounded-2xl focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={adddata}
                disabled={loading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white py-5 rounded-[20px] font-bold mt-4 flex items-center justify-center gap-3 transition-all shadow-lg shadow-yellow-200 active:scale-[0.98]"
              >
                <Save size={20} /> {loading ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກຂໍ້ມູນ"}
              </button>
              
              {isedit && (
                <button type="button" onClick={resetForm} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-600 py-3 rounded-[20px] font-bold text-sm transition-all">
                  ຍົກເລີກການແກ້ໄຂ
                </button>
              )}
            </div>
          </div>

          {/* List Section */}
          <div className="flex-1 h-screen flex flex-col overflow-hidden bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
            <h1 className="text-gray-800 font-bold text-xl">• ລາຍການທັງໝົດ ({filteredFoods.length} ລາຍການ)</h1>
            <div className="grid flex-1 overflow-y-auto grid-cols-1 gap-4 mt-6 pb-24 no-scrollbar">
              {filteredFoods.map((item, index) => {
                const isDrinkItem = Object.prototype.hasOwnProperty.call(item, "drink_id") || item.drink_name !== undefined;
                
                // 🌟 ກວດເຊັກສະຖານະການ ເປີດ-ປິດ (ຄ່າເລີ່ມຕົ້ນຖ້າເປັນ null ຫຼື undefined ໃຫ້ເປັນ true)
                const isAvailable = item.is_available !== false;

                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-5 p-5 border rounded-[24px] transition-all group",
                      isAvailable ? "border-gray-50 hover:bg-gray-50/50" : "border-gray-200 bg-gray-50/70 opacity-75"
                    )}
                  >
                    <div className="relative w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300 overflow-hidden flex-shrink-0">
                      <img className={cn("w-full h-full object-cover", !isAvailable && "grayscale brightness-70")} src={item.image || "/icon/no-image.png"} alt="preview" />
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-[10px] text-white font-bold bg-red-500 px-1.5 py-0.5 rounded-md">ໝົດ</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <h3 className={cn("font-bold flex items-center gap-2", isAvailable ? "text-gray-800" : "text-gray-400 line-through")}>
                            {isDrinkItem ? item.drink_name : item.menu_name}
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-bold",
                              isDrinkItem ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                            )}>
                              {isDrinkItem ? "ເຄື່ອງດື່ມ" : "อาหาร"}
                            </span>
                          </h3>
                          <span className="text-gray-500 text-sm font-medium">{item.laoName}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-gray-500 mt-1">
                        <span className={cn("font-bold", isAvailable ? "text-yellow-500" : "text-gray-400")}>
                          {item.price?.toLocaleString()} kip
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {/* 🌟 ປຸ່ມ Eye/EyeOff ສຳລັບ ເປີດ-ປິດ ເມນູ */}
                      <button 
                        type="button" 
                        onClick={() => toggleAvailability(item)} 
                        title={isAvailable ? "ກົດເພື່ອປິດເມນູນີ້" : "ກົດເພື່ອເປີດເມນູນີ້"}
                        className={cn(
                          "p-2 rounded-xl border transition-colors",
                          isAvailable 
                            ? "border-gray-100 bg-white text-green-600 hover:bg-green-50" 
                            : "border-gray-300 bg-gray-200 text-red-500 hover:bg-red-100"
                        )}
                      >
                        {isAvailable ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>

                      <button type="button" onClick={() => handleEdit(item)} className="p-2 rounded-xl border border-gray-100 bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <Pencil size={18} />
                      </button>
                      <button type="button" onClick={() => handleDelete(item)} className="p-2 rounded-xl border border-gray-100 bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredFoods.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  ບໍ່ພົບຂໍ້ມູນທີ່ທ່ານຄົ້ນຫາ
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {isCatModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-[30px] w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-4">ເພີ່ມໝວດໝູ່ ({itemType === "food" ? "ອາຫານ" : "ເຄື່ອງດື່ມ"})</h3>
            <input 
              className="w-full p-4 bg-gray-50 rounded-2xl mb-4 outline-none border focus:border-orange-200"
              placeholder="ໃສ່ຊື່ໝວດໝູ່..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setIsCatModalOpen(false)} 
                className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600"
              >
                ຍົກເລີກ
              </button>
              <button 
                onClick={handleAddCategory} 
                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold"
              >
                ບັນທຶກ
              </button>
            </div>
          </div>
        </div>
      )}      
    </div>
  );
}