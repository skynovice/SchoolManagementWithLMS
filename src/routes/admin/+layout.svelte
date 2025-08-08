<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';
  import Card from '$components/Card.svelte';

  // Accept params prop to avoid warnings
  export let params = {};

  let user = null;
  let profile = null;
  let loading = true;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      goto('/login');
      return;
    }
    
    user = session.user;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    profile = data;
    
    // Check if user has admin privileges
    if (!profile || (profile.role !== 'super_admin' && profile.role !== 'admin')) {
      goto('/dashboard');
      return;
    }
    
    loading = false;
  });
</script>

{#if loading}
  <div class="flex justify-center items-center py-12">
    <LoadingSpinner size="lg" text="กำลังตรวจสอบสิทธิ์..." />
  </div>
{:else}
  <div class="flex gap-8 max-w-7xl mx-auto">
    <aside class="w-80">
      <div class="bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-2xl p-6 shadow-lg sticky top-6">
        <div class="flex items-center gap-3 mb-8">
          <div class="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white text-2xl">
            🔧
          </div>
          <h2 class="text-2xl font-bold text-primary-800">
            จัดการระบบ
          </h2>
        </div>
        
        <nav>
          <div class="space-y-3">
            <div class="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-4 px-2">
              เมนูหลัก
            </div>
            
            <a 
              href="/admin/users" 
              class="group flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 no-underline {$page.url.pathname === '/admin/users' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-700 hover:bg-white hover:shadow-md'}"
            >
              <div class="w-10 h-10 rounded-lg flex items-center justify-center text-xl {$page.url.pathname === '/admin/users' ? 'bg-white/20' : 'bg-primary-100 group-hover:bg-primary-200'}">
                👥
              </div>
              <div class="flex-1">
                <div class="font-semibold">จัดการผู้ใช้</div>
                <div class="text-sm opacity-75">เพิ่ม แก้ไข ลบผู้ใช้</div>
              </div>
            </a>
            
            <a 
              href="/admin/zones" 
              class="group flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 no-underline {$page.url.pathname === '/admin/zones' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-700 hover:bg-white hover:shadow-md'}"
            >
              <div class="w-10 h-10 rounded-lg flex items-center justify-center text-xl {$page.url.pathname === '/admin/zones' ? 'bg-white/20' : 'bg-primary-100 group-hover:bg-primary-200'}">
                🏫
              </div>
              <div class="flex-1">
                <div class="font-semibold">จัดการโซน</div>
                <div class="text-sm opacity-75">กำหนดพื้นที่การเรียน</div>
              </div>
            </a>
            
            <a 
              href="/admin/groups" 
              class="group flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 no-underline {$page.url.pathname === '/admin/groups' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-700 hover:bg-white hover:shadow-md'}"
            >
              <div class="w-10 h-10 rounded-lg flex items-center justify-center text-xl {$page.url.pathname === '/admin/groups' ? 'bg-white/20' : 'bg-primary-100 group-hover:bg-primary-200'}">
                👨‍👩‍👧‍👦
              </div>
              <div class="flex-1">
                <div class="font-semibold">จัดการกลุ่ม</div>
                <div class="text-sm opacity-75">จัดกลุ่มนักเรียน</div>
              </div>
            </a>
            
            <a 
              href="/admin/subjects" 
              class="group flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 no-underline {$page.url.pathname === '/admin/subjects' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-700 hover:bg-white hover:shadow-md'}"
            >
              <div class="w-10 h-10 rounded-lg flex items-center justify-center text-xl {$page.url.pathname === '/admin/subjects' ? 'bg-white/20' : 'bg-primary-100 group-hover:bg-primary-200'}">
                📚
              </div>
              <div class="flex-1">
                <div class="font-semibold">จัดการวิชาเรียน</div>
                <div class="text-sm opacity-75">เพิ่มวิชาและหลักสูตร</div>
              </div>
            </a>
            
            <div class="border-t border-primary-200 my-4"></div>
            
            <a 
              href="/admin/settings" 
              class="group flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 no-underline {$page.url.pathname === '/admin/settings' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-700 hover:bg-white hover:shadow-md'}"
            >
              <div class="w-10 h-10 rounded-lg flex items-center justify-center text-xl {$page.url.pathname === '/admin/settings' ? 'bg-white/20' : 'bg-primary-100 group-hover:bg-primary-200'}">
                ⚙️
              </div>
              <div class="flex-1">
                <div class="font-semibold">ตั้งค่าระบบ</div>
                <div class="text-sm opacity-75">กำหนดค่าทั่วไป</div>
              </div>
            </a>
          </div>
        </nav>
        
        <!-- Quick Stats -->
        <div class="mt-8 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
          <div class="text-sm font-semibold text-primary-600 mb-2">สถานะระบบ</div>
          <div class="flex items-center gap-2 text-sm text-green-600">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            ระบบทำงานปกติ
          </div>
        </div>
      </div>
    </aside>
    
    <main class="flex-1">
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <slot />
      </div>
    </main>
  </div>
{/if}