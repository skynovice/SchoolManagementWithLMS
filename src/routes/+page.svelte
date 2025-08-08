<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import { goto } from '$app/navigation';

  // Accept params prop to avoid warnings
  export const params = {};

  let user = null;
  let loading = true;

  onMount(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      user = session?.user;
      
      if (user) {
        goto('/dashboard');
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
    loading = false;
  });
</script>

<!-- Hero Section -->
<div class="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white -m-5 mb-0 overflow-hidden">
  <!-- Background Pattern -->
  <div class="absolute inset-0 bg-black opacity-10"></div>
  <div class="absolute inset-0" style="background-image: url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%23ffffff&quot; fill-opacity=&quot;0.05&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;2&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
  
  <div class="relative z-10 text-center py-20 px-5">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-6xl md:text-7xl font-bold mb-6 leading-tight">
        ระบบจัดการ<br>
        <span class="text-gold-400">โรงเรียน</span>
      </h1>
      <p class="text-xl md:text-2xl mb-10 opacity-90 leading-relaxed max-w-2xl mx-auto">
        ระบบจัดการการเรียนการสอนที่ครบครันและทันสมัย<br>
        สำหรับโรงเรียนยุคดิจิทัล
      </p>
      <div class="flex justify-center">
        <a href="/login" class="bg-gold-500 hover:bg-gold-600 text-white px-10 py-4 rounded-xl text-lg font-semibold inline-block hover:-translate-y-1 transition-all shadow-2xl hover:shadow-gold-500/25">
          🚀 เข้าสู่ระบบ
        </a>
      </div>
    </div>
  </div>
</div>

<!-- Features Section -->
<div class="py-20 bg-gradient-to-b from-gray-50 to-white">
  <div class="max-w-7xl mx-auto px-5">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-primary-800 mb-4">ฟีเจอร์หลัก</h2>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">ระบบครบครันที่ตอบสนองทุกความต้องการของสถานศึกษา</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div class="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
        <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-2xl text-white mb-6 group-hover:scale-110 transition-transform">
          🎓
        </div>
        <h3 class="text-2xl font-bold text-primary-800 mb-4">ระบบ LMS</h3>
        <p class="text-gray-600 leading-relaxed">ระบบการเรียนรู้ออนไลน์ที่ครูสามารถสร้างเนื้อหาและเชิญนักเรียนเข้าเรียนได้อย่างง่ายดาย</p>
      </div>
      
      <div class="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
        <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-2xl text-white mb-6 group-hover:scale-110 transition-transform">
          👥
        </div>
        <h3 class="text-2xl font-bold text-primary-800 mb-4">จัดการผู้ใช้</h3>
        <p class="text-gray-600 leading-relaxed">รองรับผู้ใช้หลายระดับ: Super Admin, Admin, Teacher, Parent, Student พร้อมระบบสิทธิ์ที่ครบครัน</p>
      </div>
      
      <div class="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
        <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl text-white mb-6 group-hover:scale-110 transition-transform">
          📊
        </div>
        <h3 class="text-2xl font-bold text-primary-800 mb-4">รายงานครบครัน</h3>
        <p class="text-gray-600 leading-relaxed">รายงานผลการเรียน สถิติการใช้งาน และข้อมูลต่างๆ ที่จำเป็นสำหรับการตัดสินใจ</p>
      </div>
      
      <div class="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
        <div class="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center text-2xl text-white mb-6 group-hover:scale-110 transition-transform">
          💬
        </div>
        <h3 class="text-2xl font-bold text-primary-800 mb-4">ระบบสื่อสาร</h3>
        <p class="text-gray-600 leading-relaxed">ส่งข้อความระหว่างครู ผู้ปกครอง และนักเรียนได้อย่างสะดวก พร้อมระบบแจ้งเตือน</p>
      </div>
      
      <div class="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
        <div class="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-2xl text-white mb-6 group-hover:scale-110 transition-transform">
          🏫
        </div>
        <h3 class="text-2xl font-bold text-primary-800 mb-4">จัดการโซนและกลุ่ม</h3>
        <p class="text-gray-600 leading-relaxed">แบ่งนักเรียนเป็นโซนและกลุ่มย่อยเพื่อการจัดการที่มีประสิทธิภาพและเป็นระบบ</p>
      </div>
      
      <div class="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
        <div class="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center text-2xl text-white mb-6 group-hover:scale-110 transition-transform">
          📚
        </div>
        <h3 class="text-2xl font-bold text-primary-800 mb-4">จัดการวิชาเรียน</h3>
        <p class="text-gray-600 leading-relaxed">ระบบจัดการวิชาเรียนและหลักสูตรที่ยืดหยุ่น รองรับการปรับแต่งตามความต้องการ</p>
      </div>
    </div>
  </div>
</div>