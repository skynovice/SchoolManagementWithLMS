<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import Card from '$components/Card.svelte';
  import Button from '$components/Button.svelte';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';

  let user = null;
  let profile = null;
  let stats = {
    totalTopics: 0,
    totalQuizzes: 0,
    totalCourses: 0,
    myProgress: 0,
    myAssignments: 0
  };
  let recentTopics = [];
  let loading = true;

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      // Get user session
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

      // Load statistics - รวมระบบเดิมและใหม่
      const [topicsResult, quizzesResult, coursesResult] = await Promise.all([
        supabase.from('learning_topics').select('id', { count: 'exact' }).eq('is_published', true),
        supabase.from('quizzes').select('id', { count: 'exact' }),
        supabase.from('courses').select('id', { count: 'exact' }).eq('is_published', true)
      ]);

      stats.totalTopics = topicsResult.count || 0;
      stats.totalQuizzes = quizzesResult.count || 0;
      stats.totalCourses = coursesResult.count || 0;

      // Load recent topics
      const { data: topics } = await supabase
        .from('learning_topics')
        .select(`
          *,
          subjects(name),
          profiles!learning_topics_teacher_id_fkey(full_name)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6);

      recentTopics = topics || [];

      // Load user-specific data if logged in
      if (profile) {
        if (profile.role === 'student') {
          // Load student progress
          const { data: progressData } = await supabase
            .from('student_progress')
            .select('completion_percentage')
            .eq('student_id', user.id);

          if (progressData && progressData.length > 0) {
            const avgProgress = progressData.reduce((sum, item) => sum + (item.completion_percentage || 0), 0) / progressData.length;
            stats.myProgress = Math.round(avgProgress);
          }

          // Load assignments count
          const { count: assignmentsCount } = await supabase
            .from('course_assignments')
            .select('id', { count: 'exact' })
            .or(`assigned_to_id.eq.${profile.zone_id},assigned_to_id.eq.${profile.group_id},assigned_to_id.eq.${user.id}`);

          stats.myAssignments = assignmentsCount || 0;
        }
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>ระบบ LMS - หน้าหลัก</title>
</svelte:head>

{#if loading}
  <div class="flex justify-center items-center py-12">
    <LoadingSpinner size="lg" text="กำลังโหลดข้อมูล..." />
  </div>
{:else}
  <div class="space-y-8">
    <!-- Welcome Section -->
    <div class="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-8 mb-8">
      <div class="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
      <div class="relative text-center">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
          <span class="text-3xl">🎓</span>
        </div>
        <h1 class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          ยินดีต้อนรับสู่ระบบ LMS
        </h1>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
          ระบบจัดการการเรียนรู้ที่ครบครันสำหรับนักเรียน ครู และผู้ปกครอง 
          เรียนรู้ได้ทุกที่ทุกเวลาด้วยเนื้อหาที่หลากหลายและทันสมัย
        </p>
        
        <!-- Access Level Info -->
        <div class="inline-block p-6 {profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'super_admin' ? 'bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-200' : 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-200'} rounded-2xl border backdrop-blur-sm max-w-2xl">
          <div class="flex items-center justify-center mb-3">
            <div class="w-12 h-12 {profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'super_admin' ? 'bg-purple-100' : 'bg-green-100'} rounded-xl flex items-center justify-center text-2xl">
              {#if profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'super_admin'}
                🎓
              {:else}
                👨‍🎓
              {/if}
            </div>
          </div>
          <h3 class="text-lg font-semibold {profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'super_admin' ? 'text-purple-900' : 'text-green-900'} mb-3">
            {#if profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'super_admin'}
              สิทธิ์ครู/ผู้ดูแล
            {:else}
              สิทธิ์นักเรียน/ผู้ปกครอง
            {/if}
          </h3>
          <div class="text-sm {profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'super_admin' ? 'text-purple-700' : 'text-green-700'} space-y-1">
            {#if profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'super_admin'}
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                <span>เรียนรู้และติดตามความก้าวหน้า</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                <span><strong>สร้างเนื้อหาใหม่</strong> และแก้ไขเนื้อหา</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                <span><strong>มอบหมายงาน</strong> ให้นักเรียนตามโซน/กลุ่ม/รายบุคคล</span>
              </div>
            {:else}
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                <span>เรียนรู้และติดตามความก้าวหน้า</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                <span>รับงานมอบหมายจากครู</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                <span>เข้าถึงเนื้อหาทั้งหมดได้</span>
              </div>
            {/if}
          </div>
          <div class="mt-4 p-3 {profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'super_admin' ? 'bg-purple-50' : 'bg-green-50'} rounded-lg">
            <div class="flex items-center gap-2 text-xs {profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'super_admin' ? 'text-purple-600' : 'text-green-600'}">
              <span>💡</span>
              <span><strong>หมายเหตุ:</strong> ระบบ LMS เฉพาะสำหรับสมาชิกที่ลงทะเบียนแล้วเท่านั้น</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div class="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
        <div class="relative">
          <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl mb-4">📖</div>
          <div class="text-3xl font-bold mb-1">{stats.totalTopics}</div>
          <div class="text-blue-100 text-sm">หัวข้อการเรียนรู้</div>
        </div>
      </div>

      <div class="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div class="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
        <div class="relative">
          <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl mb-4">📚</div>
          <div class="text-3xl font-bold mb-1">{stats.totalCourses}</div>
          <div class="text-green-100 text-sm">หลักสูตร</div>
        </div>
      </div>

      {#if profile?.role === 'student'}
        <div class="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div class="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div class="relative">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl mb-4">📊</div>
            <div class="text-3xl font-bold mb-1">{stats.myProgress}%</div>
            <div class="text-orange-100 text-sm">ความก้าวหน้าของฉัน</div>
          </div>
        </div>

        <div class="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div class="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div class="relative">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl mb-4">📝</div>
            <div class="text-3xl font-bold mb-1">{stats.myAssignments}</div>
            <div class="text-purple-100 text-sm">งานที่ได้รับมอบหมาย</div>
          </div>
        </div>
      {:else}
        <div class="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div class="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div class="relative">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl mb-4">🧩</div>
            <div class="text-3xl font-bold mb-1">{stats.totalQuizzes}</div>
            <div class="text-purple-100 text-sm">แบบทดสอบ</div>
          </div>
        </div>

        <div class="group relative overflow-hidden bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div class="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div class="relative">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl mb-4">👥</div>
            <div class="text-3xl font-bold mb-1">174</div>
            <div class="text-gray-100 text-sm">ผู้ใช้ทั้งหมด</div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
        <div class="flex items-center space-x-4 mb-6">
          <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
            🌐
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">เรียนรู้</h3>
            <p class="text-sm text-gray-600">เนื้อหาสำหรับสมาชิก</p>
          </div>
        </div>
        <Button href="/lms/browse" variant="primary" fullWidth>
          <span class="flex items-center justify-center gap-2">
            <span>เริ่มเรียนรู้</span>
            <span class="group-hover:translate-x-1 transition-transform">→</span>
          </span>
        </Button>
      </div>

      <div class="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
        <div class="flex items-center space-x-4 mb-6">
          <div class="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
            📚
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">หลักสูตร</h3>
            <p class="text-sm text-gray-600">หลักสูตรเรียนแบบครบชุด</p>
          </div>
        </div>
        <Button href="/courses" variant="success" fullWidth>
          <span class="flex items-center justify-center gap-2">
            <span>ดูหลักสูตร ({stats.totalCourses})</span>
            <span class="group-hover:translate-x-1 transition-transform">→</span>
          </span>
        </Button>
      </div>

      {#if profile?.role === 'student'}
        <div class="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
          <div class="flex items-center space-x-4 mb-6">
            <div class="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
              📝
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">งานที่ได้รับมอบหมาย</h3>
              <p class="text-sm text-gray-600">งานจากครูผู้สอน</p>
            </div>
          </div>
          <Button href="/lms/assignments" variant="warning" fullWidth>
            <span class="flex items-center justify-center gap-2">
              <span>ดูงาน ({stats.myAssignments})</span>
              <span class="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </Button>
        </div>
      {/if}

      {#if profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'super_admin'}
        <div class="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
          <div class="flex items-center space-x-4 mb-6">
            <div class="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
              ➕
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">สร้างเนื้อหา</h3>
              <p class="text-sm text-gray-600">สร้างบทเรียนใหม่</p>
            </div>
          </div>
          <Button href="/lms/create" variant="success" fullWidth>
            <span class="flex items-center justify-center gap-2">
              <span>สร้างเนื้อหา</span>
              <span class="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </Button>
        </div>

        <div class="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
          <div class="flex items-center space-x-4 mb-6">
            <div class="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
              📋
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">มอบหมายงาน</h3>
              <p class="text-sm text-gray-600">มอบหมายบทเรียนให้นักเรียน</p>
            </div>
          </div>
          <Button href="/lms/assign" variant="secondary" fullWidth>
            <span class="flex items-center justify-center gap-2">
              <span>มอบหมาย</span>
              <span class="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </Button>
        </div>
      {/if}
    </div>

    <!-- Recent Topics -->
    <div>
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="text-3xl font-bold text-gray-900 mb-2">หัวข้อการเรียนรู้ล่าสุด</h2>
          <p class="text-gray-600">เนื้อหาใหม่ล่าสุดที่พร้อมให้คุณเรียนรู้</p>
        </div>
        <Button href="/lms/browse" variant="outline" class="flex items-center gap-2">
          <span>ดูทั้งหมด</span>
          <span>→</span>
        </Button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each recentTopics as topic}
          <div class="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden">
            <!-- Header with gradient -->
            <div class="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-medium px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm">
                  {topic.difficulty_level === 'beginner' ? '🟢 เริ่มต้น' : topic.difficulty_level === 'intermediate' ? '🟡 ปานกลาง' : '🔴 ขั้นสูง'}
                </span>
                <span class="text-xs text-white/80 flex items-center gap-1">
                  <span>⏱️</span>
                  <span>{topic.estimated_duration} นาที</span>
                </span>
              </div>
              <h3 class="text-lg font-semibold text-white mb-2 group-hover:text-yellow-200 transition-colors">{topic.title}</h3>
            </div>
            
            <!-- Content -->
            <div class="p-6">
              <p class="text-sm text-gray-600 mb-4 line-clamp-2">{topic.description}</p>
              
              <div class="space-y-2 mb-6">
                <div class="flex items-center gap-2 text-sm text-gray-500">
                  <span class="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-xs">📚</span>
                  <span>{topic.subjects?.name || 'ไม่ระบุวิชา'}</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-500">
                  <span class="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-xs">👨‍🏫</span>
                  <span>{topic.profiles?.full_name || 'ไม่ระบุครู'}</span>
                </div>
              </div>
              
              <Button href="/lms/learn/{topic.id}" variant="primary" fullWidth>
                <span class="flex items-center justify-center gap-2">
                  <span>เรียนเลย</span>
                  <span class="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </Button>
            </div>
          </div>
        {/each}
      </div>

      {#if recentTopics.length === 0}
        <div class="text-center py-12">
          <div class="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">
            📚
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">ยังไม่มีเนื้อหาการเรียนรู้</h3>
          <p class="text-gray-600 mb-6">เริ่มต้นสร้างเนื้อหาการเรียนรู้แรกของคุณ</p>
          {#if profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'super_admin'}
            <Button href="/lms/create" variant="primary">
              สร้างเนื้อหาใหม่
            </Button>
          {:else}
            <Button href="/lms/browse" variant="primary">
              เรียนดูเนื้อหาอื่น
            </Button>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}