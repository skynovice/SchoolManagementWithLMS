<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import { goto } from '$app/navigation';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';

  let user = null;
  let users = [];
  let loading = true;
  let sending = false;
  let searchTerm = '';
  
  let formData = {
    recipient_id: '',
    subject: '',
    content: ''
  };

  $: filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getRoleDisplayName(u.role).toLowerCase().includes(searchTerm.toLowerCase())
  );

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      goto('/login');
      return;
    }
    
    user = session.user;
    await loadUsers();
    loading = false;
  });

  async function loadUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .neq('id', user.id)
      .order('full_name');
    
    if (data) {
      users = data;
    }
  }

  async function sendMessage() {
    if (!formData.recipient_id || !formData.subject || !formData.content) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    sending = true;

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id: formData.recipient_id,
        subject: formData.subject,
        content: formData.content,
        is_read: false
      });

    if (error) {
      alert('เกิดข้อผิดพลาดในการส่งข้อความ');
      sending = false;
    } else {
      goto('/messages');
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
      'super_admin': 'bg-purple-100 text-purple-800',
      'admin': 'bg-blue-100 text-blue-800',
      'teacher': 'bg-green-100 text-green-800',
      'parent': 'bg-orange-100 text-orange-800',
      'student': 'bg-gray-100 text-gray-800'
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  }
</script>

<div class="max-w-4xl mx-auto">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center text-white text-2xl">
        ✍️
      </div>
      <div>
        <h1 class="text-3xl font-bold text-gray-800">เขียนข้อความใหม่</h1>
        <p class="text-gray-600">ส่งข้อความถึงผู้ใช้อื่นในระบบ</p>
      </div>
    </div>
    <a 
      href="/messages" 
      class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors no-underline"
    >
      <span>←</span>
      <span>กลับ</span>
    </a>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" text="กำลังโหลดข้อมูล..." />
    </div>
  {:else}
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <form on:submit|preventDefault={sendMessage} class="p-8 space-y-6">
        <!-- Recipient Selection -->
        <div class="space-y-3">
          <label class="block text-sm font-semibold text-gray-700">ผู้รับ</label>
          
          <!-- Search Input -->
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-gray-400">🔍</span>
            </div>
            <input
              type="text"
              bind:value={searchTerm}
              placeholder="ค้นหาผู้รับ..."
              class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
            />
          </div>
          
          <!-- Recipients List -->
          <div class="max-h-64 overflow-y-auto border border-gray-200 rounded-xl">
            {#each filteredUsers as recipient}
              <label class="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                <input
                  type="radio"
                  bind:group={formData.recipient_id}
                  value={recipient.id}
                  class="w-4 h-4 text-rose-600 focus:ring-rose-500"
                />
                <div class="flex items-center gap-3 flex-1">
                  <div class="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-lg">
                    {getRoleIcon(recipient.role)}
                  </div>
                  <div class="flex-1">
                    <div class="font-medium text-gray-900">{recipient.full_name}</div>
                    <div class="text-sm text-gray-500">{recipient.email}</div>
                  </div>
                  <span class="px-2 py-1 text-xs font-medium rounded-full {getRoleColor(recipient.role)}">
                    {getRoleDisplayName(recipient.role)}
                  </span>
                </div>
              </label>
            {/each}
            
            {#if filteredUsers.length === 0}
              <div class="p-8 text-center text-gray-500">
                <div class="text-4xl mb-2">🔍</div>
                <p>ไม่พบผู้ใช้ที่ตรงกับการค้นหา</p>
              </div>
            {/if}
          </div>
        </div>

        <!-- Subject -->
        <div class="space-y-3">
          <label for="subject" class="block text-sm font-semibold text-gray-700">หัวข้อ</label>
          <input
            id="subject"
            type="text"
            bind:value={formData.subject}
            placeholder="หัวข้อข้อความ"
            required
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
          />
        </div>

        <!-- Content -->
        <div class="space-y-3">
          <label for="content" class="block text-sm font-semibold text-gray-700">เนื้อหา</label>
          <textarea
            id="content"
            bind:value={formData.content}
            placeholder="เขียนข้อความของคุณที่นี่..."
            required
            rows="8"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all resize-none"
          ></textarea>
          <div class="text-sm text-gray-500">
            {formData.content.length} ตัวอักษร
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-4 pt-6 border-t border-gray-100">
          <button 
            type="button" 
            on:click={() => goto('/messages')}
            class="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            type="submit" 
            disabled={sending || !formData.recipient_id || !formData.subject || !formData.content}
            class="px-8 py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {#if sending}
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>กำลังส่ง...</span>
            {:else}
              <span>📤</span>
              <span>ส่งข้อความ</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>