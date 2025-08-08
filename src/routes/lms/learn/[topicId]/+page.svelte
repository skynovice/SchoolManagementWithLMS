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
  let topic = null;
  let parts = [];
  let currentPartIndex = 0;
  let loading = true;
  let studentProgress = null;

  $: topicId = $page.params.topicId;
  $: currentPart = parts[currentPartIndex];

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

      // Load topic with parts and resources
      const { data: topicData } = await supabase
        .from('learning_topics')
        .select(`
          *,
          subjects(name, code),
          profiles!learning_topics_teacher_id_fkey(full_name)
        `)
        .eq('id', topicId)
        .single();

      if (!topicData) {
        goto('/lms/browse');
        return;
      }

      topic = topicData;

      // Load parts with resources and quizzes
      const { data: partsData } = await supabase
        .from('learning_parts')
        .select(`
          *,
          learning_resources(*),
          quizzes(
            *,
            quiz_questions(
              *,
              quiz_question_options(*)
            )
          )
        `)
        .eq('topic_id', topicId)
        .eq('is_published', true)
        .order('part_order');

      parts = partsData || [];

      // Always load and track student progress for logged-in users
      if (user && profile?.role === 'student') {
        const { data: progressData } = await supabase
          .from('student_progress')
          .select('*')
          .eq('student_id', user.id)
          .eq('topic_id', topicId)
          .single();

        studentProgress = progressData;

        // Create progress record if doesn't exist
        if (!studentProgress) {
          const { data: newProgress } = await supabase
            .from('student_progress')
            .insert({
              student_id: user.id,
              topic_id: topicId,
              completion_percentage: 0,
              total_time_spent: 0,
              is_completed: false
            })
            .select()
            .single();

          studentProgress = newProgress;
        }
      }

    } catch (error) {
      console.error('Error loading topic:', error);
      goto('/lms/browse');
    } finally {
      loading = false;
    }
  }

  function nextPart() {
    if (currentPartIndex < parts.length - 1) {
      currentPartIndex++;
      updateProgress();
    }
  }

  function previousPart() {
    if (currentPartIndex > 0) {
      currentPartIndex--;
    }
  }

  async function updateProgress() {
    if (!user || !studentProgress || profile?.role !== 'student') return;

    const completionPercentage = ((currentPartIndex + 1) / parts.length) * 100;
    const isCompleted = currentPartIndex === parts.length - 1;

    try {
      await supabase
        .from('student_progress')
        .update({
          completion_percentage: completionPercentage,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentProgress.id);

      studentProgress.completion_percentage = completionPercentage;
      studentProgress.is_completed = isCompleted;
    } catch (error) {
      console.error('Error updating progress:', error);
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
</script>

<svelte:head>
  <title>{topic?.title || 'กำลังโหลด...'} - ระบบ LMS</title>
</svelte:head>

{#if loading}
  <div class="flex justify-center items-center py-12">
    <LoadingSpinner size="lg" text="กำลังโหลดเนื้อหา..." />
  </div>
{:else if topic}
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-lg border border-blue-200 p-8">
      <div class="flex items-start justify-between mb-6">
        <div class="flex-1">
          <div class="flex items-center space-x-3 mb-4">
            <span class="text-sm font-semibold px-3 py-1 rounded-full {getDifficultyColor(topic.difficulty_level)} shadow-sm">
              {getDifficultyText(topic.difficulty_level)}
            </span>
            <span class="text-sm font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm">
              {topic.subjects?.code || 'N/A'}
            </span>
            <span class="text-sm text-gray-600 bg-white px-3 py-1 rounded-full shadow-sm">
              ⏱️ {topic.estimated_duration} นาที
            </span>
          </div>
          <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">{topic.title}</h1>
          <p class="text-gray-700 mb-6 text-lg leading-relaxed">{topic.description}</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl">
              <span class="text-blue-600">📚</span>
              <span class="text-gray-600">วิชา:</span>
              <span class="font-semibold text-gray-800">{topic.subjects?.name || 'ไม่ระบุ'}</span>
            </div>
            <div class="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl">
              <span class="text-green-600">👨‍🏫</span>
              <span class="text-gray-600">ครู:</span>
              <span class="font-semibold text-gray-800">{topic.profiles?.full_name || 'ไม่ระบุ'}</span>
            </div>
          </div>
        </div>
        
        <div class="ml-6">
          <Button href="/lms/browse" variant="outline" size="sm">
            ← กลับ
          </Button>
        </div>
      </div>

      <!-- Progress Bar -->
      {#if studentProgress && user && profile?.role === 'student'}
        <div class="mt-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">ความก้าวหน้า</span>
            <span class="text-sm text-gray-500">{Math.round(studentProgress.completion_percentage)}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-green-500 h-2 rounded-full transition-all duration-300" 
              style="width: {studentProgress.completion_percentage}%"
            ></div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Navigation -->
    <div class="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-6">
          <span class="text-sm font-semibold text-gray-800 bg-blue-50 px-3 py-1 rounded-full">
            ส่วนที่ {currentPartIndex + 1} จาก {parts.length}
          </span>
          <div class="flex space-x-2">
            {#each parts as part, index}
              <button
                on:click={() => currentPartIndex = index}
                class="w-4 h-4 rounded-full transition-all duration-300 hover:scale-110 {
                  index === currentPartIndex 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg' 
                    : index < currentPartIndex 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-md' 
                      : 'bg-gray-300 hover:bg-gray-400'
                }"
                title="ส่วนที่ {index + 1}: {part.title}"
              ></button>
            {/each}
          </div>
        </div>
        
        <div class="flex space-x-3">
          <Button 
            on:click={previousPart} 
            variant="outline" 
            size="sm" 
            disabled={currentPartIndex === 0}
          >
            ← ก่อนหน้า
          </Button>
          <Button 
            on:click={nextPart} 
            variant="primary" 
            size="sm" 
            disabled={currentPartIndex === parts.length - 1}
          >
            ถัดไป →
          </Button>
        </div>
      </div>
    </div>

    <!-- Current Part Content -->
    {#if currentPart}
      <div class="space-y-6">
        <!-- Part Header -->
        <Card class="p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-2">{currentPart.title}</h2>
          {#if currentPart.description}
            <p class="text-gray-600 mb-4">{currentPart.description}</p>
          {/if}
          <div class="text-sm text-gray-500">
            ⏱️ เวลาโดยประมาณ: {currentPart.estimated_duration} นาที
          </div>
        </Card>

        <!-- Part Content -->
        {#if currentPart.content}
          <Card class="p-6">
            <div class="prose max-w-none">
              {@html currentPart.content}
            </div>
          </Card>
        {/if}

        <!-- Resources -->
        {#if currentPart.learning_resources && currentPart.learning_resources.length > 0}
          <Card class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">📚 ทรัพยากรการเรียน</h3>
            <div class="space-y-3">
              {#each currentPart.learning_resources as resource}
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div class="flex items-center space-x-3">
                    <span class="text-2xl">
                      {#if resource.resource_type === 'youtube'}📺
                      {:else if resource.resource_type === 'image'}🖼️
                      {:else if resource.resource_type === 'document'}📄
                      {:else if resource.resource_type === 'video'}🎥
                      {:else}🔗{/if}
                    </span>
                    <div>
                      <h4 class="font-medium text-gray-900">{resource.title}</h4>
                      {#if resource.description}
                        <p class="text-sm text-gray-600">{resource.description}</p>
                      {/if}
                      {#if resource.is_required}
                        <span class="text-xs font-medium px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                          จำเป็น
                        </span>
                      {/if}
                    </div>
                  </div>
                  <Button href={resource.url} target="_blank" variant="outline" size="sm">
                    เปิด
                  </Button>
                </div>
              {/each}
            </div>
          </Card>
        {/if}

        <!-- Quiz -->
        {#if currentPart.quizzes && currentPart.quizzes.length > 0}
          {#each currentPart.quizzes as quiz}
            <Card class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900">🧩 {quiz.title}</h3>
                <Button href="/lms/quiz/{quiz.id}" variant="primary">
                  เริ่มทำแบบทดสอบ
                </Button>
              </div>
              {#if quiz.description}
                <p class="text-gray-600 mb-4">{quiz.description}</p>
              {/if}
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span class="text-gray-500">คำถาม:</span>
                  <span class="font-medium">{quiz.total_questions} ข้อ</span>
                </div>
                <div>
                  <span class="text-gray-500">คะแนนผ่าน:</span>
                  <span class="font-medium">{quiz.passing_score}%</span>
                </div>
                <div>
                  <span class="text-gray-500">ครั้งที่ทำได้:</span>
                  <span class="font-medium">{quiz.max_attempts} ครั้ง</span>
                </div>
                <div>
                  <span class="text-gray-500">เวลา:</span>
                  <span class="font-medium">{quiz.time_limit || 'ไม่จำกัด'} นาที</span>
                </div>
              </div>
            </Card>
          {/each}
        {/if}
      </div>
    {/if}

    <!-- Completion Message -->
    {#if studentProgress?.is_completed && user && profile?.role === 'student'}
      <Card class="p-6 bg-green-50 border-green-200">
        <div class="text-center">
          <div class="text-4xl mb-4">🎉</div>
          <h3 class="text-lg font-semibold text-green-800 mb-2">ยินดีด้วย!</h3>
          <p class="text-green-700">คุณได้เรียนจบหัวข้อนี้เรียบร้อยแล้ว</p>
          <div class="mt-4">
            <Button href="/lms/browse" variant="primary">
              เรียนหัวข้ออื่น
            </Button>
          </div>
        </div>
      </Card>
    {/if}
  </div>
{:else}
  <div class="text-center py-12">
    <div class="text-6xl mb-4">❌</div>
    <h3 class="text-lg font-medium text-gray-900 mb-2">ไม่พบเนื้อหา</h3>
    <p class="text-gray-600 mb-6">เนื้อหาที่คุณต้องการไม่มีอยู่หรือถูกลบไปแล้ว</p>
    <Button href="/lms/browse" variant="primary">
      กลับไปเลือกเนื้อหา
    </Button>
  </div>
{/if}