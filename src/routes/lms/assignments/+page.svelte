<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import { goto } from '$app/navigation';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';
  import Button from '$components/Button.svelte';

  let user = null;
  let profile = null;
  let loading = true;
  let assignments = [];
  let filteredAssignments = [];
  let selectedStatus = 'all';
  let selectedSubject = '';
  let subjects = [];

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
    
    await loadSubjects();
    await loadAssignments();
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

  async function loadSubjects() {
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .order('name');
    
    subjects = data || [];
  }

  async function loadAssignments() {
    try {
      const { data } = await supabase
        .from('course_assignments')
        .select(`
          *,
          courses(
            *,
            subjects(name, code),
            profiles!courses_teacher_id_fkey(full_name)
          )
        `)
        .eq('student_id', user.id)
        .order('due_date', { ascending: true });

      assignments = (data || []).map(assignment => ({
        ...assignment,
        daysLeft: assignment.due_date ? Math.ceil((new Date(assignment.due_date) - new Date()) / (1000 * 60 * 60 * 24)) : null,
        isOverdue: assignment.due_date ? new Date(assignment.due_date) < new Date() : false
      }));

      filterAssignments();
    } catch (error) {
      console.error('Error loading assignments:', error);
      // If table doesn't exist, show empty assignments
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        assignments = [];
        filterAssignments();
      }
    }
  }

  function filterAssignments() {
    filteredAssignments = assignments.filter(assignment => {
      const statusMatch = selectedStatus === 'all' || assignment.status === selectedStatus;
      const subjectMatch = selectedSubject === '' || assignment.courses?.subject_id === selectedSubject;
      return statusMatch && subjectMatch;
    });
  }

  function formatDate(dateString) {
    if (!dateString) return 'ไม่ระบุ';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function getStatusColor(status) {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusText(status) {
    switch (status) {
      case 'completed': return 'เสร็จแล้ว';
      case 'in_progress': return 'กำลังทำ';
      case 'submitted': return 'ส่งแล้ว';
      case 'overdue': return 'เลยกำหนด';
      case 'assigned': return 'ได้รับมอบหมาย';
      default: return 'ไม่ระบุ';
    }
  }

  function getPriorityColor(daysLeft, isOverdue) {
    if (isOverdue) return 'border-l-red-500';
    if (daysLeft <= 3) return 'border-l-orange-500';
    if (daysLeft <= 7) return 'border-l-yellow-500';
    return 'border-l-green-500';
  }

  $: {
    filterAssignments();
  }
</script>

<svelte:head>
  <title>งานที่ได้รับมอบหมาย - ระบบ LMS</title>
</svelte:head>

{#if loading}
  <div class="flex justify-center items-center py-12">
    <LoadingSpinner size="lg" text="กำลังโหลดงานที่ได้รับมอบหมาย..." />
  </div>
{:else}
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="bg-gradient-to-br from-red-50 to-pink-100 rounded-2xl shadow-lg border border-red-200 p-8 mb-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg">
            📋
          </div>
          <div>
            <h1 class="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">งานที่ได้รับมอบหมาย</h1>
            <p class="text-gray-700 text-lg mt-1">ติดตามและจัดการงานที่ครูมอบหมายให้</p>
          </div>
        </div>
        <div class="flex gap-3">
          <Button href="/lms/browse" variant="outline">
            เรียนเนื้อหาสาธารณะ
          </Button>
          <Button href="/dashboard" variant="outline">
            ← กลับ
          </Button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-gradient-to-r from-white to-red-50 rounded-2xl shadow-lg border border-red-200 p-6 mb-8">
      <div class="flex flex-col md:flex-row gap-6">
        <div class="flex-1">
          <label class="block text-sm font-bold text-gray-700 mb-3">สถานะ</label>
          <select
            bind:value={selectedStatus}
            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm bg-white"
          >
            <option value="all">ทั้งหมด</option>
            <option value="assigned">ได้รับมอบหมาย</option>
            <option value="in_progress">กำลังทำ</option>
            <option value="submitted">ส่งแล้ว</option>
            <option value="completed">เสร็จแล้ว</option>
          </select>
        </div>
        <div class="flex-1">
          <label class="block text-sm font-bold text-gray-700 mb-3">วิชา</label>
          <select
            bind:value={selectedSubject}
            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm bg-white"
          >
            <option value="">ทุกวิชา</option>
            {#each subjects as subject}
              <option value={subject.id}>{subject.name}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <!-- Assignments List -->
    <div class="space-y-6">
      {#each filteredAssignments as assignment}
        <div class="bg-white rounded-2xl shadow-lg border-l-4 {getPriorityColor(assignment.daysLeft, assignment.isOverdue)} p-6 hover:shadow-xl transition-all duration-300">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-xl font-bold text-gray-900">{assignment.courses?.title || 'ไม่ระบุ'}</h3>
                <span class="px-3 py-1 text-sm font-medium rounded-full {getStatusColor(assignment.status)}">
                  {getStatusText(assignment.status)}
                </span>
              </div>
              
              <div class="flex items-center gap-6 text-sm text-gray-600 mb-3">
                <span class="flex items-center gap-2">
                  <span class="text-blue-600">📚</span>
                  {assignment.courses?.subjects?.name || 'ไม่ระบุ'}
                </span>
                <span class="flex items-center gap-2">
                  <span class="text-green-600">👨‍🏫</span>
                  {assignment.courses?.profiles?.full_name || 'ไม่ระบุ'}
                </span>
                {#if assignment.due_date}
                  <span class="flex items-center gap-2">
                    <span class="text-orange-600">📅</span>
                    {formatDate(assignment.due_date)}
                  </span>
                {/if}
              </div>

              {#if assignment.description}
                <p class="text-gray-700 mb-4">{assignment.description}</p>
              {/if}

              {#if assignment.due_date}
                <div class="flex items-center gap-2 text-sm">
                  {#if assignment.isOverdue}
                    <span class="px-2 py-1 bg-red-100 text-red-800 rounded-full font-medium">
                      ⚠️ เลยกำหนดแล้ว
                    </span>
                  {:else if assignment.daysLeft <= 3}
                    <span class="px-2 py-1 bg-orange-100 text-orange-800 rounded-full font-medium">
                      🔥 เหลือ {assignment.daysLeft} วัน
                    </span>
                  {:else if assignment.daysLeft <= 7}
                    <span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                      ⏰ เหลือ {assignment.daysLeft} วัน
                    </span>
                  {:else}
                    <span class="px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                      ✅ เหลือ {assignment.daysLeft} วัน
                    </span>
                  {/if}
                </div>
              {/if}
            </div>

            <div class="flex flex-col gap-3 ml-6">
              <Button href="/lms/course/{assignment.course_id}" variant="primary" size="sm">
                ดูรายละเอียด
              </Button>
              {#if assignment.status === 'assigned' || assignment.status === 'in_progress'}
                <Button href="/lms/course/{assignment.course_id}" variant="outline" size="sm">
                  เริ่มทำงาน
                </Button>
              {/if}
            </div>
          </div>

          <!-- Progress Bar (if applicable) -->
          {#if assignment.progress !== undefined}
            <div class="mt-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">ความก้าวหน้า</span>
                <span class="text-sm text-gray-500">{assignment.progress}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-gradient-to-r from-red-400 to-pink-400 h-2 rounded-full transition-all duration-300" 
                  style="width: {assignment.progress}%"
                ></div>
              </div>
            </div>
          {/if}
        </div>
      {:else}
        <div class="text-center py-16">
          <div class="w-24 h-24 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6">
            📋
          </div>
          <h3 class="text-2xl font-bold text-gray-900 mb-4">ไม่มีงานที่ได้รับมอบหมาย</h3>
          <p class="text-gray-600 mb-8">
            {#if selectedStatus !== 'all' || selectedSubject !== ''}
              ไม่พบงานที่ตรงกับเงื่อนไขที่เลือก ลองเปลี่ยนตัวกรองดู
            {:else}
              คุณยังไม่มีงานที่ได้รับมอบหมายจากครู
            {/if}
          </p>
          <div class="flex justify-center gap-4">
            <Button href="/lms/browse" variant="primary">
              เรียนเนื้อหาสาธารณะ
            </Button>
            <Button href="/dashboard" variant="outline">
              กลับหน้าหลัก
            </Button>
          </div>
        </div>
      {/each}
    </div>

    <!-- Summary Stats -->
    {#if assignments.length > 0}
      <div class="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg text-center">
          <div class="text-3xl font-bold">{assignments.length}</div>
          <div class="text-blue-100 text-sm">งานทั้งหมด</div>
        </div>
        
        <div class="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg text-center">
          <div class="text-3xl font-bold">{assignments.filter(a => a.status === 'completed').length}</div>
          <div class="text-green-100 text-sm">เสร็จแล้ว</div>
        </div>
        
        <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-2xl shadow-lg text-center">
          <div class="text-3xl font-bold">{assignments.filter(a => a.status === 'in_progress').length}</div>
          <div class="text-yellow-100 text-sm">กำลังทำ</div>
        </div>
        
        <div class="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-2xl shadow-lg text-center">
          <div class="text-3xl font-bold">{assignments.filter(a => a.isOverdue).length}</div>
          <div class="text-red-100 text-sm">เลยกำหนด</div>
        </div>
      </div>
    {/if}
  </div>
{/if}