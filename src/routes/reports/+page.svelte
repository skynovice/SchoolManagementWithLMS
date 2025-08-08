<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import { goto } from '$app/navigation';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';

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
    await loadProfile();
    await loadSystemStats();
    loading = false;
  });

  async function loadProfile() {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    profile = data;
  }

  function getRoleDisplayName(role) {
    const roleNames = {
      'super_admin': 'ผู้ดูแลระบบสูงสุด',
      'admin': 'ผู้ดูแลระบบ',
      'teacher': 'ครู',
      'parent': 'ผู้ปกครอง',
      'student': 'นักเรียน'
    };
    return roleNames[role] || role;
  }

  const mainReports = [
    {
      title: 'รายงานผลการเรียน',
      icon: '🎯',
      description: 'วิเคราะห์ผลการเรียนและประสิทธิภาพการศึกษา',
      path: '/reports/academic',
      color: 'from-green-500 to-green-600',
      available: true
    },
    {
      title: 'รายงานการใช้งาน',
      icon: '📈',
      description: 'วิเคราะห์การใช้งานระบบและพฤติกรรมผู้ใช้',
      path: '/reports/usage',
      color: 'from-blue-500 to-blue-600',
      available: true
    },
    {
      title: 'สถิติระบบ',
      icon: '📊',
      description: 'ภาพรวมและสถิติการทำงานของระบบ',
      path: '/reports/statistics',
      color: 'from-indigo-500 to-indigo-600',
      available: true
    }
  ];

  const additionalReports = [
    {
      title: 'รายงานหลักสูตร',
      icon: '📚',
      description: 'รายงานเกี่ยวกับหลักสูตรและการเข้าร่วม',
      color: 'from-purple-500 to-purple-600',
      available: false,
      comingSoon: true
    },
    {
      title: 'รายงานการเข้าเรียน',
      icon: '📅',
      description: 'ติดตามการเข้าเรียนและการมีส่วนร่วม',
      color: 'from-orange-500 to-orange-600',
      available: false,
      comingSoon: true
    },
    {
      title: 'รายงานใบประกาศนียบัตร',
      icon: '🏆',
      description: 'จัดการและติดตามใบประกาศนียบัตร',
      color: 'from-yellow-500 to-yellow-600',
      available: false,
      comingSoon: true
    },
    {
      title: 'รายงานความพึงพอใจ',
      icon: '😊',
      description: 'แบบประเมินความพึงพอใจและข้อเสนอแนะ',
      color: 'from-pink-500 to-pink-600',
      available: false,
      comingSoon: true
    },
    {
      title: 'รายงานการเงิน',
      icon: '💰',
      description: 'รายงานค่าธรรมเนียมและการเงิน',
      color: 'from-teal-500 to-teal-600',
      available: false,
      comingSoon: true
    }
  ];

  let quickStats = [
    { label: 'รายงานทั้งหมด', value: '8', icon: '📋' },
    { label: 'รายงานที่พร้อมใช้', value: '3', icon: '✅' },
    { label: 'กำลังพัฒนา', value: '5', icon: '🚧' }
  ];

  let systemStats = {
    totalUsers: 0,
    totalCourses: 0,
    totalMessages: 0,
    totalSubjects: 0
  };

  async function loadSystemStats() {
    try {
      const [profilesRes, coursesRes, messagesRes, subjectsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('courses').select('id', { count: 'exact' }),
        supabase.from('messages').select('id', { count: 'exact' }),
        supabase.from('subjects').select('id', { count: 'exact' })
      ]);

      systemStats = {
        totalUsers: profilesRes.count || 0,
        totalCourses: coursesRes.count || 0,
        totalMessages: messagesRes.count || 0,
        totalSubjects: subjectsRes.count || 0
      };
    } catch (error) {
      console.error('Error loading system stats:', error);
      // Use fallback data if database fails
      systemStats = {
        totalUsers: 0,
        totalCourses: 0,
        totalMessages: 0,
        totalSubjects: 0
      };
    }
  }
</script>

<div class="max-w-7xl mx-auto">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-white text-2xl">
        📊
      </div>
      <div>
        <h1 class="text-3xl font-bold text-gray-800">ศูนย์รายงาน</h1>
        <p class="text-gray-600">รายงานและการวิเคราะห์ข้อมูลสำหรับระบบจัดการโรงเรียน</p>
      </div>
    </div>
    <a 
      href="/dashboard" 
      class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors no-underline"
    >
      <span>←</span>
      <span>กลับหน้าหลัก</span>
    </a>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" text="กำลังโหลดข้อมูลรายงาน..." />
    </div>
  {:else}
    <!-- User Role Info -->
    <div class="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 mb-8">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg">
          👤
        </div>
        <div>
          <h3 class="font-semibold text-blue-800">สิทธิ์การเข้าถึงรายงาน</h3>
          <p class="text-blue-600">
            คุณเข้าสู่ระบบในฐานะ <strong>{getRoleDisplayName(profile?.role)}</strong> 
            - สามารถเข้าถึงรายงานตามสิทธิ์ที่กำหนด
          </p>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-100 text-sm font-medium">ผู้ใช้ทั้งหมด</p>
            <p class="text-3xl font-bold">{systemStats.totalUsers}</p>
          </div>
          <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
            👥
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl shadow-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-100 text-sm font-medium">หลักสูตร</p>
            <p class="text-3xl font-bold">{systemStats.totalCourses}</p>
          </div>
          <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
            📚
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl shadow-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-purple-100 text-sm font-medium">ข้อความ</p>
            <p class="text-3xl font-bold">{systemStats.totalMessages}</p>
          </div>
          <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
            💬
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl shadow-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-orange-100 text-sm font-medium">วิชาเรียน</p>
            <p class="text-3xl font-bold">{systemStats.totalSubjects}</p>
          </div>
          <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
            📖
          </div>
        </div>
      </div>
    </div>

    <!-- Main Reports -->
    <div class="mb-12">
      <div class="flex items-center gap-3 mb-6">
        <h2 class="text-2xl font-bold text-gray-800">รายงานหลัก</h2>
        <span class="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
          พร้อมใช้งาน
        </span>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each mainReports as report}
          <a 
            href={report.path}
            class="group bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 no-underline"
          >
            <div class="bg-gradient-to-r {report.color} p-6 text-white">
              <div class="flex items-center justify-between">
                <div class="text-4xl">{report.icon}</div>
                <div class="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <span class="text-white">→</span>
                </div>
              </div>
            </div>
            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-800 mb-2 group-hover:text-gray-900">
                {report.title}
              </h3>
              <p class="text-gray-600 leading-relaxed">
                {report.description}
              </p>
              <div class="mt-4 flex items-center gap-2 text-sm">
                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                <span class="text-green-600 font-medium">พร้อมใช้งาน</span>
              </div>
            </div>
          </a>
        {/each}
      </div>
    </div>

    <!-- Additional Reports -->
    <div>
      <div class="flex items-center gap-3 mb-6">
        <h2 class="text-2xl font-bold text-gray-800">รายงานเพิ่มเติม</h2>
        <span class="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
          กำลังพัฒนา
        </span>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each additionalReports as report}
          <div class="group bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden opacity-75">
            <div class="bg-gradient-to-r {report.color} p-6 text-white relative">
              <div class="flex items-center justify-between">
                <div class="text-4xl opacity-60">{report.icon}</div>
                <div class="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <span class="text-white opacity-60">🔒</span>
                </div>
              </div>
              {#if report.comingSoon}
                <div class="absolute top-2 right-2 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                  เร็วๆ นี้
                </div>
              {/if}
            </div>
            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-600 mb-2">
                {report.title}
              </h3>
              <p class="text-gray-500 leading-relaxed">
                {report.description}
              </p>
              <div class="mt-4 flex items-center gap-2 text-sm">
                <span class="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span class="text-orange-600 font-medium">กำลังพัฒนา</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Help Section -->
    <div class="mt-12 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 text-center">
      <div class="text-4xl mb-4">💡</div>
      <h3 class="text-xl font-bold text-gray-800 mb-2">ต้องการความช่วยเหลือ?</h3>
      <p class="text-gray-600 mb-6">
        หากคุณมีคำถามเกี่ยวกับรายงานหรือต้องการรายงานเพิ่มเติม กรุณาติดต่อผู้ดูแลระบบ
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors">
          📞 ติดต่อฝ่ายสนับสนุน
        </button>
        <button class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors">
          📖 คู่มือการใช้งาน
        </button>
      </div>
    </div>
  {/if}
</div>