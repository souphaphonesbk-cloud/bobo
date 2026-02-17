"use client"; 
import Link from 'next/link';
import { useParams } from 'next/navigation';
const Page = ({}) => {
  const params = useParams(); // ดึง id ออกมาจาก URL
  const foodId = parseInt(params.id); // แปลง id เป็นตัวเลข

  // รายการอาหาร (ควรเป็นชุดเดียวกับหน้าแรก)
  const myFoods = [
    { id: 1, name: "beef noodle soup",laoName: "ເຝີເນື້ອ", price: 80000, img: "/icon/beef-noodle-soup.jpg" },
    { id: 2, name: "Phut tai",laoName: "ຜັດໄທ", price: 79000, img: "/icon/ผัดไทย.png" },
    { id: 3, name: "tom yum koung",laoName: "ຕົ້ມຍຳກຸ້ງ", price: 110000, img: "/icon/ต้มยำกุ้ง.png" },
    { id: 4, name: "Stir fried spyicy frog",laoName: "ຜັດເຜັດກົບ", price: 80000, img: "/icon/ผัดเผัดกบ(1).png"},
  ];

  // ค้นหาข้อมูลอาหารที่ตรงกับ ID ที่กดมา
  const food = myFoods.find((f) => f.id === foodId) || myFoods[0];
  return (
    <div>
      <div className="flex justify-between fixed top-0 w-[100dvw] p-4">
        <Link href="/">
        <button className="btn btn-circle bg-white border-0 p-3">
          <img
          src="/icon/left.svg"
          />
        </button>
       </Link>
        <button className="btn btn-circle bg-white border-0  ">
          <img
          className="w-5"
          src="/icon/heart.svg"
          />
      
        </button>
      </div>
      {/* div 1 */}
      <div 
  className="flex border-2 w-full min-h-screen items-end  bg-center bg-no-repeat bg-amber-300">
 
        {/* <div className="flex border-2 w-full h-[calc(100dvh-40px)]">
   </div> */}
         <div className="absolute top-[60px] left-0 right-0 flex justify-center z-10">
          <div className="w-40 h-40 rounded-full border-2 border-white shadow-xl overflow-hidden  mt-5">
            <img 
            className="w-full h-full object-cover scale-124 "
              src={food.img}
            />
          </div>
        </div>
        {/* div1.1  */}
        <div className="flex flex-col  pt-15  gap-4 bg-white rounded-t-4xl w-full h-[calc(100dvh-200px)] items-start flex-1">
          <div className="overflow-auto flex flex-col justify-center">
            {/* 1.1.1  */}
            <div className="flex  flex-col self-center text-center text-[18px] w-45 h-20 text-black items-center justify-center">
              <span className="font-bold text-lg text-gray-800">{food.name}</span>
                    <span className="text-gray-500 text-sm font-medium">{food.laoName}</span>
            </div>

            {/* 1.1.2  */}
            <div className="flex gap-3 self-center mt-1 mb-1   w-80 !h-[40px] justify-center">
              <div className="flex items-center  p-1">
        
          <img
          className="w-4"
          src="/icon/hour.svg"
          />
         <label className="text-black font-bold ml-1">50 min</label>

        
         </div>
        <div className="flex items-center  p-1">
          <img
          className="w-4"
          src="/icon/star.svg"
          />
        <label className="text-black font-bold ml-1">4.8 </label>
              </div>
               <div className="flex items-center  p-1">
          <img
          className="w-4"
          src="/icon/fire.svg"
          />
        <label className="text-black font-bold ml-1">325 kcal </label>
              </div>
            </div>
            {/* 1.1.3 */}
            <div className="flex  self-center justify-center mb-5 border-0 mt-2  border-black w-45 h-10 bg-gray-200 rounded-2xl">
              <div className="flex items-center  p-1">
                <label className=" text-black font-bold ml-5">{food.price.toLocaleString()}kip</label>
                <div className="flex items-center justify-center gap-1 mb-5 mt-5 border-0 mt-2 border-black w-22 h-10 ml-5 bg-yellow-400 rounded-2xl">
              <button className=" border-0 bg-yellow-400 border-black  ">
                <div className="flex items-center ">
                  <img
                  className="w-5 bg-yellow-400 "
                  src="/icon/delete.svg"/>
                
                </div>
               </button>
               <input 
               className="text-black w-5 ml-2 "
               value={1}
               />
              

               <button className="border-0  bg-yellow-400 border-black  ">
                <div className="flex items-center  p-1">
                  <img
                  className="w-4 bg-yellow-400"
                  src="/icon/plus.svg"/>
                
                </div>
               </button>
                
                
                </div>
              </div>
            </div>
            {/* 1.1.4 */}
            <label className="text-black font-bold ml-4">Ingredients</label>
            
            <div className="flex w-[99dvw] justify-center mb-12">
              <div className="flex border-0 w-80 h-20 bg-white">

                <div className="flex flex-col rounded-t-4xl rounded-b-4xl  w-18 h-23 justify-center hover:shadow-2xl shadow-sm"> 
                  <img
                  className="w-7 self-center"
                  src="/icon/noodle.svg"/> 
                  <label className="text-black text-center w-full font-bold text-[14px] ">noodle</label>
                </div>
                <div className="flex ml-2 flex-col rounded-t-4xl rounded-b-4xl  w-18 h-23 justify-center hover:shadow-2xl shadow-sm">
                  <img
                  className="w-7 self-center"
                  src="/icon/shrimp.svg"/> 
                  <label className="text-black text-center w-full font-bold text-[14px]">shrimp</label>
                </div>
                <div className="flex ml-2 flex-col rounded-t-4xl rounded-b-4xl  w-18 h-23 justify-center hover:shadow-2xl shadow-sm">
                  <img
                  className="w-7 self-center"
                  src="/icon/egg.svg"/> 
                  <label className="text-black text-center w-full font-bold text-[14px] ">egg</label>
                </div>
                <div className="flex ml-2 flex-col rounded-t-4xl rounded-b-4xl  w-18 h-23 justify-center hover:shadow-2xl shadow-sm">
                 <img
                  className="w-7 self-center"
                  src="/icon/scallion.svg"/> 
                  <label className="text-black text-center w-full font-bold text-[14px] ">scallion</label> 
                </div>
              </div>
            </div>
            {/* 1.1.5 */}
            
              <label className="text-black font-bold ml-4">About</label>
            
            <div className="flex w-[99dvw] justify-center">
              <div className="flex  w-70 h-10 text-yellow-600">(Some dishes may take longer to prepare We apologize for the delay and appreciate your patience). </div>
            </div>
           {/* ปุ่มลอย */}
          
         <div className="fixed bottom-8 right-6 z-50">
           <Link href="/my-oder/">
            <button className="flex items-center bg-yellow-400 p-1.5 pl-4 rounded-full shadow-lg hover:bg-yellow-500 transition-colors border-0">
           <div className="mr-3">
           <img 
        src="/icon/paper-bag.svg"  
        className="w-6 h-6" 
        alt="cart-icon" 
      />
    </div>
   
    <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-inner">
      <span className="text-black font-bold text-lg">1</span>
    </div>
            </button>
            </Link>
           </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
