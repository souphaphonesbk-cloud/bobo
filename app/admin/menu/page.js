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
  Wallet,
  User,
  Pencil,
  Search,
  X,
  Bell,
  TrendingUp,
  Users,
  ShoppingBag,
  Plus,
  Trash2,
  Edit3,
  Save,
  Image as ImageIcon,
  BarChart3,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

export default function CounterPage() {
  const [activeTab, setActiveTab] = React.useState("home");
  const [categories, setCategories] = React.useState([]);
  const [editId, setEditId] = React.useState(null); // ใช้เก็บ ID ที่กำลังแก้ไข
  const [preview, setPreview] = React.useState(null);
  const [imagelink, setimagelink] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [files, setfiles] = React.useState([]);
  const [statusupload, setstatusupload] = React.useState(false);
  const [isedit, setisedit] = React.useState(false);
    const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [foods, setFoods] = React.useState([]);
  const [fromData, setfromData] = React.useState({
    name: "",
    laoName: "",
    category_id: 0,
    price: "",
  });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setfiles(file);
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  };

  const handleEdit = (food) => {
    setEditId(food.menu_id);// จำ ID ไว้แก้ไข
    console.log(food)
    setisedit(true); 
    setfromData({
      name: food.menu_name,
      laoName: food.laoName || food.laoname || "",
      category_id: food.category_id,
      price: food.price,
    });
    setPreview(food.image);
    setimagelink(food.image);
    setstatusupload(true);
    window.scrollTo({ top: 0, behavior: "smooth" }); // เลื่อนหน้าจอขึ้นไปที่ฟอร์ม
  };

  const handleDelete = async (id) => {
    if (window.confirm("ແນ່ໃຈບໍ່ທີ່ຈະລົບຂໍ້ມູນນີ້?")) {
      const result = await deletedata("Menus", { menu_id: id });
      if (result) {
        alert("ລົບຂໍ້ມູນສຳເລັດ!");
        refreshMenus();
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const urlimg = await uploadimages(files);
    if (urlimg) {
      setLoading(false);
      setstatusupload(true);
      setimagelink(urlimg);
      console.log(urlimg);
      // alert("ບັນທຶກຮູບພາບສຳເລັດ!");
    }
  };

  const removeImage = (e) => {
    e.preventDefault();
    setstatusupload(false);
    setPreview(null);
  };

 const getdata = async () => {
      const categoriesdata = await fetchData("Categories");
      setCategories(categoriesdata);
    }


  const adddata = async () => {
    //edit data
    if (isedit) {
    const editdata = await updateData("Menus",[
      {
          menu_name: fromData.name,
          price: fromData.price,
          laoName: fromData.laoName,
          category_id: Number(fromData.category_id),
          image: imagelink,
        }, 
    ],editId
   
    )

    console.log(editdata)

    } 
    // add new data
    else {
      const menudata = await insertdata("Menus", [
        {
          menu_name: fromData.name,
          price: fromData.price,
          laoName: fromData.laoName,
          category_id: Number(fromData.category_id),
          image: imagelink,
        },
      ]);

      if (menudata) {
        setfromData({
          name: "",
          laoName: "",
          category_id: 0,
          price: "",
        });
        setstatusupload(false);
        await refreshMenus();
      }
      console.log(menudata);
    }

    
  };


  const refreshMenus = async () => {
    const menuList = await fetchData("Menus");
    if (menuList) {
      setFoods(menuList);
    }
  };

  React.useEffect(() => {
    refreshMenus();
    getdata();
  }, [refreshMenus]);

  const filteredFoods =
    selectedCategory === "All" || selectedCategory === "Recommend"
      ? foods
      : foods.filter((food) => food.category === selectedCategory);

  return (
    <div className="flex min-h-screen bg-gray-50 font-lao text-slate-800">
      {/* 2. Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Top Header Section (Search & Profile) */}
        <header className="flex items-center justify-between mb-10">
          <div className="relative w-full max-w-xl">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
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
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-bold">
                DB
              </div>
              <span className="text-sm font-bold text-gray-700">
                David Brown
              </span>
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
              <label
                className={`border-2 border-dashed rounded-[30px] p-12 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden ${preview ? "border-orange-200 bg-orange-50" : "border-gray-100 bg-gray-50/30"}`}
              >
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />

                {/* ສ່ວນສະແດງຜົນ: ຖ້າມີຮູບໃຫ້ໂຊຮູບ, ຖ້າບໍ່ມີໃຫ້ໂຊໄອຄອນອັບໂຫຼດ */}
                {preview ? (
                  <div className="relative w-full h-full flex flex-col items-center">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-2xl mb-2"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                    <p className="text-xs text-orange-600 font-medium">
                      ຄລິກເພື່ອປ່ຽນຮູບໃໝ່
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                      <ImageIcon size={32} className="text-gray-300" />
                    </div>
                    <p className="font-bold text-gray-500 text-sm">
                      ກົດເພື່ອອັບໂຫຼດຮູບ
                    </p>
                    <p className="text-[12px] text-gray-400 mt-1 uppercase">
                      PNG, JPG ບໍ່ເກີນ 5MB
                    </p>
                  </>
                )}
              </label>

              {preview && (
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className={cn(
                    "mt-6 w-full py-3 disabled:bg-gray-300 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg ",
                    statusupload
                      ? "bg-green-500 hover:bg-green-600 shadow-green-200"
                      : "bg-orange-500 hover:bg-orange-600 shadow-orange-200",
                  )}
                >
                  {loading ? (
                    <>
                      <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                      ກຳລັງບັນທຶກ...
                    </>
                  ) : statusupload ? (
                    "ບັນທຶກສຳເຫລັດ"
                  ) : (
                    "ບັນທຶກຂໍ້ມູນ"
                  )}
                </button>
              )}

              {/* 2. ຊື່ລາຍການ */}
              <div>
                <label className="text-sm font-bold text-gray-400 mb-2 block ml-1 uppercase">
                  Name food
                </label>
                <input
                  onChange={(e) =>
                    setfromData({ ...fromData, name: e.target.value })
                  }
                  value={fromData.name || ""}
                  type="text"
                  placeholder="beef noodle soup"
                  className="w-full p-4 bg-gray-50/50 border-none rounded-2xl focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-400 mb-2 block ml-1 uppercase">
                  ຊື່ລາຍການ
                </label>
                <input
                  onChange={(e) =>
                    setfromData({ ...fromData, laoName: e.target.value })
                  }
                  value={fromData.laoName || ""}
                  type="text"
                  placeholder="ເຝີເນື້ອ"
                  className="w-full p-4 bg-gray-50/50 border-none rounded-2xl focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium"
                />
              </div>

              {/* 3. ໝວດໝູ່ ແລະ ລາຄາ (Grid 2 Cols) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-400 mb-2 block ml-1 uppercase">
                    ໝວດໝູ່
                  </label>
                  <select
                    onChange={(e) =>
                      setfromData({ ...fromData, category_id: e.target.value })
                    }
                    value={fromData.category_id}
                    className="w-full p-4 bg-gray-50/50 border-none rounded-2xl focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium cursor-pointer"
                  >
                    {categories.map((x, index) => {
                      return (
                        <option key={index} value={x.category_id}>
                          {x.category_name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-400 mb-2 block ml-1 uppercase">
                    ລາຄາ (KIP)
                  </label>
                  <input
                    onChange={(e) =>
                      setfromData({ ...fromData, price: e.target.value })
                    }
                    value={fromData.price || ""}
                    type="number"
                    placeholder="0"
                    className="w-full p-4 bg-gray-50/50 border-none rounded-2xl focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <button
                onClick={adddata}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-5 rounded-[20px] font-bold mt-4 flex items-center justify-center gap-3 transition-all shadow-lg shadow-yellow-200 active:scale-[0.98]"
              >
                <Save size={20} /> ບັນທຶກ
              </button>
            </div>
          </div>

          {/* Right Side: List Section */}
          <div className="flex-1 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 w-50 ">
            <h1 className="text-gray-800 font-bold text-xl ">ລາຍການທັງໝົດ</h1>
            <h2 className="text-sm font-bold text-gray-800 mb-8"></h2>
            <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl overflow-auto hover:text-gray-900 "></div>
            <div className="grid grid-cols-1 gap-4 ">
              {filteredFoods.map((food) => (
                <div
                  key={food.menu_id}
                  className="flex items-center gap-5 p-5 border border-gray-50 rounded-[24px] hover:bg-gray-50/50 transition-all group"
                >
                  {/* ຮູບພາບອາຫານ */}
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300">
                    <img
                      className="w-full h-full object-cover scale-120"
                      src={food.image}
                      alt="food"
                    />
                  </div>

                  {/* ລາຍລະອຽດຊື່ ແລະ ລາຄາ */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col ">
                        <h3 className="font-bold text-gray-800">
                          {food.menu_name}
                        </h3>
                        <span className="text-gray-500 text-sm font-medium">
                          {food.laoName}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between text-gray-500 ">
                      <span className="font-bold text-yellow-500">
                        {food.price.toLocaleString()} kip
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {/* ປຸ່ມແກ້ໄຂ */}
                    <button
                      onClick={() => handleEdit(food)}
                      className={cn(
                        "p-2 rounded-xl border border-gray-100 bg-white text-gray-600",
                        "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-colors",
                      )}
                    >
                      <Pencil size={18} />
                    </button>
                    {/* ປຸ່ມລົບ */}
                    <button
                      onClick={() => handleDelete(food.menu_id)}
                      className={cn(
                        "p-2 rounded-xl border border-gray-100 bg-white text-gray-600",
                        "hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors",
                      )}
                    >
                      <Trash2 size={18} />
                    </button>
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
