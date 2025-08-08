<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';

  let users = [];
  let loading = true;
  let showCreateModal = false;
  let editingUser = null;
  let searchTerm = '';
  let selectedRole = '';
  let saving = false;
  
  // Form data
  let formData = {
    email: '',
    full_name: '',
    role: 'student',
    zone_id: '',
    group_id: ''
  };
  
  let zones = [];
  let groups = [];

  $: filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === '' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  onMount(async () => {
    await Promise.all([loadUsers(), loadZones(), loadGroups()]);
    loading = false;
  });

  async function loadUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        zones (
          id,
          name
        ),
        groups (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });
    
    if (data) {
      users = data;
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

  async function loadGroups() {
    const { data } = await supabase
      .from('groups')
      .select('*')
      .order('name');
    
    if (data) {
      groups = data;
    }
  }

  function openCreateModal() {
    formData = {
      email: '',
      full_name: '',
      role: 'student',
      zone_id: '',
      group_id: ''
    };
    editingUser = null;
    showCreateModal = true;
  }

  function openEditModal(user) {
    formData = {
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      zone_id: user.zone_id || '',
      group_id: user.group_id || ''
    };
    editingUser = user;
    showCreateModal = true;
  }

  function closeModal() {
    showCreateModal = false;
    editingUser = null;
  }

  async function saveUser() {
    saving = true;
    
    try {
      if (editingUser) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            role: formData.role,
            zone_id: formData.zone_id || null,
            group_id: formData.group_id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUser.id);
        
        if (!error) {
          await loadUsers();
          closeModal();
        }
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert({
            email: formData.email,
            full_name: formData.full_name,
            role: formData.role,
            zone_id: formData.zone_id || null,
            group_id: formData.group_id || null
          });
        
        if (!error) {
          await loadUsers();
          closeModal();
        }
      }
    } catch (error) {
      console.error('Save user error:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
    
    saving = false;
  }

  async function deleteUser(userId) {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?')) {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (!error) {
        await loadUsers();
      }
    }
  }

  function getRoleDisplayName(role) {
    const roleNames = {
      'super_admin': 'ผู้ดูแลระบบสูงสุด',
      'admin': 'ผู้ดูแลระบบ',
      'teacher': 'ครู',
      'parent': 'ผู้ปกครอง',
      'student': 'นักเรียน'
    };
    return roleNames[role] || role;
  }

  function getRoleIcon(role) {
    const roleIcons = {
      'super_admin': '👑',
      'admin': '🔧',
      'teacher': '👩‍🏫',
      'parent': '👨‍👩‍👧‍👦',
      'student': '👨‍🎓'
    };
    return roleIcons[role] || '👤';
  }

  function getRoleColor(role) {
    const roleColors = {
      'super_admin': 'bg-purple-100 text-purple-800 border-purple-200',
      'admin': 'bg-blue-100 text-blue-800 border-blue-200',
      'teacher': 'bg-green-100 text-green-800 border-green-200',
      'parent': 'bg-orange-100 text-orange-800 border-orange-200',
      'student': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  }
</script>

<div class="max-w-7xl mx-auto">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl">
        👥
      </div>
      <div>
        <h1 class="text-3xl font-bold text-gray-800">จัดการผู้ใช้</h1>
        <p class="text-gray-600">เพิ่ม แก้ไข และจัดการผู้ใช้ในระบบ</p>
      </div>
    </div>
    <button 
      on:click={openCreateModal}
      class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
    >
      <span>➕</span>
      <span>เพิ่มผู้ใช้ใหม่</span>
    </button>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" text="กำลังโหลดข้อมูลผู้ใช้..." />
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
              placeholder="ค้นหาผู้ใช้..."
              class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
        <div class="w-full md:w-64">
          <select
            bind:value={selectedRole}
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">ทุกบทบาท</option>
            <option value="student">นักเรียน</option>
            <option value="parent">ผู้ปกครอง</option>
            <option value="teacher">ครู</option>
            <option value="admin">ผู้ดูแลระบบ</option>
            <option value="super_admin">ผู้ดูแลระบบสูงสุด</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Users Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filteredUsers as user}
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div class="p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-2xl">
                  {getRoleIcon(user.role)}
                </div>
                <div>
                  <h3 class="font-bold text-gray-900">{user.full_name}</h3>
                  <p class="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <span class="px-3 py-1 text-xs font-medium rounded-full border {getRoleColor(user.role)}">
                {getRoleDisplayName(user.role)}
              </span>
            </div>
            
            <div class="space-y-2 mb-4">
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <span>🏫</span>
                <span>{user.zones?.name || 'ไม่ระบุโซน'}</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <span>👨‍👩‍👧‍👦</span>
                <span>{user.groups?.name || 'ไม่ระบุกลุ่ม'}</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <span>📅</span>
                <span>{new Date(user.created_at).toLocaleDateString('th-TH')}</span>
              </div>
            </div>
            
            <div class="flex gap-2">
              <button
                on:click={() => openEditModal(user)}
                class="flex-1 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors"
              >
                ✏️ แก้ไข
              </button>
              <button
                on:click={() => deleteUser(user.id)}
                class="flex-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-colors"
              >
                🗑️ ลบ
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>

    {#if filteredUsers.length === 0}
      <div class="text-center py-12">
        <div class="text-6xl mb-4">👥</div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">ไม่พบผู้ใช้</h3>
        <p class="text-gray-600 mb-6">ไม่มีผู้ใช้ที่ตรงกับเงื่อนไขการค้นหา</p>
        <button 
          on:click={openCreateModal}
          class="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
        >
          เพิ่มผู้ใช้ใหม่
        </button>
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
            {editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
          </h2>
          <button 
            on:click={closeModal}
            class="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
      
      <form on:submit|preventDefault={saveUser} class="p-6 space-y-6">
        <div>
          <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">อีเมล</label>
          <input
            id="email"
            type="email"
            bind:value={formData.email}
            disabled={!!editingUser}
            required
            placeholder="user@example.com"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
        
        <div>
          <label for="full_name" class="block text-sm font-semibold text-gray-700 mb-2">ชื่อ-นามสกุล</label>
          <input
            id="full_name"
            type="text"
            bind:value={formData.full_name}
            required
            placeholder="ชื่อ นามสกุล"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        
        <div>
          <label for="role" class="block text-sm font-semibold text-gray-700 mb-2">บทบาท</label>
          <select 
            id="role" 
            bind:value={formData.role} 
            required
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="student">👨‍🎓 นักเรียน</option>
            <option value="parent">👨‍👩‍👧‍👦 ผู้ปกครอง</option>
            <option value="teacher">👩‍🏫 ครู</option>
            <option value="admin">🔧 ผู้ดูแลระบบ</option>
            <option value="super_admin">👑 ผู้ดูแลระบบสูงสุด</option>
          </select>
        </div>
        
        <div>
          <label for="zone_id" class="block text-sm font-semibold text-gray-700 mb-2">โซน</label>
          <select 
            id="zone_id" 
            bind:value={formData.zone_id}
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">-- เลือกโซน --</option>
            {#each zones as zone}
              <option value={zone.id}>{zone.name}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label for="group_id" class="block text-sm font-semibold text-gray-700 mb-2">กลุ่ม</label>
          <select 
            id="group_id" 
            bind:value={formData.group_id}
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">-- เลือกกลุ่ม --</option>
            {#each groups as group}
              <option value={group.id}>{group.name}</option>
            {/each}
          </select>
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
            class="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {#if saving}
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>กำลังบันทึก...</span>
            {:else}
              <span>{editingUser ? '💾' : '➕'}</span>
              <span>{editingUser ? 'บันทึก' : 'เพิ่ม'}</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}