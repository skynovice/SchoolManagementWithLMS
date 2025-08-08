<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase.js';
  import { goto } from '$app/navigation';
  import Card from '$components/Card.svelte';
  import Button from '$components/Button.svelte';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';

  let user = null;
  let profile = null;
  let course = null;
  let enrollment = null;
  let activities = [];
  let loading = true;

  $: courseId = $page.params.courseId;

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      // Get user session
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

      // Load course with related data
      const { data: courseData } = await supabase
        .from('courses')
        .select(`
          *,
          subjects(name, code),
          profiles!courses_teacher_id_fkey(full_name)
        `)
        .eq('id', courseId)
        .single();

      if (!courseData) {
        goto('/lms/browse');
        return;
      }

      course = courseData;

      // Load enrollment if student
      if (profile?.role === 'student') {
        const { data: enrollmentData } = await supabase
          .from('course_enrollments')
          .select('*')
          .eq('course_id', courseId)
          .eq('student_id', user.id)
          .single();

        enrollment = enrollmentData;

        // Load activities
        const { data: activitiesData } = await supabase
          .from('course_activities')
          .select('*')
          .eq('course_id', courseId)
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        activities = activitiesData || [];
      }

    } catch (error) {
      console.error('Error loading course details:', error);
      goto('/lms/browse');
    } finally {
      loading = false;
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'ไม่ระบุ';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getActivityIcon(activityType) {
    const icons = {
      'enrollment': '📝',
      'lesson_start': '▶️',
      'lesson_complete': '✅',
      'quiz_attempt': '🧩',
      'assignment_submit': '📤',
      'resource_view': '👁️'
    };
    return icons[activityType] || '📋';
  }

  function getActivityDescription(activity) {
    const descriptions = {
      'enrollment': 'ลงทะเบียนเรียน',
      'lesson_start': 'เริ่มเรียนบทเรียน',
      'lesson_complete': 'เรียนจบบทเรียน',
      'quiz_attempt': 'ทำแบบทดสอบ',
      'assignment_submit': 'ส่งงาน',
      'resource_view': 'ดูทรัพยากร'
    };
    return descriptions[activity.activity_type] || activity.activity_type;
  }
</script>

<svelte:head>
  <title>รายละเอียด - {course?.title || 'กำลังโหลด...'}</title>
</svelte:head>

{#if loading}
  <div class="flex justify-center items-center py-12">
    <LoadingSpinner size="lg" text="กำลังโหลดรายละเอียด..." />
  </div>
{:else if course}
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-2xl shadow-lg border border-indigo-200 p-8 mb-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg">
            📋
          </div>
          <div>
            <h1 class="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">รายละเอียดหลักสูตร</h1>
            <p class="text-gray-700 text-lg mt-1">{course.title}</p>
          </div>
        </div>
        <Button href="/lms/course/{courseId}" variant="outline">
          ← กลับ
        </Button>
      </div>
    </div>

    <!-- Course Summary -->
    <div class="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border border-blue-200 p-8">
      <h2 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
        <span class="text-3xl">📊</span>
        ข้อมูลหลักสูตร
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div class="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl">
            <span class="text-blue-600 text-lg">📚</span>
            <span class="text-gray-600">ชื่อหลักสูตร:</span>
            <span class="font-semibold text-gray-800">{course.title}</span>
          </div>
          <div class="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl">
            <span class="text-green-600 text-lg">📖</span>
            <span class="text-gray-600">วิชา:</span>
            <span class="font-semibold text-gray-800">{course.subjects?.name || 'ไม่ระบุ'}</span>
          </div>
          <div class="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl">
            <span class="text-purple-600 text-lg">🔢</span>
            <span class="text-gray-600">รหัสวิชา:</span>
            <span class="font-semibold text-gray-800">{course.subjects?.code || 'ไม่ระบุ'}</span>
          </div>
          <div class="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl">
            <span class="text-orange-600 text-lg">👨‍🏫</span>
            <span class="text-gray-600">ครูผู้สอน:</span>
            <span class="font-semibold text-gray-800">{course.profiles?.full_name || 'ไม่ระบุ'}</span>
          </div>
        </div>
        
        <div class="space-y-4">
          <div class="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl">
            <span class="text-teal-600 text-lg">📡</span>
            <span class="text-gray-600">สถานะ:</span>
            <span class="font-semibold">
              {#if course.is_published}
                <span class="text-green-600">เผยแพร่แล้ว</span>
              {:else}
                <span class="text-gray-600">ร่าง</span>
              {/if}
            </span>
          </div>
          <div class="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl">
            <span class="text-blue-600 text-lg">📅</span>
            <span class="text-gray-600">สร้างเมื่อ:</span>
            <span class="font-semibold text-gray-800">{formatDate(course.created_at)}</span>
          </div>
          <div class="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl">
            <span class="text-pink-600 text-lg">🔄</span>
            <span class="text-gray-600">อัปเดตล่าสุด:</span>
            <span class="font-semibold text-gray-800">{formatDate(course.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Enrollment Status (for students) -->
    {#if profile?.role === 'student'}
      <div class="bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-lg border border-green-200 p-8">
        <h2 class="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
          <span class="text-3xl">📈</span>
          สถานะการเรียน
        </h2>
        
        {#if enrollment}
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-gray-700">ความก้าวหน้า:</span>
              <span class="text-2xl font-bold text-blue-600">{Math.round(enrollment.progress || 0)}%</span>
            </div>
            
            <div class="w-full bg-gray-200 rounded-full h-3">
              <div 
                class="bg-blue-500 h-3 rounded-full transition-all duration-300" 
                style="width: {enrollment.progress || 0}%"
              ></div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div class="text-center p-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl shadow-lg border border-green-200">
                <div class="text-3xl font-bold text-green-600 mb-2">
                  {formatDate(enrollment.enrolled_at).split(' ')[0]}
                </div>
                <div class="text-sm font-medium text-gray-700">วันที่ลงทะเบียน</div>
              </div>
              
              <div class="text-center p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl shadow-lg border border-blue-200">
                <div class="text-3xl font-bold text-blue-600 mb-2">
                  {enrollment.score ? Math.round(enrollment.score) : '-'}
                </div>
                <div class="text-sm font-medium text-gray-700">คะแนนรวม</div>
              </div>
              
              <div class="text-center p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl shadow-lg border border-purple-200">
                <div class="text-3xl font-bold text-purple-600 mb-2">
                  {enrollment.completed_at ? '✅' : '⏳'}
                </div>
                <div class="text-sm font-medium text-gray-700">
                  {enrollment.completed_at ? 'เรียนจบแล้ว' : 'กำลังเรียน'}
                </div>
              </div>
            </div>
          </div>
        {:else}
          <div class="text-center py-8">
            <div class="text-4xl mb-4">📝</div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">ยังไม่ได้ลงทะเบียน</h3>
            <p class="text-gray-600 mb-4">คุณยังไม่ได้ลงทะเบียนเรียนหลักสูตรนี้</p>
            <Button href="/lms/course/{courseId}" variant="primary">
              ไปลงทะเบียน
            </Button>
          </div>
        {/if}
      </Card>

      <!-- Learning Activities -->
      {#if activities.length > 0}
        <div class="bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-lg border border-orange-200 p-8">
          <h2 class="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
            <span class="text-3xl">🎯</span>
            กิจกรรมการเรียน
          </h2>
          
          <div class="space-y-4">
            {#each activities as activity}
              <div class="flex items-start gap-4 p-6 bg-white/70 backdrop-blur-sm rounded-xl border border-orange-100 hover:shadow-md transition-all duration-300">
                <div class="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900 mb-1">
                    {getActivityDescription(activity)}
                  </h4>
                  <p class="text-sm text-gray-600 mb-2">
                    {formatDate(activity.created_at)}
                  </p>
                  {#if activity.activity_data && Object.keys(activity.activity_data).length > 0}
                    <div class="mt-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {JSON.stringify(activity.activity_data)}
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {/if}

    <!-- Course Content Preview -->
    {#if course.content && Object.keys(course.content).length > 0}
      <Card class="p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">เนื้อหาหลักสูตร</h2>
        
        <div class="prose max-w-none">
          {#if course.content.description}
            <div class="mb-4">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">คำอธิบาย</h3>
              <p class="text-gray-600">{course.content.description}</p>
            </div>
          {/if}
          
          {#if course.content.objectives}
            <div class="mb-4">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">วัตถุประสงค์การเรียนรู้</h3>
              <ul class="list-disc list-inside space-y-1">
                {#each course.content.objectives as objective}
                  <li class="text-gray-600">{objective}</li>
                {/each}
              </ul>
            </div>
          {/if}
          
          {#if course.content.modules}
            <div class="mb-4">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">โมดูลการเรียน</h3>
              <ol class="list-decimal list-inside space-y-2">
                {#each course.content.modules as module, index}
                  <li class="text-gray-600">
                    <strong>{module.title}</strong>
                    {#if module.description}
                      <p class="ml-6 mt-1 text-sm">{module.description}</p>
                    {/if}
                  </li>
                {/each}
              </ol>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Actions -->
    <div class="flex justify-center gap-4">
      <Button href="/lms/assignments" variant="outline">
        กลับไปดูงาน
      </Button>
      
      <Button href="/lms/course/{courseId}" variant="primary">
        ไปหน้าหลักสูตร
      </Button>
    </div>
  </div>
{:else}
  <div class="text-center py-12">
    <div class="text-6xl mb-4">❌</div>
    <h3 class="text-lg font-medium text-gray-900 mb-2">ไม่พบหลักสูตร</h3>
    <p class="text-gray-600 mb-6">หลักสูตรที่คุณต้องการไม่มีอยู่หรือถูกลบไปแล้ว</p>
    <Button href="/lms/browse" variant="primary">
      กลับไปเลือกเนื้อหา
    </Button>
  </div>
{/if}