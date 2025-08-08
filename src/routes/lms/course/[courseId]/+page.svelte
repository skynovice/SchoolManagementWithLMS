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
  let loading = true;
  let enrolled = false;
  let enrollment = null;

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

      // Check if user is enrolled
      if (profile?.role === 'student') {
        const { data: enrollmentData } = await supabase
          .from('course_enrollments')
          .select('*')
          .eq('course_id', courseId)
          .eq('student_id', user.id)
          .single();

        if (enrollmentData) {
          enrolled = true;
          enrollment = enrollmentData;
        }
      }

    } catch (error) {
      console.error('Error loading course:', error);
      goto('/lms/browse');
    } finally {
      loading = false;
    }
  }

  async function enrollInCourse() {
    if (!user || profile?.role !== 'student') return;

    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .insert({
          course_id: courseId,
          student_id: user.id,
          progress: 0,
          enrolled_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      enrolled = true;
      enrollment = data;
      alert('ลงทะเบียนเรียนสำเร็จ!');
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('เกิดข้อผิดพลาดในการลงทะเบียน');
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'ไม่ระบุ';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>{course?.title || 'กำลังโหลด...'} - หลักสูตร</title>
</svelte:head>

{#if loading}
  <div class="flex justify-center items-center py-12">
    <LoadingSpinner size="lg" text="กำลังโหลดหลักสูตร..." />
  </div>
{:else if course}
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Course Header -->
    <div class="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl shadow-lg border border-purple-200 p-8">
      <div class="flex items-start justify-between mb-6">
        <div class="flex-1">
          <div class="flex items-center space-x-3 mb-4">
            <span class="text-sm font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm">
              {course.subjects?.code || 'N/A'}
            </span>
            {#if course.is_published}
              <span class="text-sm font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm">
                เผยแพร่แล้ว
              </span>
            {:else}
              <span class="text-sm font-semibold px-3 py-1 rounded-full bg-gray-400 text-white shadow-sm">
                ร่าง
              </span>
            {/if}
          </div>
          
          <h1 class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">{course.title}</h1>
          
          {#if course.description}
            <p class="text-gray-700 mb-8 text-lg leading-relaxed">{course.description}</p>
          {/if}
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl">
              <span class="text-purple-600 text-lg">📚</span>
              <span class="text-gray-600">วิชา:</span>
              <span class="font-semibold text-gray-800">{course.subjects?.name || 'ไม่ระบุ'}</span>
            </div>
            <div class="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl">
              <span class="text-green-600 text-lg">👨‍🏫</span>
              <span class="text-gray-600">ครูผู้สอน:</span>
              <span class="font-semibold text-gray-800">{course.profiles?.full_name || 'ไม่ระบุ'}</span>
            </div>
            <div class="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl">
              <span class="text-blue-600 text-lg">📅</span>
              <span class="text-gray-600">สร้างเมื่อ:</span>
              <span class="font-semibold text-gray-800">{formatDate(course.created_at)}</span>
            </div>
            <div class="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl">
              <span class="text-orange-600 text-lg">🔄</span>
              <span class="text-gray-600">อัปเดตล่าสุด:</span>
              <span class="font-semibold text-gray-800">{formatDate(course.updated_at)}</span>
            </div>
          </div>
        </div>
        
        <div class="ml-6">
          <Button href="/lms/assignments" variant="outline" size="sm">
            ← กลับ
          </Button>
        </div>
      </div>

      <!-- Enrollment Status -->
      {#if profile?.role === 'student'}
        {#if enrolled && enrollment}
          <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-semibold text-green-800">คุณได้ลงทะเบียนเรียนแล้ว</h3>
                <p class="text-green-700 text-sm">
                  ความก้าวหน้า: {Math.round(enrollment.progress || 0)}%
                </p>
              </div>
              <div class="text-green-600">
                ✅
              </div>
            </div>
            
            {#if enrollment.progress > 0}
              <div class="mt-3">
                <div class="w-full bg-green-200 rounded-full h-2">
                  <div 
                    class="bg-green-500 h-2 rounded-full transition-all duration-300" 
                    style="width: {enrollment.progress}%"
                  ></div>
                </div>
              </div>
            {/if}
          </div>
        {:else}
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-semibold text-blue-800">ลงทะเบียนเรียน</h3>
                <p class="text-blue-700 text-sm">
                  คลิกเพื่อเริ่มเรียนหลักสูตรนี้
                </p>
              </div>
              <Button on:click={enrollInCourse} variant="primary" size="sm">
                ลงทะเบียน
              </Button>
            </div>
          </div>
        {/if}
      {/if}
    </Card>

    <!-- Course Content -->
    <Card class="p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">เนื้อหาหลักสูตร</h2>
      
      {#if course.content && Object.keys(course.content).length > 0}
        <div class="prose max-w-none">
          {#if course.content.description}
            <p>{course.content.description}</p>
          {/if}
          
          {#if course.content.objectives}
            <h3>วัตถุประสงค์การเรียนรู้</h3>
            <ul>
              {#each course.content.objectives as objective}
                <li>{objective}</li>
              {/each}
            </ul>
          {/if}
          
          {#if course.content.modules}
            <h3>โมดูลการเรียน</h3>
            <ol>
              {#each course.content.modules as module}
                <li>
                  <strong>{module.title}</strong>
                  {#if module.description}
                    <p>{module.description}</p>
                  {/if}
                </li>
              {/each}
            </ol>
          {/if}
        </div>
      {:else}
        <div class="text-center py-8">
          <div class="text-4xl mb-4">📚</div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">เนื้อหาหลักสูตร</h3>
          <p class="text-gray-600">
            หลักสูตรนี้ยังไม่มีเนื้อหาที่ละเอียด กรุณาติดต่อครูผู้สอนสำหรับข้อมูลเพิ่มเติม
          </p>
        </div>
      {/if}
    </Card>

    <!-- Actions -->
    <div class="flex justify-center gap-4">
      <Button href="/lms/assignments" variant="outline">
        กลับไปดูงาน
      </Button>
      
      {#if enrolled}
        <Button href="/lms/browse" variant="primary">
          เริ่มเรียน
        </Button>
      {/if}
      
      <Button href="/lms/browse" variant="outline">
        ดูหลักสูตรอื่น
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