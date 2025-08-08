<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';

  let subjects = [];
  let loading = true;
  let showCreateModal = false;
  let editingSubject = null;
  let saving = false;
  let searchTerm = '';
  
  let formData = {
    name: '',
    code: '',
    description: ''
  };

  $: filteredSubjects = subjects.filter(subject => 
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (subject.description && subject.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  onMount(async () => {
    await loadSubjects();
    loading = false;
  });

  async function loadSubjects() {
    const { data, error } = await supabase
      .from('subjects')
      .select(`
        *,
        courses (
          id
        )
      `)
      .order('created_at', { ascending: false });
    
    if (data) {
      subjects = data.map(subject => ({
        ...subject,
        course_count: subject.courses?.length || 0
      }));
    }
  }

  function openCreateModal() {
    formData = { name: '', code: '', description: '' };
    editingSubject = null;
    showCreateModal = true;
  }

  function openEditModal(subject) {
    formData = {
      name: subject.name,
      code: subject.code,
      description: subject.description || ''
    };
    editingSubject = subject;
    showCreateModal = true;
  }

  function closeModal() {
    showCreateModal = false;
    editingSubject = null;
  }

  async function saveSubject() {
    saving = true;
    
    try {
      if (editingSubject) {
        const { error } = await supabase
          .from('subjects')
          .update({
            name: formData.name,
            code: formData.code,
            description: formData.description
          })
          .eq('id', editingSubject.id);
        
        if (!error) {
          await loadSubjects();
          closeModal();
        }
      } else {
        const { error } = await supabase
          .from('subjects')
          .insert({
            name: formData.name,
            code: formData.code,
            description: formData.description
          });
        
        if (!error) {
          await loadSubjects();
          closeModal();
        }
      }
    } catch (error) {
      console.error('Save subject error:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
    
    saving = false;
  }

  async function deleteSubject(subjectId) {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบวิชานี้?')) {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId);
      
      if (!error) {
        await loadSubjects();
      }
    }
  }

  function getSubjectIcon(code) {
    const lowerCode = code.toLowerCase();
    if (lowerCode.includes('math') || lowerCode.includes('คณิต')) return '🔢';
    if (lowerCode.includes('eng') || lowerCode.includes('อังกฤษ')) return '🇬🇧';
    if (lowerCode.includes('sci') || lowerCode.includes('วิทย')) return '🔬';
    if (lowerCode.includes('thai') || lowerCode.includes('ไทย')) return '🇹🇭';
    if (lowerCode.includes('art') || lowerCode.includes('ศิลป')) return '🎨';
    if (lowerCode.includes('pe') || lowerCode.includes('พลศึกษา')) return '⚽';
    if (lowerCode.includes('music') || lowerCode.includes('ดนตรี')) return '🎵';
    if (lowerCode.includes('social') || lowerCode.includes('สังคม')) return '🌍';
    return '📚';
  }
</script>

<div class="max-w-7xl mx-auto">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl">
        📚
      </div>
      <div>
        <h1 class="text-3xl font-bold text-gray-800">จัดการวิชาเรียน</h1>
        <p class="text-gray-600">เพิ่มและจัดการวิชาเรียนในหลักสูตร</p>
      </div>
    </div>
    <button 
      on:click={openCreateModal}
      class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
    >
      <span>➕</span>
      <span>เพิ่มวิชาใหม่</span>
    </button>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" text="กำลังโหลดข้อมูลวิชาเรียน..." />
    </div>
  {:else}
    <!-- Search -->
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span class="text-gray-400">🔍</span>
        </div>
        <input
          type="text"
          bind:value={searchTerm}
          placeholder="ค้นหาวิชาเรียน..."
          class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        />
      </div>
    </div>

    <!-- Subjects Grid -->
    {#if filteredSubjects.length === 0}
      <div class="text-center py-12">
        <div class="text-6xl mb-4">📚</div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">
          {subjects.length === 0 ? 'ยังไม่มีวิชาเรียนในระบบ' : 'ไม่พบวิชาเรียน'}
        </h3>
        <p class="text-gray-600 mb-6">
          {subjects.length === 0 ? 'เริ่มต้นด้วยการสร้างวิชาเรียนแรกของคุณ' : 'ไม่มีวิชาเรียนที่ตรงกับเงื่อนไขการค้นหา'}
        </p>
        <button 
          on:click={openCreateModal}
          class="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 transition-all"
        >
          {subjects.length === 0 ? 'เพิ่มวิชาแรก' : 'เพิ่มวิชาใหม่'}
        </button>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredSubjects as subject}
          <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div class="bg-gradient-to-r from-purple-50 to-purple-100 p-4 border-b border-purple-200">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl">
                    {getSubjectIcon(subject.code)}
                  </div>
                  <div>
                    <div class="text-sm font-medium text-purple-600">{subject.code}</div>
                    <h3 class="text-lg font-bold text-purple-800">{subject.name}</h3>
                  </div>
                </div>
                <div class="flex items-center gap-1 px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-medium">
                  <span>📖</span>
                  <span>{subject.course_count}</span>
                </div>
              </div>
            </div>
            
            <div class="p-6">
              <div class="space-y-3 mb-6">
                <div class="flex items-start gap-2 text-gray-600">
                  <span class="text-lg mt-0.5">📝</span>
                  <p class="text-sm leading-relaxed">
                    {subject.description || 'ไม่มีคำอธิบาย'}
                  </p>
                </div>
                
                <div class="flex items-center gap-2 text-gray-500 text-sm">
                  <span>📅</span>
                  <span>สร้างเมื่อ {new Date(subject.created_at).toLocaleDateString('th-TH')}</span>
                </div>
              </div>
              
              <div class="flex gap-2">
                <button
                  on:click={() => openEditModal(subject)}
                  class="flex-1 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span>✏️</span>
                  <span>แก้ไข</span>
                </button>
                <button
                  on:click={() => deleteSubject(subject.id)}
                  class="flex-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span>🗑️</span>
                  <span>ลบ</span>
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

{#if showCreateModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" on:click={closeModal} on:keydown={(e) => e.key === 'Escape' && closeModal()}>
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" role="document" on:click|stopPropagation>
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-800">
            {editingSubject ? 'แก้ไขวิชา' : 'เพิ่มวิชาใหม่'}
          </h2>
          <button 
            on:click={closeModal}
            class="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
      
      <form on:submit|preventDefault={saveSubject} class="p-6 space-y-6">
        <div>
          <label for="code" class="block text-sm font-semibold text-gray-700 mb-2">รหัสวิชา</label>
          <input
            id="code"
            type="text"
            bind:value={formData.code}
            placeholder="เช่น MATH101, ENG201, SCI301"
            required
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>
        
        <div>
          <label for="name" class="block text-sm font-semibold text-gray-700 mb-2">ชื่อวิชา</label>
          <input
            id="name"
            type="text"
            bind:value={formData.name}
            placeholder="เช่น คณิตศาสตร์พื้นฐาน, ภาษาอังกฤษ"
            required
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>
        
        <div>
          <label for="description" class="block text-sm font-semibold text-gray-700 mb-2">คำอธิบาย</label>
          <textarea
            id="description"
            bind:value={formData.description}
            placeholder="คำอธิบายเกี่ยวกับวิชานี้..."
            rows="4"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
          ></textarea>
        </div>
        
        <div class="flex gap-4 pt-6 border-t border-gray-200">
          <button 
            type="button" 
            on:click={closeModal}
            class="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            type="submit"
            disabled={saving}
            class="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {#if saving}
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>กำลังบันทึก...</span>
            {:else}
              <span>{editingSubject ? '💾' : '➕'}</span>
              <span>{editingSubject ? 'บันทึก' : 'เพิ่ม'}</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}