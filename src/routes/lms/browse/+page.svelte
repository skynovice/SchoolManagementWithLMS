<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase.js';
  import Card from '$components/Card.svelte';
  import Button from '$components/Button.svelte';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';

  let user = null;
  let profile = null;
  let topics = [];
  let loading = true;
  let audienceFilter = 'all'; // all, student, teacher, parent
  let difficultyFilter = 'all'; // all, beginner, intermediate, advanced
  let subjectFilter = 'all';
  let subjects = [];

  $: {
    // Get filters from URL params
    audienceFilter = $page.url.searchParams.get('audience') || 'all';
    difficultyFilter = $page.url.searchParams.get('difficulty') || 'all';
    subjectFilter = $page.url.searchParams.get('subject') || 'all';
  }

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

      // Load subjects for filter
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      subjects = subjectsData || [];

      // Load topics with filters
      await loadTopics();

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      loading = false;
    }
  }

  async function loadTopics() {
    try {
      let query = supabase
        .from('learning_topics')
        .select(`
          *,
          subjects(name, code),
          profiles!learning_topics_teacher_id_fkey(full_name)
        `)
        .eq('is_published', true);

      // Apply filters
      if (difficultyFilter !== 'all') {
        query = query.eq('difficulty_level', difficultyFilter);
      }

      if (subjectFilter !== 'all') {
        query = query.eq('subject_id', subjectFilter);
      }

      const { data: topicsData } = await query.order('created_at', { ascending: false });

      topics = topicsData || [];

    } catch (error) {
      console.error('Error loading topics:', error);
    }
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

  function updateFilter(type, value) {
    const url = new URL($page.url);
    if (value === 'all') {
      url.searchParams.delete(type);
    } else {
      url.searchParams.set(type, value);
    }
    window.history.replaceState({}, '', url);
    
    if (type === 'audience') audienceFilter = value;
    if (type === 'difficulty') difficultyFilter = value;
    if (type === 'subject') subjectFilter = value;
    
    loadTopics();
  }

  // Filter topics based on audience (this is a client-side filter for demonstration)
  $: filteredTopics = topics.filter(topic => {
    if (audienceFilter === 'all') return true;
    
    // This is a simple implementation - in a real app, you'd have audience metadata
    // For now, we'll use topic title/description to infer audience
    const content = (topic.title + ' ' + topic.description).toLowerCase();
    
    switch (audienceFilter) {
      case 'student':
        return content.includes('นักเรียน') || content.includes('เด็ก') || topic.difficulty_level === 'beginner';
      case 'teacher':
        return content.includes('ครู') || content.includes('การสอน') || content.includes('การศึกษา');
      case 'parent':
        return content.includes('ผู้ปกครอง') || content.includes('พ่อแม่') || content.includes('ครอบครัว');
      default:
        return true;
    }
  });
</script>

<svelte:head>
  <title>เรียนรู้ - ระบบ LMS</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 rounded-3xl p-8 mb-8">
    <div class="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
    <div class="relative text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
        <span class="text-2xl">📖</span>
      </div>
      <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
        เรียนรู้
      </h1>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
        เนื้อหาการเรียนรู้สำหรับสมาชิกของระบบ LMS
      </p>
      
      {#if profile?.role === 'student' || profile?.role === 'parent'}
        <div class="inline-block p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-200 rounded-2xl backdrop-blur-sm">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span class="text-green-600">✅</span>
            </div>
            <p class="text-sm text-green-700 font-medium">
              คุณสามารถเรียนรู้และติดตามความก้าวหน้าได้แล้ว
            </p>
          </div>
        </div>
      {:else if profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'super_admin'}
        <div class="inline-block p-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-200 rounded-2xl backdrop-blur-sm">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span class="text-purple-600">🎓</span>
            </div>
            <div class="text-sm text-purple-700">
              <strong>ครู/ผู้ดูแล:</strong> คุณสามารถ 
              <a href="/lms/create" class="underline font-medium hover:text-purple-900 transition-colors">สร้างเนื้อหาใหม่</a> และ 
              <a href="/lms/assign" class="underline font-medium hover:text-purple-900 transition-colors">มอบหมายงาน</a> ได้
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Filters -->
  <div class="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
        <span class="text-blue-600">🔍</span>
      </div>
      <h3 class="text-lg font-semibold text-gray-900">กรองเนื้อหา</h3>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Audience Filter -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-3">กลุ่มเป้าหมาย</label>
        <div class="relative">
          <select 
            value={audienceFilter}
            on:change={(e) => updateFilter('audience', e.target.value)}
            class="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="all">ทั้งหมด</option>
            <option value="student">👨‍🎓 นักเรียน</option>
            <option value="teacher">👨‍🏫 ครู</option>
            <option value="parent">👨‍👩‍👧‍👦 ผู้ปกครอง</option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Difficulty Filter -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-3">ระดับความยาก</label>
        <div class="relative">
          <select 
            value={difficultyFilter}
            on:change={(e) => updateFilter('difficulty', e.target.value)}
            class="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="all">ทั้งหมด</option>
            <option value="beginner">🟢 เริ่มต้น</option>
            <option value="intermediate">🟡 ปานกลาง</option>
            <option value="advanced">🔴 ขั้นสูง</option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Subject Filter -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-3">วิชา</label>
        <div class="relative">
          <select 
            value={subjectFilter}
            on:change={(e) => updateFilter('subject', e.target.value)}
            class="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="all">ทั้งหมด</option>
            {#each subjects as subject}
              <option value={subject.id}>📚 {subject.name}</option>
            {/each}
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Results Count -->
  <div class="flex items-center justify-between">
    <p class="text-gray-600">
      พบ <span class="font-semibold">{filteredTopics.length}</span> หัวข้อการเรียนรู้
    </p>
    
    {#if audienceFilter !== 'all' || difficultyFilter !== 'all' || subjectFilter !== 'all'}
      <button 
        on:click={() => {
          updateFilter('audience', 'all');
          updateFilter('difficulty', 'all');
          updateFilter('subject', 'all');
        }}
        class="text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        ล้างตัวกรอง
      </button>
    {/if}
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" text="กำลังโหลดเนื้อหา..." />
    </div>
  {:else if filteredTopics.length > 0}
    <!-- Topics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filteredTopics as topic}
        <Card class="p-6 hover:shadow-lg transition-shadow">
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium px-2 py-1 rounded-full {getDifficultyColor(topic.difficulty_level)}">
                {getDifficultyText(topic.difficulty_level)}
              </span>
              <span class="text-xs text-gray-500">
                ⏱️ {topic.estimated_duration} นาที
              </span>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">{topic.title}</h3>
            <p class="text-sm text-gray-600 line-clamp-3">{topic.description}</p>
          </div>
          
          <div class="space-y-2 mb-4">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">📚 วิชา:</span>
              <span class="font-medium">{topic.subjects?.name || 'ไม่ระบุ'}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">👨‍🏫 ครูผู้สอน:</span>
              <span class="font-medium">{topic.profiles?.full_name || 'ไม่ระบุ'}</span>
            </div>
          </div>
          
          <div class="flex space-x-2">
            <Button href="/lms/learn/{topic.id}" variant="primary" class="w-full">
              เริ่มเรียน
            </Button>
          </div>
        </Card>
      {/each}
    </div>
  {:else}
    <!-- Empty State -->
    <div class="text-center py-12">
      <div class="text-6xl mb-4">🔍</div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">ไม่พบเนื้อหาที่ตรงกับเงื่อนไข</h3>
      <p class="text-gray-600 mb-6">ลองปรับเปลี่ยนตัวกรองหรือค้นหาด้วยคำอื่น</p>
      <Button 
        on:click={() => {
          updateFilter('audience', 'all');
          updateFilter('difficulty', 'all');
          updateFilter('subject', 'all');
        }}
        variant="outline"
      >
        ดูเนื้อหาทั้งหมด
      </Button>
    </div>
  {/if}
</div>