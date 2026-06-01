import { supabase } from "../../lib/supabase";

//CRUD
//R = Read / Get
export async function fetchData(tablename) {
  const { data: catData, error: catError } = await supabase
    .from(tablename)
    .select("*");
  if (catData) {
    return catData;
  } else {
    return catError;
  }
}

//C = Create / Insert / Add
export async function insertdata(tablename, data) {
  const { data: catData, error: catError } = await supabase
    .from(tablename)
    .insert(data)
    .select("*");
  if (catData) {
    return catData;
  } else {
    return catError;
  }
}

//U = Edit / Update
  // แก้ไขให้รองรับชื่อ ID ของทุกตาราง
export const updateData = async (tableName, recordData, id, itemType) => {
  // ເຊັກວ່າເປັນເຄື່ອງດື່ມ ຫຼື ອາຫານ ເພື່ອໃຊ້ .eq() ໃຫ້ຖືກ Column ID
  const idColumn = itemType === "drink" ? "drink_id" : "menu_id";

  const { data, error } = await supabase
    .from(tableName)
    .update(recordData)
    .eq(idColumn, id) // 🎯 ບອກໃຫ້ຊັດເຈນວ່າຈະແກ້ໄຂແຖວໃດ
    .select();

  if (error) {
    console.error("Error updating data:", error.message);
    return null;
  }
  return data;
};

// D = Delete
export async function deletedata(tablename, condition) {
  // condition ควรเป็น object เช่น { menu_id: 5 }
  const { data, error } = await supabase
    .from(tablename)
    .delete()
    .match(condition); // ใช้ .match เพื่อให้ยืดหยุ่นตามชื่อ ID ที่ส่งมา

  if (error) {
    console.error("Delete Error:", error.message);
    return null;
  }
  return data || true;
}

//Upload
export async function uploadimages(file) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
  const filePath = `${fileName}`;
  const { data, error } = await supabase.storage
    .from("img")
    .upload(filePath, file);
  const {
    data: { publicUrl },
  } = supabase.storage.from("img").getPublicUrl(filePath);

  if (publicUrl) {
    return publicUrl;
  } else {
    console.error("Upload Error:", error.message);
    return null;
  }
}
