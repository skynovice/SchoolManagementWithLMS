<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';

  let groups = [];
  let zones = [];
  let loading = true;
  let showCreateModal = false;
  let editingGroup = null;
  let saving = false;
  let searchTerm = '';
  let selectedZone = '';
  
  let formData = {
    name: '',
    zone_id: '',
    description: ''
  };

  $: filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesZone = selectedZone === '' || group.zone_id === selectedZone;
    return matchesSearch && matchesZone;
  });

  onMount(async () => {
    await Promise.all([loadGroups(), loadZones()]);
    loading = false;
  });

  async function loadGroups() {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        zones (
          id,
          name
        ),
        profiles!groups_group_id_fkey (
          id
        )
      `)
      .order('created_at', { ascending: false });
    
    if (data) {
      groups = data.map(group => ({
        ...group,
        member_count: group.profiles?.length || 0
      }));
    }
  }

  async function loadZones() {
    const { data } = await supabase
      .from('zones')
      .select('*')
      .order('name');
    
    if (data) {
      zones = data;
    }
  }

  function openCreateModal() {
    formData = { name: '', zone_id: '', description: '' };
    editingGroup = null;
    showCreateModal = true;
  }

  function openEditModal(group) {
    formData = {
      name: group.name,
      zone_id: group.zone_id,
      description: group.description || ''
    };
    editingGroup = group;
    showCreateModal = true;
  }

  function closeModal() {
    showCreateModal = false;
    editingGroup = null;
  }

  async function saveGroup() {
    saving = true;
    
    try {
      if (editingGroup) {
        const { error } = await supabase
          .from('groups')
          .update({
            name: formData.name,
            zone_id: formData.zone_id,
            description: formData.description
          })
          .eq('id', editingGroup.id);
        
        if (!error) {
          await loadGroups();
          closeModal();
        }
      } else {
        const { error } = await supabase
          .from('groups')
          .insert({
            name: formData.name,
            zone_id: formData.zone_id,
            description: formData.description
          });
        
        if (!error) {
          await loadGroups();
          closeModal();
        }
      }
    } catch (error) {
      console.error('Save group error:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
    
    saving = false;
  }

  async function deleteGroup(groupId) {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบกลุ่มนี้?')) {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);
      
      if (!error) {
        await loadGroups();
      }
    }
  }
</script>

<div class="max-w-7xl mx-auto">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-2xl">
        👨‍👩‍👧‍👦
      </div>
      <div>
        <h1 class="text-3xl font-bold text-gray-800">จัดการกลุ่ม</h1>
        <p class="text-gray-600">จัดกลุ่มนักเรียนและจัดการข้อมูลกลุ่ม</p>
      </div>
    </div>
    <button 
      on:click={openCreateModal}
      class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
    >
      <span>➕</span>
      <span>เพิ่มกลุ่มใหม่</span>
    </button>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" text="กำลังโหลดข้อมูลกลุ่ม..." />
    </div>
  {:else}
    <!-- Filters -->
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-gray-400">🔍</span>
            </div>
            <input
              type="text"
              bind:value={searchTerm}
              placeholder="ค้นหากลุ่ม..."
              class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
        <div class="w-full md:w-64">
          <select
            bind:value={selectedZone}
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          >
            <option value="">ทุกโซน</option>
            {#each zones as zone}
              <option value={zone.id}>{zone.name}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <!-- Groups Grid -->
    {#if filteredGroups.length === 0}
      <div class="text-center py-12">
        <div class="text-6xl mb-4">👨‍👩‍👧‍👦</div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">
          {groups.length === 0 ? 'ยังไม่มีกลุ่มในระบบ' : 'ไม่พบกลุ่ม'}
        </h3>
        <p class="text-gray-600 mb-6">
          {groups.length === 0 ? 'เริ่มต้นด้วยการสร้างกลุ่มแรกของคุณ' : 'ไม่มีกลุ่มที่ตรงกับเงื่อนไขการค้นหา'}
        </p>
        <button 
          on:click={openCreateModal}
          class="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all"
        >
          {groups.length === 0 ? 'เพิ่มกลุ่มแรก' : 'เพิ่มกลุ่มใหม่'}
        </button>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredGroups as group}
          <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div class="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 border-b border-emerald-200">
              <div class="flex items-center justify-between">
                <h3 class="text-xl font-bold text-emerald-800">{group.name}</h3>
                <div class="flex items-center gap-1 px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm font-medium">
                  <span>👥</span>
                  <span>{group.member_count}</span>
                </div>
              </div>
            </div>
            
            <div class="p-6">
              <div class="space-y-3 mb-6">
                <div class="flex items-center gap-2 text-gray-600">
                  <span class="text-lg">🏫</span>
                  <span class="font-medium">{group.zones?.name || 'ไม่ระบุโซน'}</span>
                </div>
                
                <div class="flex items-start gap-2 text-gray-600">
                  <span class="text-lg mt-0.5">📝</span>
                  <p class="text-sm leading-relaxed">
                    {group.description || 'ไม่มีคำอธิบาย'}
                  </p>
                </div>
                
                <div class="flex items-center gap-2 text-gray-500 text-sm">
                  <span>📅</span>
                  <span>สร้างเมื่อ {new Date(group.created_at).toLocaleDateString('th-TH')}</span>
                </div>
              </div>
              
              <div class="flex gap-2">
                <button
                  on:click={() => openEditModal(group)}
                  class="flex-1 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span>✏️</span>
                  <span>แก้ไข</span>
                </button>
                <button
                  on:click={() => deleteGroup(group.id)}
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
            {editingGroup ? 'แก้ไขกลุ่ม' : 'เพิ่มกลุ่มใหม่'}
          </h2>
          <button 
            on:click={closeModal}
            class="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
      
      <form on:submit|preventDefault={saveGroup} class="p-6 space-y-6">
        <div>
          <label for="name" class="block text-sm font-semibold text-gray-700 mb-2">ชื่อกลุ่ม</label>
          <input
            id="name"
            type="text"
            bind:value={formData.name}
            placeholder="เช่น กลุ่ม 1, กลุ่มเก่ง, กลุ่มคณิตศาสตร์"
            required
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
        </div>
        
        <div>
          <label for="zone_id" class="block text-sm font-semibold text-gray-700 mb-2">โซน</label>
          <select 
            id="zone_id" 
            bind:value={formData.zone_id} 
            required
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          >
            <option value="">-- เลือกโซน --</option>
            {#each zones as zone}
              <option value={zone.id}>{zone.name}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label for="description" class="block text-sm font-semibold text-gray-700 mb-2">คำอธิบาย</label>
          <textarea
            id="description"
            bind:value={formData.description}
            placeholder="คำอธิบายเกี่ยวกับกลุ่มนี้..."
            rows="4"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
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
            class="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {#if saving}
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>กำลังบันทึก...</span>
            {:else}
              <span>{editingGroup ? '💾' : '➕'}</span>
              <span>{editingGroup ? 'บันทึก' : 'เพิ่ม'}</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}