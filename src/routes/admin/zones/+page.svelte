<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';

  let zones = [];
  let loading = true;
  let showCreateModal = false;
  let editingZone = null;
  
  let formData = {
    name: '',
    description: ''
  };

  onMount(async () => {
    await loadZones();
    loading = false;
  });

  async function loadZones() {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      zones = data;
    }
  }

  function openCreateModal() {
    formData = { name: '', description: '' };
    editingZone = null;
    showCreateModal = true;
  }

  function openEditModal(zone) {
    formData = {
      name: zone.name,
      description: zone.description || ''
    };
    editingZone = zone;
    showCreateModal = true;
  }

  function closeModal() {
    showCreateModal = false;
    editingZone = null;
  }

  async function saveZone() {
    if (editingZone) {
      const { error } = await supabase
        .from('zones')
        .update({
          name: formData.name,
          description: formData.description
        })
        .eq('id', editingZone.id);
      
      if (!error) {
        await loadZones();
        closeModal();
      }
    } else {
      const { error } = await supabase
        .from('zones')
        .insert({
          name: formData.name,
          description: formData.description
        });
      
      if (!error) {
        await loadZones();
        closeModal();
      }
    }
  }

  async function deleteZone(zoneId) {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบโซนนี้?')) {
      const { error } = await supabase
        .from('zones')
        .delete()
        .eq('id', zoneId);
      
      if (!error) {
        await loadZones();
      }
    }
  }
</script>

<div class="flex justify-between items-center mb-8">
  <h1 class="text-3xl font-semibold text-gray-900">จัดการโซน</h1>
  <button 
    class="bg-gold-500 hover:bg-gold-600 text-white font-medium px-6 py-2 rounded-lg transition-colors shadow-md"
    on:click={openCreateModal}
  >
    เพิ่มโซนใหม่
  </button>
</div>

{#if loading}
  <div class="text-center py-12 text-gray-600">กำลังโหลดข้อมูล...</div>
{:else if zones.length === 0}
  <div class="text-center py-12 text-gray-600">
    <p class="mb-4">ยังไม่มีโซนในระบบ</p>
    <button 
      class="bg-gold-500 hover:bg-gold-600 text-white font-medium px-6 py-2 rounded-lg transition-colors shadow-md"
      on:click={openCreateModal}
    >
      เพิ่มโซนแรก
    </button>
  </div>
{:else}
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
    {#each zones as zone}
      <div class="bg-white border-2 border-gray-200 rounded-xl p-5 transition-all hover:border-gold-400 hover:-translate-y-1 hover:shadow-lg">
        <div class="text-xl font-semibold text-primary-800 mb-2">{zone.name}</div>
        <div class="text-gray-600 mb-4 leading-relaxed">
          {zone.description || 'ไม่มีคำอธิบาย'}
        </div>
        <div class="flex gap-2">
          <button 
            class="bg-warning text-black px-3 py-1 rounded text-sm font-medium hover:bg-yellow-500 transition-colors"
            on:click={() => openEditModal(zone)}
          >
            แก้ไข
          </button>
          <button 
            class="bg-danger text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-600 transition-colors"
            on:click={() => deleteZone(zone.id)}
          >
            ลบ
          </button>
        </div>
      </div>
    {/each}
  </div>
{/if}

{#if showCreateModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" on:click={closeModal}>
    <div class="bg-white p-8 rounded-xl w-full max-w-md mx-4" on:click|stopPropagation>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-semibold text-gray-900">
          {editingZone ? 'แก้ไขโซน' : 'เพิ่มโซนใหม่'}
        </h2>
        <button 
          class="text-gray-500 hover:text-gray-700 text-2xl"
          on:click={closeModal}
        >
          &times;
        </button>
      </div>
      
      <form on:submit|preventDefault={saveZone}>
        <div class="mb-5">
          <label for="name" class="block mb-2 font-medium text-gray-900">ชื่อโซน</label>
          <input
            id="name"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-kanit"
            bind:value={formData.name}
            placeholder="เช่น โซน A, โซนชั้นประถม"
            required
          />
        </div>
        
        <div class="mb-6">
          <label for="description" class="block mb-2 font-medium text-gray-900">คำอธิบาย</label>
          <textarea
            id="description"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-kanit h-20 resize-none"
            bind:value={formData.description}
            placeholder="คำอธิบายเกี่ยวกับโซนนี้"
          ></textarea>
        </div>
        
        <div class="flex gap-3 justify-end">
          <button 
            type="button" 
            class="bg-gray-500 text-white px-5 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            on:click={closeModal}
          >
            ยกเลิก
          </button>
          <button 
            type="submit" 
            class="bg-gold-500 hover:bg-gold-600 text-white px-5 py-2 rounded-lg transition-colors shadow-md"
          >
            {editingZone ? 'บันทึก' : 'เพิ่ม'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}