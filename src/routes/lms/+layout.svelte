<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import { page } from '$app/stores';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';

  let user = null;
  let profile = null;
  let loading = true;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      user = session.user;
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      profile = data;
    }
    
    loading = false;
  });
</script>

{#if loading}
  <div class="flex justify-center items-center py-12">
    <LoadingSpinner size="lg" text="กำลังโหลดระบบ LMS..." />
  </div>
{:else if !user}
  <!-- Redirect to login if not authenticated -->
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <div class="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto text-center">
      <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span class="text-2xl">🔒</span>
      </div>
      <h2 class="text-2xl font-bold text-gray-900 mb-4">เข้าสู่ระบบ LMS</h2>
      <p class="text-gray-600 mb-6">
        ระบบ LMS เฉพาะสำหรับสมาชิกที่ลงทะเบียนแล้วเท่านั้น
      </p>
      <a 
        href="/login" 
        class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        เข้าสู่ระบบ
      </a>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- Header -->
    <header class="bg-white shadow-lg border-b border-blue-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl">
              📚
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">ระบบ LMS</h1>
              <p class="text-sm text-gray-600">Learning Management System</p>
            </div>
          </div>
          
          {#if user}
            <div class="flex items-center space-x-4">
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900">{profile?.full_name || 'ผู้ใช้'}</p>
                <p class="text-xs text-gray-500 capitalize">{profile?.role || 'guest'}</p>
              </div>
              <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
            </div>
          {:else}
            <a href="/login" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              เข้าสู่ระบบ
            </a>
          {/if}
        </div>
      </div>
    </header>

    <!-- Navigation -->
    <nav class="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex space-x-8 overflow-x-auto">
          <a 
            href="/lms" 
            class="flex items-center px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap {$page.url.pathname === '/lms' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          >
            🏠 หน้าหลัก
          </a>
          
          <!-- Browse Content - สำหรับสมาชิก -->
          <a 
            href="/lms/browse" 
            class="flex items-center px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap {$page.url.pathname.startsWith('/lms/browse') ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          >
            📖 เรียนรู้
          </a>
          
          <!-- Link to Original Courses System -->
          <a 
            href="/courses" 
            class="flex items-center px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            📚 หลักสูตร
          </a>
          
          {#if user}
            <!-- Student Features -->
            {#if profile?.role === 'student'}
              <a 
                href="/lms/assignments" 
                class="flex items-center px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap {$page.url.pathname.startsWith('/lms/assignments') ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
              >
                📝 งานที่ได้รับมอบหมาย
              </a>
            {/if}
            
            <!-- Teacher Features - เฉพาะครูขึ้นไป -->
            {#if profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'super_admin'}
              <a 
                href="/lms/create" 
                class="flex items-center px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap {$page.url.pathname.startsWith('/lms/create') ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
                title="สร้างเนื้อหาใหม่ (เฉพาะครู/ผู้ดูแล)"
              >
                ➕ สร้างเนื้อหา
              </a>
              
              <a 
                href="/lms/assign" 
                class="flex items-center px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap {$page.url.pathname.startsWith('/lms/assign') ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
                title="มอบหมายงานให้นักเรียน (เฉพาะครู/ผู้ดูแล)"
              >
                📋 มอบหมายงาน
              </a>
            {:else if user}
              <!-- Show disabled buttons for non-teachers with tooltip -->
              <span 
                class="flex items-center px-4 py-4 text-sm font-medium text-gray-400 cursor-not-allowed whitespace-nowrap"
                title="สร้างเนื้อหาได้เฉพาะครู/ผู้ดูแล"
              >
                ➕ สร้างเนื้อหา
              </span>
              
              <span 
                class="flex items-center px-4 py-4 text-sm font-medium text-gray-400 cursor-not-allowed whitespace-nowrap"
                title="มอบหมายงานได้เฉพาะครู/ผู้ดูแล"
              >
                📋 มอบหมายงาน
              </span>
            {/if}
          {/if}
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
  </div>
{/if}