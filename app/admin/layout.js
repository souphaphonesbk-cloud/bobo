import Sidebar from "../compronent/sidebar"; // ກວດສອບຊື່ Folder ໃຫ້ຖືກ (component/sidebar)

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 1. Sidebar: ຈະຢູ່ເບື້ອງຊ້າຍຄົງທີ່ */}
      <Sidebar />
      <main className="w-full">{children}</main>
    </div>
  );
}
