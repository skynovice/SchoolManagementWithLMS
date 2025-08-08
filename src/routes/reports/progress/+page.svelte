<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import { goto } from '$app/navigation';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';

  let user = null;
  let profile = null;
  let loading = true;
  let progressData = {
    currentTopics: [],
    completedTopics: [],
    upcomingAssignments: [],
    weeklyActivity: [],
    learningPath: []
  };

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      goto('/login');
      return;
    }
    
    user = session.user;
    await loadProfile();
    
    if (profile?.role !== 'student') {
      goto('/dashboard');
      return;
    }
    
    await loadProgressData();
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

  async function loadProgressData() {
    try {
      const [
        progressRes,
        enrollmentsRes
      ] = await Promise.all([
        supabase.from('student_progress').select(`
          *,
          learning_topics(
            *,
            subjects(name, code),
            profiles!learning_topics_teacher_id_fkey(full_name),
            learning_parts(*)
          )
        `).eq('student_id', user.id).then(res => res).catch(() => ({ data: [] })),
        supabase.from('course_enrollments').select(`
          *,
          courses(
            *,
            subjects(name, code)
          )
        `).eq('student_id', user.id).then(res => res).catch(() => ({ data: [] }))
      ]);

      // Try to load assignments, but handle gracefully if table doesn't exist
      let assignmentsRes = { data: [] };
      try {
        assignmentsRes = await supabase.from('course_assignments').select(`
          *,
          courses(
            *,
            subjects(name, code)
          )
        `).eq('student_id', user.id);
      } catch (error) {
        console.warn('course_assignments table not found, skipping assignments data');
      }

      const progress = progressRes.data || [];
      const assignments = assignmentsRes.data || [];
      const enrollments = enrollmentsRes.data || [];

      // Current topics (in progress)
      const currentTopics = progress
        .filter(p => !p.is_completed && p.completion_percentage > 0)
        .map(p => ({
          ...p,
          topic: p.learning_topics
        }))
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

      // Completed topics
      const completedTopics = progress
        .filter(p => p.is_completed)
        .map(p => ({
          ...p,
          topic: p.learning_topics
        }))
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

      // Upcoming assignments
      const upcomingAssignments = assignments
        .filter(a => a.status !== 'completed' && a.due_date)
        .map(a => ({
          ...a,
          course: a.courses,
          daysLeft: Math.ceil((new Date(a.due_date) - new Date()) / (1000 * 60 * 60 * 24))
        }))
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

      // Weekly activity (last 7 days)
      const weeklyActivity = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const dayProgress = progress.filter(p => {
          const updatedAt = new Date(p.updated_at);
          return updatedAt >= dayStart && updatedAt <= dayEnd;
        });
        
        weeklyActivity.push({
          date: dayStart.toLocaleDateString('th-TH', { weekday: 'short' }),
          fullDate: dayStart,
          activity: dayProgress.length,
          completed: dayProgress.filter(p => p.is_completed).length
        });
      }

      // Learning path (recommended next steps)
      const learningPath = [];
      
      // Add incomplete topics
      currentTopics.slice(0, 3).forEach(topic => {
        learningPath.push({
          type: 'continue',
          title: `ทำต่อ: ${topic.topic?.title}`,
          description: `${topic.completion_percentage}% เสร็จแล้ว`,
          action: `/lms/learn/${topic.topic_id}`,
          priority: 'high',
          icon: '📖'
        });
      });

      // Add upcoming assignments
      upcomingAssignments.slice(0, 2).forEach(assignment => {
        learningPath.push({
          type: 'assignment',
          title: `งาน: ${assignment.course?.title}`,
          description: `เหลือ ${assignment.daysLeft} วัน`,
          action: `/lms/course/${assignment.course_id}`,
          priority: assignment.daysLeft <= 3 ? 'urgent' : 'medium',
          icon: '📋'
        });
      });

      // Add new topics to explore
      if (learningPath.length < 5) {
        learningPath.push({
          type: 'explore',
          title: 'สำรวจเนื้อหาใหม่',
          description: 'ค้นหาหัวข้อที่น่าสนใจ',
          action: '/lms/browse',
          priority: 'low',
          icon: '🌟'
        });
      }

      progressData = {
        currentTopics: currentTopics.slice(0, 6),
        completedTopics: completedTopics.slice(0, 6),
        upcomingAssignments: upcomingAssignments.slice(0, 5),
        weeklyActivity: weeklyActivity,
        learningPath: learningPath
      };

    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function getDifficultyColor(level) {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getDifficultyText(level) {
    switch (level) {
      case 'beginner': return 'เริ่มต้น';
      case 'intermediate': return 'ปานกลาง';
      case 'advanced': return 'ขั้นสูง';
      default: return 'ไม่ระบุ';
    }
  }

  function getPriorityColor(priority) {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
</script>

<svelte:head>
  <title>ความก้าวหน้าการเรียน - ระบบ LMS</title>
</svelte:head>

{#if loading}
  <div class="flex justify-center items-center py-12">
    <LoadingSpinner size="lg" text="กำลังโหลดความก้าวหน้า..." />
  </div>
{:else}
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl shadow-lg border border-green-200 p-8 mb-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg">
            📈
          </div>
          <div>
            <h1 class="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">ความก้าวหน้าการเรียน</h1>
            <p class="text-gray-700 text-lg mt-1">ติดตามการเรียนรู้และวางแผนการเรียนต่อไป</p>
          </div>
        </div>
        <a href="/dashboard" class="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm hover:bg-white text-gray-700 rounded-xl transition-colors no-underline shadow-sm">
          <span>←</span>
          <span>กลับ</span>
        </a>
      </div>
    </div>

    <!-- Weekly Activity Chart -->
    <div class="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border border-blue-200 p-6 mb-8">
      <h2 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
        <span class="text-3xl">📊</span>
        กิจกรรมการเรียน 7 วันที่ผ่านมา
      </h2>
      <div class="grid grid-cols-7 gap-4">
        {#each progressData.weeklyActivity as day}
          <div class="text-center">
            <div class="text-sm text-gray-500 mb-2">{day.date}</div>
            <div class="bg-blue-100 rounded-lg p-4 hover:bg-blue-200 transition-colors">
              <div class="text-2xl font-bold text-blue-600">{day.activity}</div>
              <div class="text-xs text-gray-600">กิจกรรม</div>
              {#if day.completed > 0}
                <div class="text-xs text-green-600 mt-1">✅ {day.completed} เสร็จ</div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Current Topics -->
      <div class="bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-lg border border-orange-200 p-6">
        <h2 class="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
          <span class="text-3xl">📖</span>
          หัวข้อที่กำลังเรียน
        </h2>
        <div class="space-y-4">
          {#each progressData.currentTopics as progress}
            <div class="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-orange-100 hover:shadow-md transition-all duration-300">
              <div class="flex items-start justify-between mb-2">
                <h4 class="font-semibold text-gray-800 text-sm">{progress.topic?.title || 'ไม่ระบุ'}</h4>
                <span class="px-2 py-1 text-xs font-medium rounded-full {getDifficultyColor(progress.topic?.difficulty_level)}">
                  {getDifficultyText(progress.topic?.difficulty_level)}
                </span>
              </div>
              <div class="flex items-center gap-4 text-xs text-gray-600 mb-3">
                <span>📚 {progress.topic?.subjects?.name || 'ไม่ระบุ'}</span>
                <span>👨‍🏫 {progress.topic?.profiles?.full_name || 'ไม่ระบุ'}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div class="bg-gradient-to-r from-orange-400 to-red-400 h-2 rounded-full transition-all duration-300" style="width: {progress.completion_percentage}%"></div>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-500">{progress.completion_percentage}% เสร็จสิ้น</span>
                <a href="/lms/learn/{progress.topic_id}" class="text-orange-600 hover:text-orange-800 font-medium no-underline">
                  เรียนต่อ →
                </a>
              </div>
            </div>
          {:else}
            <div class="text-center py-8">
              <div class="text-4xl mb-2">📚</div>
              <p class="text-gray-600">ไม่มีหัวข้อที่กำลังเรียนอยู่</p>
              <a href="/lms/browse" class="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 no-underline">
                เริ่มเรียนใหม่
              </a>
            </div>
          {/each}
        </div>
      </div>

      <!-- Learning Path -->
      <div class="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-lg border border-purple-200 p-6">
        <h2 class="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
          <span class="text-3xl">🎯</span>
          แผนการเรียนที่แนะนำ
        </h2>
        <div class="space-y-4">
          {#each progressData.learningPath as item}
            <div class="bg-white/70 backdrop-blur-sm rounded-xl p-4 border {getPriorityColor(item.priority)} hover:shadow-md transition-all duration-300">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center text-white text-lg">
                  {item.icon}
                </div>
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-800 text-sm mb-1">{item.title}</h4>
                  <p class="text-xs text-gray-600 mb-2">{item.description}</p>
                  <a href={item.action} class="text-purple-600 hover:text-purple-800 text-xs font-medium no-underline">
                    ดำเนินการ →
                  </a>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Completed Topics -->
      <div class="bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-lg border border-green-200 p-6">
        <h2 class="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
          <span class="text-3xl">✅</span>
          หัวข้อที่เรียนจบแล้ว
        </h2>
        <div class="space-y-4">
          {#each progressData.completedTopics as progress}
            <div class="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-green-100 hover:shadow-md transition-all duration-300">
              <div class="flex items-start justify-between mb-2">
                <h4 class="font-semibold text-gray-800 text-sm">{progress.topic?.title || 'ไม่ระบุ'}</h4>
                <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  เสร็จแล้ว
                </span>
              </div>
              <div class="flex items-center gap-4 text-xs text-gray-600 mb-2">
                <span>📚 {progress.topic?.subjects?.name || 'ไม่ระบุ'}</span>
                <span>📅 {formatDate(progress.updated_at)}</span>
              </div>
              <div class="w-full bg-green-200 rounded-full h-2">
                <div class="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full" style="width: 100%"></div>
              </div>
            </div>
          {:else}
            <div class="text-center py-8">
              <div class="text-4xl mb-2">🎓</div>
              <p class="text-gray-600">ยังไม่มีหัวข้อที่เรียนจบ</p>
            </div>
          {/each}
        </div>
      </div>

      <!-- Upcoming Assignments -->
      <div class="bg-gradient-to-br from-white to-red-50 rounded-2xl shadow-lg border border-red-200 p-6">
        <h2 class="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
          <span class="text-3xl">📋</span>
          งานที่ใกล้ครบกำหนด
        </h2>
        <div class="space-y-4">
          {#each progressData.upcomingAssignments as assignment}
            <div class="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-red-100 hover:shadow-md transition-all duration-300">
              <div class="flex items-start justify-between mb-2">
                <h4 class="font-semibold text-gray-800 text-sm">{assignment.course?.title || 'ไม่ระบุ'}</h4>
                <span class="px-2 py-1 text-xs font-medium rounded-full {assignment.daysLeft <= 3 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">
                  {assignment.daysLeft > 0 ? `${assignment.daysLeft} วัน` : 'เลยกำหนด'}
                </span>
              </div>
              <div class="flex items-center gap-4 text-xs text-gray-600 mb-2">
                <span>📚 {assignment.course?.subjects?.name || 'ไม่ระบุ'}</span>
                <span>📅 {formatDate(assignment.due_date)}</span>
              </div>
              <a href="/lms/course/{assignment.course_id}" class="text-red-600 hover:text-red-800 text-xs font-medium no-underline">
                ดูรายละเอียด →
              </a>
            </div>
          {:else}
            <div class="text-center py-8">
              <div class="text-4xl mb-2">📅</div>
              <p class="text-gray-600">ไม่มีงานที่ใกล้ครบกำหนด</p>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}