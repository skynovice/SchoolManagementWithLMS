<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import { goto } from '$app/navigation';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';

  let user = null;
  let profile = null;
  let loading = true;
  let personalStats = {
    totalTopics: 0,
    completedTopics: 0,
    totalQuizzes: 0,
    passedQuizzes: 0,
    averageScore: 0,
    totalStudyTime: 0,
    currentStreak: 0,
    monthlyProgress: [],
    subjectBreakdown: [],
    recentAchievements: []
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
    
    await loadPersonalStats();
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

  async function loadPersonalStats() {
    try {
      const [
        progressRes,
        quizAttemptsRes,
        topicsRes,
        subjectsRes
      ] = await Promise.all([
        supabase.from('student_progress').select(`
          *,
          learning_topics(
            *,
            subjects(name, code)
          )
        `).eq('student_id', user.id),
        supabase.from('quiz_attempts').select('*').eq('student_id', user.id),
        supabase.from('learning_topics').select('id').eq('is_published', true),
        supabase.from('subjects').select('*')
      ]);

      const progress = progressRes.data || [];
      const quizAttempts = quizAttemptsRes.data || [];
      const allTopics = topicsRes.data || [];
      const subjects = subjectsRes.data || [];

      // Calculate basic stats
      const completedTopics = progress.filter(p => p.is_completed);
      const passedQuizzes = quizAttempts.filter(q => q.is_passed);
      const totalScore = quizAttempts.reduce((sum, q) => sum + (q.score || 0), 0);
      const averageScore = quizAttempts.length > 0 ? totalScore / quizAttempts.length : 0;

      // Calculate study time
      const totalStudyTime = progress.reduce((sum, p) => {
        return sum + Math.floor((p.completion_percentage || 0) * 0.5);
      }, 0);

      // Calculate streak
      const recentActivity = progress
        .map(p => new Date(p.updated_at))
        .sort((a, b) => b - a);
      
      let currentStreak = 0;
      if (recentActivity.length > 0) {
        const today = new Date();
        const daysDiff = Math.floor((today - recentActivity[0]) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 1) {
          currentStreak = Math.min(30, recentActivity.length);
        }
      }

      // Monthly progress
      const monthlyProgress = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);
        
        const monthProgress = progress.filter(p => {
          const updatedAt = new Date(p.updated_at);
          return updatedAt >= monthStart && updatedAt <= monthEnd;
        });
        
        const monthCompleted = monthProgress.filter(p => p.is_completed).length;
        
        monthlyProgress.push({
          month: monthStart.toLocaleDateString('th-TH', { month: 'short' }),
          completed: monthCompleted,
          total: monthProgress.length
        });
      }

      // Subject breakdown
      const subjectBreakdown = subjects.map(subject => {
        const subjectProgress = progress.filter(p => 
          p.learning_topics?.subjects?.id === subject.id
        );
        const subjectCompleted = subjectProgress.filter(p => p.is_completed);
        const subjectQuizzes = quizAttempts.filter(q => {
          const progressItem = progress.find(p => p.topic_id === q.topic_id);
          return progressItem?.learning_topics?.subjects?.id === subject.id;
        });
        const subjectPassed = subjectQuizzes.filter(q => q.is_passed);
        
        return {
          name: subject.name,
          code: subject.code,
          totalTopics: subjectProgress.length,
          completedTopics: subjectCompleted.length,
          completionRate: subjectProgress.length > 0 ? (subjectCompleted.length / subjectProgress.length) * 100 : 0,
          quizzesPassed: subjectPassed.length,
          totalQuizzes: subjectQuizzes.length
        };
      }).filter(s => s.totalTopics > 0);

      // Recent achievements
      const recentAchievements = [];
      
      // Add completion achievements
      const recentCompletions = completedTopics
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 3);
      
      recentCompletions.forEach(completion => {
        recentAchievements.push({
          type: 'completion',
          title: 'เรียนจบหัวข้อ',
          description: completion.learning_topics?.title || 'ไม่ระบุ',
          date: completion.updated_at,
          icon: '🎓'
        });
      });

      // Add quiz achievements
      const recentQuizPasses = passedQuizzes
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 2);
      
      recentQuizPasses.forEach(quiz => {
        recentAchievements.push({
          type: 'quiz',
          title: 'ผ่านแบบทดสอบ',
          description: `คะแนน ${Math.round(quiz.score)}%`,
          date: quiz.created_at,
          icon: '🏆'
        });
      });

      // Sort achievements by date
      recentAchievements.sort((a, b) => new Date(b.date) - new Date(a.date));

      personalStats = {
        totalTopics: allTopics.length,
        completedTopics: completedTopics.length,
        totalQuizzes: quizAttempts.length,
        passedQuizzes: passedQuizzes.length,
        averageScore: Math.round(averageScore * 10) / 10,
        totalStudyTime: totalStudyTime,
        currentStreak: currentStreak,
        monthlyProgress: monthlyProgress,
        subjectBreakdown: subjectBreakdown,
        recentAchievements: recentAchievements.slice(0, 5)
      };

    } catch (error) {
      console.error('Error loading personal stats:', error);
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>รายงานผลการเรียนส่วนตัว - ระบบ LMS</title>
</svelte:head>

{#if loading}
  <div class="flex justify-center items-center py-12">
    <LoadingSpinner size="lg" text="กำลังโหลดรายงานส่วนตัว..." />
  </div>
{:else}
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl shadow-lg border border-purple-200 p-8 mb-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg">
            📊
          </div>
          <div>
            <h1 class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">รายงานผลการเรียนส่วนตัว</h1>
            <p class="text-gray-700 text-lg mt-1">ติดตามความก้าวหน้าและผลการเรียนของคุณ</p>
          </div>
        </div>
        <a href="/dashboard" class="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm hover:bg-white text-gray-700 rounded-xl transition-colors no-underline shadow-sm">
          <span>←</span>
          <span>กลับ</span>
        </a>
      </div>
    </div>

    <!-- Personal Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-100 text-sm font-medium">หัวข้อที่เรียนจบ</p>
            <p class="text-3xl font-bold">{personalStats.completedTopics}/{personalStats.totalTopics}</p>
          </div>
          <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
            🎓
          </div>
        </div>
      </div>
      
      <div class="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-100 text-sm font-medium">คะแนนเฉลี่ย</p>
            <p class="text-3xl font-bold">{personalStats.averageScore}%</p>
          </div>
          <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
            🎯
          </div>
        </div>
      </div>
      
      <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-purple-100 text-sm font-medium">แบบทดสอบผ่าน</p>
            <p class="text-3xl font-bold">{personalStats.passedQuizzes}/{personalStats.totalQuizzes}</p>
          </div>
          <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
            🏆
          </div>
        </div>
      </div>
      
      <div class="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-orange-100 text-sm font-medium">เวลาเรียนรวม</p>
            <p class="text-3xl font-bold">{personalStats.totalStudyTime}</p>
            <p class="text-orange-200 text-xs">นาที</p>
          </div>
          <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
            ⏱️
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Monthly Progress Chart -->
      <div class="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border border-blue-200 p-6">
        <h2 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
          <span class="text-3xl">📈</span>
          ความก้าวหน้ารายเดือน
        </h2>
        <div class="grid grid-cols-6 gap-2">
          {#each personalStats.monthlyProgress as month}
            <div class="text-center">
              <div class="text-xs text-gray-500 mb-2">{month.month}</div>
              <div class="bg-blue-100 rounded-lg p-3">
                <div class="text-lg font-bold text-blue-600">{month.completed}</div>
                <div class="text-xs text-gray-600">หัวข้อ</div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Recent Achievements -->
      <div class="bg-gradient-to-br from-white to-yellow-50 rounded-2xl shadow-lg border border-yellow-200 p-6">
        <h2 class="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
          <span class="text-3xl">🏅</span>
          ความสำเร็จล่าสุด
        </h2>
        <div class="space-y-4">
          {#each personalStats.recentAchievements as achievement}
            <div class="flex items-center gap-4 p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-yellow-100">
              <div class="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-white text-xl">
                {achievement.icon}
              </div>
              <div class="flex-1">
                <h4 class="font-semibold text-gray-800">{achievement.title}</h4>
                <p class="text-sm text-gray-600">{achievement.description}</p>
                <p class="text-xs text-gray-500">{formatDate(achievement.date)}</p>
              </div>
            </div>
          {:else}
            <div class="text-center py-8">
              <div class="text-4xl mb-2">🎯</div>
              <p class="text-gray-600">ยังไม่มีความสำเร็จ เริ่มเรียนเพื่อสร้างความสำเร็จแรก!</p>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Subject Breakdown -->
    <div class="bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-lg border border-green-200 p-6">
      <h2 class="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
        <span class="text-3xl">📚</span>
        ผลการเรียนแยกตามวิชา
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each personalStats.subjectBreakdown as subject}
          <div class="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-green-100 hover:shadow-md transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-gray-800">{subject.name}</h3>
              <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                {subject.code}
              </span>
            </div>
            
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-600">หัวข้อที่เรียนจบ</span>
                  <span class="font-medium">{subject.completedTopics}/{subject.totalTopics}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full transition-all duration-300" style="width: {subject.completionRate}%"></div>
                </div>
              </div>
              
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">แบบทดสอบผ่าน:</span>
                <span class="font-medium text-green-600">{subject.quizzesPassed}/{subject.totalQuizzes}</span>
              </div>
              
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">{Math.round(subject.completionRate)}%</div>
                <div class="text-xs text-gray-500">ความสำเร็จ</div>
              </div>
            </div>
          </div>
        {:else}
          <div class="col-span-full text-center py-8">
            <div class="text-4xl mb-2">📖</div>
            <p class="text-gray-600">ยังไม่มีข้อมูลการเรียนในวิชาต่างๆ</p>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}