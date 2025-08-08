<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import { goto } from '$app/navigation';
  import { getRoleDisplayName } from '$lib/utils.js';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';
  import Card from '$components/Card.svelte';
  import DatabaseNotice from '$components/DatabaseNotice.svelte';

  // Accept params prop to avoid warnings
  export const params = {};

  let user = null;
  let profile = null;
  let stats = {
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalMessages: 0
  };
  let studentStats = {
    enrolledCourses: 0,
    completedTopics: 0,
    averageScore: 0,
    totalQuizzes: 0,
    passedQuizzes: 0,
    studyTime: 0,
    currentStreak: 0
  };
  let recentProgress = [];
  let assignedContent = [];
  let publicContent = [];
  let loading = true;
  let showDatabaseNotice = false;

  onMount(async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) {
      goto('/login');
      return;
    }

    user = session.user;
    await loadProfile();
    await loadStats();
    loading = false;
  });

  async function loadProfile() {
    if (!user) return;

    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();

    profile = data;
  }

  async function loadStats() {
    if (profile?.role === 'student') {
      await loadStudentStats();
    } else {
      // Load dashboard statistics for admin/teacher
      const [studentsRes, teachersRes, coursesRes, messagesRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'teacher'),
        supabase.from('courses').select('id', { count: 'exact' }),
        supabase.from('messages').select('id', { count: 'exact' })
      ]);

      stats = {
        totalStudents: studentsRes.count || 0,
        totalTeachers: teachersRes.count || 0,
        totalCourses: coursesRes.count || 0,
        totalMessages: messagesRes.count || 0
      };
    }
  }

  async function loadStudentStats() {
    try {
      // Load student-specific statistics with error handling for missing tables
      const [enrollmentsRes, progressRes, quizAttemptsRes, topicsRes] = await Promise.all([
        supabase
          .from('course_enrollments')
          .select('*')
          .eq('student_id', user.id)
          .then(res => res)
          .catch(() => ({ data: [] })),
        supabase
          .from('student_progress')
          .select('*')
          .eq('student_id', user.id)
          .then(res => res)
          .catch(() => ({ data: [] })),
        supabase
          .from('quiz_attempts')
          .select('*')
          .eq('student_id', user.id)
          .then(res => res)
          .catch(() => ({ data: [] })),
        supabase
          .from('learning_topics')
          .select(
            `
          *,
          subjects(name, code),
          profiles!learning_topics_teacher_id_fkey(full_name),
          learning_parts(
            *,
            learning_resources(*),
            quizzes(*)
          )
        `
          )
          .eq('is_published', true)
          .limit(6)
          .then(res => res)
          .catch(() => ({ data: [] }))
      ]);

      // Try to load assignments, but handle gracefully if table doesn't exist
      let assignedRes = { data: [] };
      try {
        const { data, error } = await supabase
          .from('course_assignments')
          .select(
            `
          *,
          courses(
            *,
            subjects(name, code)
          )
        `
          )
          .eq('student_id', user.id)
          .limit(6);

        if (error) {
          console.warn('course_assignments query error:', error);
          showDatabaseNotice = true;
        } else {
          assignedRes = { data };
        }
      } catch (error) {
        console.warn('course_assignments table not found, skipping assignments data');
        showDatabaseNotice = true;
      }

      const enrollments = enrollmentsRes.data || [];
      const progress = progressRes.data || [];
      const quizAttempts = quizAttemptsRes.data || [];
      const topics = topicsRes.data || [];
      const assignments = assignedRes.data || [];

      // Calculate student statistics
      const completedProgress = progress.filter(p => p.is_completed);
      const passedQuizzes = quizAttempts.filter(q => q.is_passed);
      const totalScore = quizAttempts.reduce((sum, q) => sum + (q.score || 0), 0);
      const averageScore = quizAttempts.length > 0 ? totalScore / quizAttempts.length : 0;

      // Calculate study time (estimated from progress data)
      const studyTime = progress.reduce((sum, p) => {
        return sum + Math.floor((p.completion_percentage || 0) * 0.5); // Rough estimate
      }, 0);

      // Calculate current streak (days of consecutive activity)
      const recentActivity = progress.map(p => new Date(p.updated_at)).sort((a, b) => b - a);

      let currentStreak = 0;
      if (recentActivity.length > 0) {
        const today = new Date();
        const daysDiff = Math.floor((today - recentActivity[0]) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 1) {
          currentStreak = Math.min(7, recentActivity.length); // Cap at 7 days for display
        }
      }

      studentStats = {
        enrolledCourses: enrollments.length,
        completedTopics: completedProgress.length,
        averageScore: Math.round(averageScore * 10) / 10,
        totalQuizzes: quizAttempts.length,
        passedQuizzes: passedQuizzes.length,
        studyTime: studyTime,
        currentStreak: currentStreak
      };

      // Recent progress with topic details
      recentProgress = progress
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 5)
        .map(p => {
          const topic = topics.find(t => t.id === p.topic_id);
          return {
            ...p,
            topic: topic
          };
        })
        .filter(p => p.topic);

      // Assigned content
      assignedContent = assignments.map(assignment => ({
        id: assignment.course_id,
        title: assignment.courses?.title || 'ไม่ระบุ',
        subject: assignment.courses?.subjects?.name || 'ไม่ระบุ',
        type: 'course',
        dueDate: assignment.due_date,
        status: assignment.status || 'assigned',
        progress: 0 // Will be calculated from enrollments
      }));

      // Public content (available topics)
      publicContent = topics.map(topic => {
        const userProgress = progress.find(p => p.topic_id === topic.id);
        return {
          id: topic.id,
          title: topic.title,
          subject: topic.subjects?.name || 'ไม่ระบุ',
          teacher: topic.profiles?.full_name || 'ไม่ระบุ',
          type: 'topic',
          difficulty: topic.difficulty_level,
          duration: topic.estimated_duration,
          progress: userProgress?.completion_percentage || 0,
          isCompleted: userProgress?.is_completed || false,
          partsCount: topic.learning_parts?.length || 0
        };
      });
    } catch (error) {
      console.error('Error loading student stats:', error);
    }
  }
</script>

<DatabaseNotice
  bind:show={showDatabaseNotice}
  isAdmin={profile?.role === 'admin' || profile?.role === 'super_admin'}
/>

{#if loading}
  <div class="flex justify-center items-center py-12">
    <LoadingSpinner size="lg" text="กำลังโหลดข้อมูล..." />
  </div>
{:else}
  <div class="max-w-7xl mx-auto">
    <!-- Welcome Section -->
    <div
      class="relative bg-gradient-to-r from-primary-800 via-primary-700 to-primary-600 text-white rounded-2xl p-8 mb-8 overflow-hidden shadow-2xl"
    >
      <div class="absolute inset-0 bg-black opacity-10"></div>
      <div
        class="absolute top-0 right-0 w-64 h-64 bg-gold-400 opacity-10 rounded-full -translate-y-32 translate-x-32"
      ></div>
      <div class="relative z-10">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-4xl font-bold mb-2">
              สวัสดี, {profile?.full_name || 'ผู้ใช้'}! 👋
            </h1>
            <p class="text-xl opacity-90">
              ยินดีต้อนรับสู่ระบบจัดการโรงเรียน - {getRoleDisplayName(profile?.role)}
            </p>
            <div
              class="mt-4 inline-flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full"
            >
              <div class="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span class="text-sm">ออนไลน์</span>
            </div>
          </div>
          <div class="hidden md:block">
            <div
              class="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl"
            >
              🎯
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    {#if profile?.role === 'student'}
      <!-- Student Personal Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm font-medium">หลักสูตรที่ลงทะเบียน</p>
              <p class="text-3xl font-bold">{studentStats.enrolledCourses}</p>
            </div>
            <div
              class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl"
            >
              📚
            </div>
          </div>
        </div>

        <div
          class="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-green-100 text-sm font-medium">หัวข้อที่เรียนจบ</p>
              <p class="text-3xl font-bold">{studentStats.completedTopics}</p>
            </div>
            <div
              class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl"
            >
              ✅
            </div>
          </div>
        </div>

        <div
          class="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-purple-100 text-sm font-medium">คะแนนเฉลี่ย</p>
              <p class="text-3xl font-bold">{studentStats.averageScore}%</p>
            </div>
            <div
              class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl"
            >
              🎯
            </div>
          </div>
        </div>

        <div
          class="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-orange-100 text-sm font-medium">เวลาเรียนรวม</p>
              <p class="text-3xl font-bold">{studentStats.studyTime}</p>
              <p class="text-orange-200 text-xs">นาที</p>
            </div>
            <div
              class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl"
            >
              ⏱️
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Student Stats Row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div
          class="bg-gradient-to-br from-teal-500 to-teal-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-teal-100 text-sm font-medium">แบบทดสอบผ่าน</p>
              <p class="text-3xl font-bold">
                {studentStats.passedQuizzes}/{studentStats.totalQuizzes}
              </p>
            </div>
            <div
              class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl"
            >
              🧩
            </div>
          </div>
        </div>

        <div
          class="bg-gradient-to-br from-pink-500 to-pink-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-pink-100 text-sm font-medium">สตรีคการเรียน</p>
              <p class="text-3xl font-bold">{studentStats.currentStreak}</p>
              <p class="text-pink-200 text-xs">วันติดต่อกัน</p>
            </div>
            <div
              class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl"
            >
              🔥
            </div>
          </div>
        </div>

        <div
          class="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-indigo-100 text-sm font-medium">อัตราความสำเร็จ</p>
              <p class="text-3xl font-bold">
                {studentStats.totalQuizzes > 0
                  ? Math.round((studentStats.passedQuizzes / studentStats.totalQuizzes) * 100)
                  : 0}%
              </p>
            </div>
            <div
              class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl"
            >
              📈
            </div>
          </div>
        </div>
      </div>
    {:else}
      <!-- Admin/Teacher Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm font-medium">นักเรียนทั้งหมด</p>
              <p class="text-3xl font-bold">{stats.totalStudents}</p>
            </div>
            <div
              class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl"
            >
              👨‍🎓
            </div>
          </div>
        </div>

        <div
          class="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-green-100 text-sm font-medium">ครูทั้งหมด</p>
              <p class="text-3xl font-bold">{stats.totalTeachers}</p>
            </div>
            <div
              class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl"
            >
              👩‍🏫
            </div>
          </div>
        </div>

        <div
          class="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-purple-100 text-sm font-medium">หลักสูตรทั้งหมด</p>
              <p class="text-3xl font-bold">{stats.totalCourses}</p>
            </div>
            <div
              class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl"
            >
              📚
            </div>
          </div>
        </div>

        <div
          class="bg-gradient-to-br from-pink-500 to-pink-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-pink-100 text-sm font-medium">ข้อความทั้งหมด</p>
              <p class="text-3xl font-bold">{stats.totalMessages}</p>
            </div>
            <div
              class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl"
            >
              💬
            </div>
          </div>
        </div>
      </div>
    {/if}

    {#if profile?.role === 'student'}
      <!-- Student LMS Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Assigned Content -->
        <div
          class="bg-gradient-to-br from-red-50 to-pink-100 border border-red-200 rounded-2xl p-6"
        >
          <div class="flex items-center justify-between mb-6">
            <h3
              class="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3"
            >
              <div
                class="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-2xl"
              >
                📋
              </div>
              เนื้อหาที่ได้รับมอบหมาย
            </h3>
            <a href="/lms/assignments" class="text-red-600 hover:text-red-800 text-sm font-medium"
              >ดูทั้งหมด →</a
            >
          </div>
          <div class="space-y-4">
            {#each assignedContent.slice(0, 3) as content}
              <div
                class="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-red-100 hover:shadow-md transition-all duration-300"
              >
                <div class="flex items-start justify-between mb-2">
                  <h4 class="font-semibold text-gray-800 text-sm">{content.title}</h4>
                  <span
                    class="px-2 py-1 text-xs font-medium rounded-full {content.status ===
                    'completed'
                      ? 'bg-green-100 text-green-800'
                      : content.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'}"
                  >
                    {content.status === 'completed'
                      ? 'เสร็จแล้ว'
                      : content.status === 'in_progress'
                        ? 'กำลังทำ'
                        : 'ยังไม่เริ่ม'}
                  </span>
                </div>
                <p class="text-xs text-gray-600 mb-3">📚 {content.subject}</p>
                <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    class="bg-gradient-to-r from-red-400 to-pink-400 h-2 rounded-full transition-all duration-300"
                    style="width: {content.progress}%"
                  ></div>
                </div>
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-500">{content.progress}% เสร็จสิ้น</span>
                  {#if content.dueDate}
                    <span class="text-red-600"
                      >📅 {new Date(content.dueDate).toLocaleDateString('th-TH')}</span
                    >
                  {/if}
                </div>
              </div>
            {:else}
              <div class="text-center py-8">
                <div class="text-4xl mb-2">📝</div>
                <p class="text-gray-600">ยังไม่มีเนื้อหาที่ได้รับมอบหมาย</p>
              </div>
            {/each}
          </div>
        </div>

        <!-- Public Content -->
        <div
          class="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-2xl p-6"
        >
          <div class="flex items-center justify-between mb-6">
            <h3
              class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3"
            >
              <div
                class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-2xl"
              >
                🌐
              </div>
              เนื้อหาสาธารณะ
            </h3>
            <a href="/lms/browse" class="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >ดูทั้งหมด →</a
            >
          </div>
          <div class="space-y-4">
            {#each publicContent.slice(0, 3) as content}
              <div
                class="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300"
              >
                <div class="flex items-start justify-between mb-2">
                  <h4 class="font-semibold text-gray-800 text-sm">{content.title}</h4>
                  <span
                    class="px-2 py-1 text-xs font-medium rounded-full {content.difficulty ===
                    'beginner'
                      ? 'bg-green-100 text-green-800'
                      : content.difficulty === 'intermediate'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'}"
                  >
                    {content.difficulty === 'beginner'
                      ? 'เริ่มต้น'
                      : content.difficulty === 'intermediate'
                        ? 'ปานกลาง'
                        : 'ขั้นสูง'}
                  </span>
                </div>
                <div class="flex items-center gap-4 text-xs text-gray-600 mb-3">
                  <span>📚 {content.subject}</span>
                  <span>👨‍🏫 {content.teacher}</span>
                  <span>⏱️ {content.duration} นาที</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    class="bg-gradient-to-r from-blue-400 to-indigo-400 h-2 rounded-full transition-all duration-300"
                    style="width: {content.progress}%"
                  ></div>
                </div>
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-500">{content.progress}% เสร็จสิ้น</span>
                  <span class="text-blue-600">📖 {content.partsCount} ส่วน</span>
                </div>
              </div>
            {:else}
              <div class="text-center py-8">
                <div class="text-4xl mb-2">📚</div>
                <p class="text-gray-600">ยังไม่มีเนื้อหาสาธารณะ</p>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Recent Progress -->
      <div
        class="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-2xl p-6 mb-8"
      >
        <div class="flex items-center justify-between mb-6">
          <h3
            class="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-3"
          >
            <div
              class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white text-2xl"
            >
              📈
            </div>
            ความก้าวหน้าล่าสุด
          </h3>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each recentProgress as progress}
            <div
              class="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-green-100 hover:shadow-md transition-all duration-300"
            >
              <h4 class="font-semibold text-gray-800 text-sm mb-2">
                {progress.topic?.title || 'ไม่ระบุ'}
              </h4>
              <p class="text-xs text-gray-600 mb-3">
                📚 {progress.topic?.subjects?.name || 'ไม่ระบุ'}
              </p>
              <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  class="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full transition-all duration-300"
                  style="width: {progress.completion_percentage}%"
                ></div>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-500">{progress.completion_percentage}% เสร็จสิ้น</span>
                <span class="text-green-600"
                  >{progress.is_completed ? '✅ เสร็จแล้ว' : '⏳ กำลังเรียน'}</span
                >
              </div>
            </div>
          {:else}
            <div class="col-span-full text-center py-8">
              <div class="text-4xl mb-2">📊</div>
              <p class="text-gray-600">ยังไม่มีความก้าวหน้าในการเรียน</p>
              <a
                href="/lms/browse"
                class="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 no-underline"
              >
                เริ่มเรียนเลย
              </a>
            </div>
          {/each}
        </div>
      </div>

      <!-- Student Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          class="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-purple-800 flex items-center gap-3">
              <div
                class="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white text-2xl"
              >
                🎓
              </div>
              การเรียนรู้
            </h3>
          </div>
          <div class="space-y-3">
            <a
              href="/lms/browse"
              class="group flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-purple-500 hover:text-white transition-all duration-200 no-underline shadow-sm hover:shadow-md"
            >
              <div
                class="w-8 h-8 bg-purple-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center text-lg"
              >
                🌐
              </div>
              <span class="font-medium text-gray-700 group-hover:text-white"
                >เรียนรู้เนื้อหาสาธารณะ</span
              >
            </a>
            <a
              href="/lms/assignments"
              class="group flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-purple-500 hover:text-white transition-all duration-200 no-underline shadow-sm hover:shadow-md"
            >
              <div
                class="w-8 h-8 bg-purple-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center text-lg"
              >
                📋
              </div>
              <span class="font-medium text-gray-700 group-hover:text-white"
                >งานที่ได้รับมอบหมาย</span
              >
            </a>
            <a
              href="/lms"
              class="group flex items-center gap-3 p-4 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-xl hover:from-purple-500 hover:to-purple-600 transition-all duration-200 no-underline shadow-md hover:shadow-lg"
            >
              <div
                class="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-lg"
              >
                🎯
              </div>
              <span class="font-medium">ศูนย์การเรียนรู้</span>
            </a>
          </div>
        </div>

        <div
          class="bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-rose-800 flex items-center gap-3">
              <div
                class="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center text-white text-2xl"
              >
                💬
              </div>
              การสื่อสาร
            </h3>
          </div>
          <div class="space-y-3">
            <a
              href="/messages"
              class="group flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-rose-500 hover:text-white transition-all duration-200 no-underline shadow-sm hover:shadow-md"
            >
              <div
                class="w-8 h-8 bg-rose-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center text-lg"
              >
                📨
              </div>
              <span class="font-medium text-gray-700 group-hover:text-white">ข้อความใหม่</span>
            </a>
            <a
              href="/messages/compose"
              class="group flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-rose-500 hover:text-white transition-all duration-200 no-underline shadow-sm hover:shadow-md"
            >
              <div
                class="w-8 h-8 bg-rose-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center text-lg"
              >
                ✍️
              </div>
              <span class="font-medium text-gray-700 group-hover:text-white">เขียนข้อความ</span>
            </a>
          </div>
        </div>

        <div
          class="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-amber-800 flex items-center gap-3">
              <div
                class="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white text-2xl"
              >
                📊
              </div>
              รายงานส่วนตัว
            </h3>
          </div>
          <div class="space-y-3">
            <a
              href="/reports/personal"
              class="group flex items-center gap-3 p-4 bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-xl hover:from-amber-500 hover:to-amber-600 transition-all duration-200 no-underline shadow-md hover:shadow-lg"
            >
              <div
                class="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-lg"
              >
                📋
              </div>
              <span class="font-medium">รายงานผลการเรียนของฉัน</span>
            </a>
            <a
              href="/reports/progress"
              class="group flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-amber-500 hover:text-white transition-all duration-200 no-underline shadow-sm hover:shadow-md"
            >
              <div
                class="w-8 h-8 bg-amber-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center text-lg"
              >
                📈
              </div>
              <span class="font-medium text-gray-700 group-hover:text-white"
                >ความก้าวหน้าการเรียน</span
              >
            </a>
          </div>
        </div>
      </div>
    {:else}
      <!-- Admin/Teacher Quick Actions Section -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {#if profile?.role === 'super_admin' || profile?.role === 'admin'}
          <div
            class="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-indigo-800 flex items-center gap-3">
                <div
                  class="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white text-2xl"
                >
                  🔧
                </div>
                การจัดการระบบ
              </h3>
            </div>
            <div class="space-y-3">
              <a
                href="/admin/users"
                class="group flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-indigo-500 hover:text-white transition-all duration-200 no-underline shadow-sm hover:shadow-md"
              >
                <div
                  class="w-8 h-8 bg-indigo-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center text-lg"
                >
                  👥
                </div>
                <span class="font-medium text-gray-700 group-hover:text-white">จัดการผู้ใช้</span>
              </a>
              <a
                href="/admin/zones"
                class="group flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-indigo-500 hover:text-white transition-all duration-200 no-underline shadow-sm hover:shadow-md"
              >
                <div
                  class="w-8 h-8 bg-indigo-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center text-lg"
                >
                  🏫
                </div>
                <span class="font-medium text-gray-700 group-hover:text-white">จัดการโซน</span>
              </a>
              <a
                href="/admin/groups"
                class="group flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-indigo-500 hover:text-white transition-all duration-200 no-underline shadow-sm hover:shadow-md"
              >
                <div
                  class="w-8 h-8 bg-indigo-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center text-lg"
                >
                  👨‍👩‍👧‍👦
                </div>
                <span class="font-medium text-gray-700 group-hover:text-white">จัดการกลุ่ม</span>
              </a>
              <a
                href="/admin/subjects"
                class="group flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-indigo-500 hover:text-white transition-all duration-200 no-underline shadow-sm hover:shadow-md"
              >
                <div
                  class="w-8 h-8 bg-indigo-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center text-lg"
                >
                  📚
                </div>
                <span class="font-medium text-gray-700 group-hover:text-white">จัดการวิชาเรียน</span
                >
              </a>
              <a
                href="/admin/setup-database"
                class="group flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-indigo-500 hover:text-white transition-all duration-200 no-underline shadow-sm hover:shadow-md"
              >
                <div
                  class="w-8 h-8 bg-indigo-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center text-lg"
                >
                  🗄️
                </div>
                <span class="font-medium text-gray-700 group-hover:text-white"
                  >ตั้งค่าฐานข้อมูล</span
                >
              </a>
              <a
                href="/admin/populate-quiz-data"
                class="group flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-indigo-500 hover:text-white transition-all duration-200 no-underline shadow-sm hover:shadow-md"
              >
                <div
                  class="w-8 h-8 bg-indigo-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center text-lg"
                >
                  🧩
                </div>
                <span class="font-medium text-gray-700 group-hover:text-white"
                  >เพิ่มข้อมูลแบบทดสอบ</span
                >
              </a>
            </div>
          </div>
        {/if}

        {#if profile?.role === 'teacher'}
          <div
            class="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-emerald-800 flex items-center gap-3">
                <div
                  class="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-2xl"
                >
                  📖
                </div>
                การสอน
              </h3>
            </div>
            <div class="space-y-3">
              <a
                href="/courses/create"
                class="group flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-emerald-500 hover:text-white transition-all duration-200 no-underline shadow-sm hover:shadow-md"
              >
                <div
                  class="w-8 h-8 bg-emerald-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center text-lg"
                >
                  ➕
                </div>
                <span class="font-medium text-gray-700 group-hover:text-white"
                  >สร้างหลักสูตรใหม่</span
                >
              </a>
              <a
                href="/courses"
                class="group flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-emerald-500 hover:text-white transition-all duration-200 no-underline shadow-sm hover:shadow-md"
              >
                <div
                  class="w-8 h-8 bg-emerald-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center text-lg"
                >
                  📋
                </div>
                <span class="font-medium text-gray-700 group-hover:text-white">จัดการหลักสูตร</span>
              </a>
              <a
                href="/lms"
                class="group flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-emerald-500 hover:text-white transition-all duration-200 no-underline shadow-sm hover:shadow-md"
              >
                <div
                  class="w-8 h-8 bg-emerald-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center text-lg"
                >
                  🎓
                </div>
                <span class="font-medium text-gray-700 group-hover:text-white">ระบบ LMS</span>
              </a>
              <a
                href="/reports/teaching"
                class="group flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-emerald-500 hover:text-white transition-all duration-200 no-underline shadow-sm hover:shadow-md"
              >
                <div
                  class="w-8 h-8 bg-emerald-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center text-lg"
                >
                  📈
                </div>
                <span class="font-medium text-gray-700 group-hover:text-white">รายงานการสอน</span>
              </a>
            </div>
          </div>
        {/if}

        <div
          class="bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-rose-800 flex items-center gap-3">
              <div
                class="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center text-white text-2xl"
              >
                💬
              </div>
              การสื่อสาร
            </h3>
          </div>
          <div class="space-y-3">
            <a
              href="/messages"
              class="group flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-rose-500 hover:text-white transition-all duration-200 no-underline shadow-sm hover:shadow-md"
            >
              <div
                class="w-8 h-8 bg-rose-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center text-lg"
              >
                📨
              </div>
              <span class="font-medium text-gray-700 group-hover:text-white">ข้อความใหม่</span>
            </a>
            <a
              href="/messages/compose"
              class="group flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-rose-500 hover:text-white transition-all duration-200 no-underline shadow-sm hover:shadow-md"
            >
              <div
                class="w-8 h-8 bg-rose-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center text-lg"
              >
                ✍️
              </div>
              <span class="font-medium text-gray-700 group-hover:text-white">เขียนข้อความ</span>
            </a>
            <a
              href="/messages/sent"
              class="group flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-rose-500 hover:text-white transition-all duration-200 no-underline shadow-sm hover:shadow-md"
            >
              <div
                class="w-8 h-8 bg-rose-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center text-lg"
              >
                📤
              </div>
              <span class="font-medium text-gray-700 group-hover:text-white">ข้อความที่ส่ง</span>
            </a>
          </div>
        </div>

        <div
          class="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-amber-800 flex items-center gap-3">
              <div
                class="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white text-2xl"
              >
                📊
              </div>
              รายงาน
            </h3>
          </div>
          <div class="space-y-3">
            <a
              href="/reports"
              class="group flex items-center gap-3 p-4 bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-xl hover:from-amber-500 hover:to-amber-600 transition-all duration-200 no-underline shadow-md hover:shadow-lg"
            >
              <div
                class="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-lg"
              >
                📋
              </div>
              <span class="font-medium">ศูนย์รายงานทั้งหมด</span>
            </a>
            <a
              href="/reports/academic"
              class="group flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-amber-500 hover:text-white transition-all duration-200 no-underline shadow-sm hover:shadow-md"
            >
              <div
                class="w-8 h-8 bg-amber-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center text-lg"
              >
                🎯
              </div>
              <span class="font-medium text-gray-700 group-hover:text-white">รายงานผลการเรียน</span>
            </a>
            <a
              href="/reports/usage"
              class="group flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-amber-500 hover:text-white transition-all duration-200 no-underline shadow-sm hover:shadow-md"
            >
              <div
                class="w-8 h-8 bg-amber-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center text-lg"
              >
                📈
              </div>
              <span class="font-medium text-gray-700 group-hover:text-white">รายงานการใช้งาน</span>
            </a>
            <a
              href="/reports/statistics"
              class="group flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-amber-500 hover:text-white transition-all duration-200 no-underline shadow-sm hover:shadow-md"
            >
              <div
                class="w-8 h-8 bg-amber-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center text-lg"
              >
                📊
              </div>
              <span class="font-medium text-gray-700 group-hover:text-white">สถิติระบบ</span>
            </a>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}
