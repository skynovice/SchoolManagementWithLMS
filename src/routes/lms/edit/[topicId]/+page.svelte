<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase.js';
  import { goto } from '$app/navigation';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';

  let user = null;
  let profile = null;
  let loading = true;
  let saving = false;
  let subjects = [];
  let topic = null;
  let parts = [];
  
  // Form data
  let formData = {
    title: '',
    description: '',
    subject_id: '',
    difficulty_level: 'beginner',
    estimated_duration: 60,
    is_published: false
  };

  $: topicId = $page.params.topicId;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      goto('/login');
      return;
    }
    
    user = session.user;
    await loadProfile();
    await loadSubjects();
    await loadTopic();
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
    
    // Check permissions
    if (!profile || !['teacher', 'admin', 'super_admin'].includes(profile.role)) {
      goto('/lms');
      return;
    }
  }

  async function loadSubjects() {
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .order('name');
    
    if (data) {
      subjects = data;
    }
  }

  async function loadTopic() {
    try {
      // Load topic
      const { data: topicData } = await supabase
        .from('learning_topics')
        .select('*')
        .eq('id', topicId)
        .single();

      if (!topicData) {
        goto('/lms/browse');
        return;
      }

      // Check if user can edit this topic
      if (topicData.teacher_id !== user.id && !['admin', 'super_admin'].includes(profile?.role)) {
        goto('/lms/browse');
        return;
      }

      topic = topicData;
      formData = {
        title: topic.title,
        description: topic.description || '',
        subject_id: topic.subject_id || '',
        difficulty_level: topic.difficulty_level,
        estimated_duration: topic.estimated_duration,
        is_published: topic.is_published
      };

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
        .order('part_order');

      parts = (partsData || []).map(part => ({
        id: part.id,
        title: part.title,
        description: part.description || '',
        content: part.content || '',
        estimated_duration: part.estimated_duration,
        resources: (part.learning_resources || []).map(resource => ({
          id: resource.id,
          type: resource.resource_type,
          title: resource.title,
          description: resource.description || '',
          url: resource.url || '',
          is_required: resource.is_required
        })),
        quiz: part.quizzes?.[0] ? {
          id: part.quizzes[0].id,
          title: part.quizzes[0].title,
          description: part.quizzes[0].description || '',
          passing_score: part.quizzes[0].passing_score,
          questions: (part.quizzes[0].quiz_questions || []).map(question => ({
            id: question.id,
            question_text: question.question_text,
            explanation: question.explanation || '',
            options: (question.quiz_question_options || []).map(option => ({
              id: option.id,
              text: option.option_text,
              is_correct: option.is_correct
            }))
          }))
        } : {
          title: '',
          description: '',
          passing_score: 70,
          questions: []
        }
      }));

      if (parts.length === 0) {
        parts = [{
          title: '',
          description: '',
          content: '',
          estimated_duration: 15,
          resources: [],
          quiz: {
            title: '',
            description: '',
            passing_score: 70,
            questions: []
          }
        }];
      }

    } catch (error) {
      console.error('Error loading topic:', error);
      goto('/lms/browse');
    }
  }

  function addPart() {
    parts = [...parts, {
      title: '',
      description: '',
      content: '',
      estimated_duration: 15,
      resources: [],
      quiz: {
        title: '',
        description: '',
        passing_score: 70,
        questions: []
      }
    }];
  }

  function removePart(index) {
    if (parts.length > 1) {
      parts = parts.filter((_, i) => i !== index);
    }
  }

  function addResource(partIndex) {
    parts[partIndex].resources = [...parts[partIndex].resources, {
      type: 'link',
      title: '',
      description: '',
      url: '',
      is_required: false
    }];
  }

  function removeResource(partIndex, resourceIndex) {
    parts[partIndex].resources = parts[partIndex].resources.filter((_, i) => i !== resourceIndex);
  }

  function addQuestion(partIndex) {
    parts[partIndex].quiz.questions = [...parts[partIndex].quiz.questions, {
      question_text: '',
      explanation: '',
      options: [
        { text: '', is_correct: true },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ]
    }];
  }

  function removeQuestion(partIndex, questionIndex) {
    parts[partIndex].quiz.questions = parts[partIndex].quiz.questions.filter((_, i) => i !== questionIndex);
  }

  function setCorrectAnswer(partIndex, questionIndex, optionIndex) {
    parts[partIndex].quiz.questions[questionIndex].options.forEach((option, i) => {
      option.is_correct = i === optionIndex;
    });
  }

  async function updateTopic() {
    if (!formData.title || !formData.subject_id || parts.length === 0) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    saving = true;

    try {
      // 1. Update learning topic
      const { error: topicError } = await supabase
        .from('learning_topics')
        .update({
          title: formData.title,
          description: formData.description,
          subject_id: formData.subject_id,
          difficulty_level: formData.difficulty_level,
          estimated_duration: formData.estimated_duration,
          is_published: formData.is_published,
          updated_at: new Date().toISOString()
        })
        .eq('id', topicId);

      if (topicError) throw topicError;

      // 2. Delete existing parts and related data
      const { error: deleteError } = await supabase
        .from('learning_parts')
        .delete()
        .eq('topic_id', topicId);

      if (deleteError) throw deleteError;

      // 3. Create new learning parts
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        if (!part.title) continue;

        const { data: partData, error: partError } = await supabase
          .from('learning_parts')
          .insert({
            topic_id: topicId,
            title: part.title,
            description: part.description,
            content: part.content,
            part_order: i + 1,
            estimated_duration: part.estimated_duration,
            is_published: formData.is_published
          })
          .select()
          .single();

        if (partError) throw partError;

        // 4. Create resources for this part
        if (part.resources.length > 0) {
          const resourcesData = part.resources
            .filter(resource => resource.title && resource.url)
            .map((resource, index) => ({
              part_id: partData.id,
              resource_type: resource.type,
              title: resource.title,
              description: resource.description,
              url: resource.url,
              display_order: index + 1,
              is_required: resource.is_required
            }));

          if (resourcesData.length > 0) {
            const { error: resourcesError } = await supabase
              .from('learning_resources')
              .insert(resourcesData);

            if (resourcesError) throw resourcesError;
          }
        }

        // 5. Create quiz for this part
        if (part.quiz.questions.length > 0) {
          const { data: quizData, error: quizError } = await supabase
            .from('quizzes')
            .insert({
              part_id: partData.id,
              title: part.quiz.title || `แบบทดสอบ ${part.title}`,
              description: part.quiz.description || `แบบทดสอบเพื่อวัดความเข้าใจในเนื้อหา ${part.title}`,
              instructions: 'กรุณาอ่านคำถามให้ดีและเลือกคำตอบที่ถูกต้องที่สุด',
              total_questions: part.quiz.questions.length,
              passing_score: part.quiz.passing_score,
              max_attempts: 3,
              time_limit: 10,
              shuffle_questions: true,
              show_results_immediately: true,
              is_published: formData.is_published
            })
            .select()
            .single();

          if (quizError) throw quizError;

          // 6. Create quiz questions
          for (let j = 0; j < part.quiz.questions.length; j++) {
            const question = part.quiz.questions[j];
            
            if (!question.question_text) continue;

            const { data: questionData, error: questionError } = await supabase
              .from('quiz_questions')
              .insert({
                quiz_id: quizData.id,
                question_type: 'multiple_choice',
                question_text: question.question_text,
                explanation: question.explanation,
                points: 1,
                question_order: j + 1,
                is_required: true
              })
              .select()
              .single();

            if (questionError) throw questionError;

            // 7. Create question options
            const optionsData = question.options
              .filter(option => option.text)
              .map((option, index) => ({
                question_id: questionData.id,
                option_text: option.text,
                is_correct: option.is_correct,
                option_order: index + 1
              }));

            if (optionsData.length > 0) {
              const { error: optionsError } = await supabase
                .from('quiz_question_options')
                .insert(optionsData);

              if (optionsError) throw optionsError;
            }
          }
        }
      }

      alert('อัปเดตเนื้อหาการเรียนสำเร็จ!');
      goto(`/lms/learn/${topicId}`);

    } catch (error) {
      console.error('Error updating topic:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดต: ' + error.message);
    }

    saving = false;
  }

  async function deleteTopic() {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบเนื้อหานี้? การกระทำนี้ไม่สามารถยกเลิกได้')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('learning_topics')
        .delete()
        .eq('id', topicId);

      if (error) throw error;

      alert('ลบเนื้อหาเรียบร้อยแล้ว');
      goto('/lms/browse');
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert('เกิดข้อผิดพลาดในการลบ: ' + error.message);
    }
  }
</script>

<div class="max-w-4xl mx-auto">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div class="flex items-center gap-4">
      <div class="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg">
        ✏️
      </div>
      <div>
        <h1 class="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">แก้ไขเนื้อหาการเรียน</h1>
        <p class="text-gray-600 text-lg">แก้ไขหัวข้อการเรียนพร้อมเนื้อหา ทรัพยากร และแบบทดสอบ</p>
      </div>
    </div>
    <div class="flex gap-3">
      <button
        on:click={deleteTopic}
        class="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-colors"
      >
        <span>🗑️</span>
        <span>ลบ</span>
      </button>
      <a 
        href="/lms/learn/{topicId}" 
        class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors no-underline"
      >
        <span>←</span>
        <span>กลับ</span>
      </a>
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" text="กำลังโหลด..." />
    </div>
  {:else}
    <form on:submit|preventDefault={updateTopic} class="space-y-8">
      <!-- Basic Information -->
      <div class="bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-lg border border-orange-200 p-8">
        <h2 class="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
          <span class="text-3xl">📋</span>
          ข้อมูลพื้นฐาน
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="md:col-span-2">
            <label class="block text-sm font-semibold text-gray-700 mb-2">ชื่อหัวข้อการเรียน *</label>
            <input
              type="text"
              bind:value={formData.title}
              placeholder="เช่น การแก้สมการเชิงเส้น"
              required
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">วิชา *</label>
            <select
              bind:value={formData.subject_id}
              required
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            >
              <option value="">-- เลือกวิชา --</option>
              {#each subjects as subject}
                <option value={subject.id}>{subject.name}</option>
              {/each}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">ระดับความยาก</label>
            <select
              bind:value={formData.difficulty_level}
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            >
              <option value="beginner">🟢 เริ่มต้น</option>
              <option value="intermediate">🟡 ปานกลาง</option>
              <option value="advanced">🔴 ขั้นสูง</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">เวลาโดยประมาณ (นาที)</label>
            <input
              type="number"
              bind:value={formData.estimated_duration}
              min="1"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div class="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_published"
              bind:checked={formData.is_published}
              class="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <label for="is_published" class="text-sm font-medium text-gray-700">
              เผยแพร่ทันที (นักเรียนสามารถเข้าถึงได้)
            </label>
          </div>
          
          <div class="md:col-span-2">
            <label class="block text-sm font-semibold text-gray-700 mb-2">คำอธิบาย</label>
            <textarea
              bind:value={formData.description}
              rows="3"
              placeholder="อธิบายเกี่ยวกับเนื้อหาการเรียนนี้..."
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Learning Parts -->
      <div class="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border border-blue-200 p-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
            <span class="text-3xl">📚</span>
            ส่วนการเรียน ({parts.length} ส่วน)
          </h2>
          <button
            type="button"
            on:click={addPart}
            class="flex items-center gap-2 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg font-medium transition-colors"
          >
            <span>➕</span>
            <span>เพิ่มส่วน</span>
          </button>
        </div>

        {#each parts as part, partIndex}
          <div class="border border-gray-200 rounded-xl p-6 mb-6 last:mb-0">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-800">ส่วนที่ {partIndex + 1}</h3>
              {#if parts.length > 1}
                <button
                  type="button"
                  on:click={() => removePart(partIndex)}
                  class="text-red-600 hover:text-red-800 transition-colors"
                >
                  🗑️ ลบส่วนนี้
                </button>
              {/if}
            </div>

            <div class="space-y-4">
              <!-- Part Basic Info -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">ชื่อส่วน</label>
                  <input
                    type="text"
                    bind:value={part.title}
                    placeholder="เช่น การแก้สมการเชิงเส้นตัวแปรเดียว"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">เวลา (นาที)</label>
                  <input
                    type="number"
                    bind:value={part.estimated_duration}
                    min="1"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">คำอธิบาย</label>
                <textarea
                  bind:value={part.description}
                  rows="2"
                  placeholder="อธิบายเกี่ยวกับส่วนนี้..."
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">เนื้อหา (Rich Text)</label>
                <textarea
                  bind:value={part.content}
                  rows="6"
                  placeholder="เขียนเนื้อหาการเรียนที่นี่... (รองรับ HTML)"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none font-mono text-sm"
                ></textarea>
                <p class="text-xs text-gray-500 mt-1">
                  💡 สามารถใช้ HTML tags เช่น &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt; ได้
                </p>
              </div>

              <!-- Resources -->
              <div class="border-t border-gray-100 pt-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-medium text-gray-800">ทรัพยากรการเรียน</h4>
                  <button
                    type="button"
                    on:click={() => addResource(partIndex)}
                    class="text-sm text-orange-600 hover:text-orange-800 transition-colors"
                  >
                    ➕ เพิ่มทรัพยากร
                  </button>
                </div>

                {#each part.resources as resource, resourceIndex}
                  <div class="bg-gray-50 rounded-lg p-4 mb-3 last:mb-0">
                    <div class="flex items-center justify-between mb-3">
                      <span class="text-sm font-medium text-gray-700">ทรัพยากรที่ {resourceIndex + 1}</span>
                      <button
                        type="button"
                        on:click={() => removeResource(partIndex, resourceIndex)}
                        class="text-red-600 hover:text-red-800 text-sm transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs text-gray-600 mb-1">ประเภท</label>
                        <select
                          bind:value={resource.type}
                          class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-500"
                        >
                          <option value="link">🔗 ลิงก์</option>
                          <option value="youtube">📺 YouTube</option>
                          <option value="image">🖼️ รูปภาพ</option>
                          <option value="document">📄 เอกสาร</option>
                          <option value="video">🎥 วิดีโอ</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs text-gray-600 mb-1">ชื่อ</label>
                        <input
                          type="text"
                          bind:value={resource.title}
                          placeholder="ชื่อทรัพยากร"
                          class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div class="md:col-span-2">
                        <label class="block text-xs text-gray-600 mb-1">URL</label>
                        <input
                          type="url"
                          bind:value={resource.url}
                          placeholder="https://..."
                          class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div class="md:col-span-2">
                        <label class="block text-xs text-gray-600 mb-1">คำอธิบาย</label>
                        <input
                          type="text"
                          bind:value={resource.description}
                          placeholder="อธิบายทรัพยากรนี้"
                          class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div class="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="required_{partIndex}_{resourceIndex}"
                          bind:checked={resource.is_required}
                          class="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <label for="required_{partIndex}_{resourceIndex}" class="text-xs text-gray-700">
                          จำเป็นต้องดู
                        </label>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>

              <!-- Quiz -->
              <div class="border-t border-gray-100 pt-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-medium text-gray-800">แบบทดสอบ</h4>
                  <button
                    type="button"
                    on:click={() => addQuestion(partIndex)}
                    class="text-sm text-orange-600 hover:text-orange-800 transition-colors"
                  >
                    ➕ เพิ่มคำถาม
                  </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label class="block text-xs text-gray-600 mb-1">ชื่อแบบทดสอบ</label>
                    <input
                      type="text"
                      bind:value={part.quiz.title}
                      placeholder="แบบทดสอบ {part.title}"
                      class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-600 mb-1">คะแนนผ่าน (%)</label>
                    <input
                      type="number"
                      bind:value={part.quiz.passing_score}
                      min="1"
                      max="100"
                      class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {#each part.quiz.questions as question, questionIndex}
                  <div class="bg-blue-50 rounded-lg p-4 mb-3 last:mb-0">
                    <div class="flex items-center justify-between mb-3">
                      <span class="text-sm font-medium text-blue-800">คำถามที่ {questionIndex + 1}</span>
                      <button
                        type="button"
                        on:click={() => removeQuestion(partIndex, questionIndex)}
                        class="text-red-600 hover:text-red-800 text-sm transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                    
                    <div class="space-y-3">
                      <div>
                        <label class="block text-xs text-gray-600 mb-1">คำถาม</label>
                        <textarea
                          bind:value={question.question_text}
                          rows="2"
                          placeholder="เขียนคำถามที่นี่..."
                          class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 resize-none"
                        ></textarea>
                      </div>
                      
                      <div>
                        <label class="block text-xs text-gray-600 mb-2">ตัวเลือก (คลิกเพื่อเลือกคำตอบที่ถูก)</label>
                        {#each question.options as option, optionIndex}
                          <div class="flex items-center gap-2 mb-2">
                            <button
                              type="button"
                              on:click={() => setCorrectAnswer(partIndex, questionIndex, optionIndex)}
                              class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors {option.is_correct ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'}"
                            >
                              {option.is_correct ? '✓' : ''}
                            </button>
                            <input
                              type="text"
                              bind:value={option.text}
                              placeholder="ตัวเลือก {String.fromCharCode(65 + optionIndex)}"
                              class="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        {/each}
                      </div>
                      
                      <div>
                        <label class="block text-xs text-gray-600 mb-1">คำอธิบาย (เมื่อตอบผิด)</label>
                        <input
                          type="text"
                          bind:value={question.explanation}
                          placeholder="อธิบายเหตุผลของคำตอบที่ถูก..."
                          class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Submit Button -->
      <div class="flex justify-end gap-4">
        <a 
          href="/lms/learn/{topicId}" 
          class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors no-underline"
        >
          ยกเลิก
        </a>
        <button
          type="submit"
          disabled={saving}
          class="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {#if saving}
            <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>กำลังอัปเดต...</span>
          {:else}
            <span>💾</span>
            <span>อัปเดตเนื้อหา</span>
          {/if}
        </button>
      </div>
    </form>
  {/if}
</div>