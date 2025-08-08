<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import { goto } from '$app/navigation';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';

  let user = null;
  let sentMessages = [];
  let loading = true;
  let searchTerm = '';

  $: filteredMessages = sentMessages.filter(message => 
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.recipient_profile?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      goto('/login');
      return;
    }
    
    user = session.user;
    await loadSentMessages();
    loading = false;
  });

  async function loadSentMessages() {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        recipient_profile:profiles!messages_recipient_id_fkey (
          id,
          full_name,
          email,
          role
        )
      `)
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      sentMessages = data;
    }
  }

  async function deleteMessage(messageId) {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบข้อความนี้?')) {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
      
      if (!error) {
        await loadSentMessages();
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
      'super_admin': 'bg-purple-100 text-purple-800',
      'admin': 'bg-blue-100 text-blue-800',
      'teacher': 'bg-green-100 text-green-800',
      'parent': 'bg-orange-100 text-orange-800',
      'student': 'bg-gray-100 text-gray-800'
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'วันนี้ ' + date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 2) {
      return 'เมื่อวาน ' + date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays <= 7) {
      return diffDays - 1 + ' วันที่แล้ว';
    } else {
      return date.toLocaleDateString('th-TH');
    }
  }

  function truncateContent(content, maxLength = 100) {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }
</script>

<div class="max-w-6xl mx-auto">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl">
        📤
      </div>
      <div>
        <h1 class="text-3xl font-bold text-gray-800">ข้อความที่ส่ง</h1>
        <p class="text-gray-600">ดูข้อความที่คุณส่งไปแล้ว</p>
      </div>
    </div>
    <div class="flex gap-3">
      <a 
        href="/messages/compose" 
        class="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl transition-colors no-underline"
      >
        <span>✍️</span>
        <span>เขียนข้อความ</span>
      </a>
      <a 
        href="/messages" 
        class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors no-underline"
      >
        <span>←</span>
        <span>กลับ</span>
      </a>
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" text="กำลังโหลดข้อความที่ส่ง..." />
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
          placeholder="ค้นหาข้อความที่ส่ง..."
          class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>
    </div>

    <!-- Messages List -->
    {#if filteredMessages.length === 0}
      <div class="text-center py-12">
        <div class="text-6xl mb-4">📤</div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">
          {sentMessages.length === 0 ? 'ยังไม่มีข้อความที่ส่ง' : 'ไม่พบข้อความ'}
        </h3>
        <p class="text-gray-600 mb-6">
          {sentMessages.length === 0 ? 'เริ่มต้นด้วยการส่งข้อความแรกของคุณ' : 'ไม่มีข้อความที่ตรงกับเงื่อนไขการค้นหา'}
        </p>
        <a 
          href="/messages/compose"
          class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all no-underline"
        >
          <span>✍️</span>
          <span>เขียนข้อความใหม่</span>
        </a>
      </div>
    {:else}
      <div class="space-y-4">
        {#each filteredMessages as message}
          <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div class="p-6">
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3 flex-1">
                  <div class="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-2xl">
                    {getRoleIcon(message.recipient_profile?.role)}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-1">
                      <h3 class="font-bold text-gray-900">
                        ถึง: {message.recipient_profile?.full_name}
                      </h3>
                      <span class="px-2 py-1 text-xs font-medium rounded-full {getRoleColor(message.recipient_profile?.role)}">
                        {getRoleDisplayName(message.recipient_profile?.role)}
                      </span>
                    </div>
                    <p class="text-sm text-gray-500">{message.recipient_profile?.email}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-500">{formatDate(message.created_at)}</span>
                  <button
                    on:click={() => deleteMessage(message.id)}
                    class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="ลบข้อความ"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div class="mb-4">
                <h4 class="text-lg font-semibold text-gray-800 mb-2">{message.subject}</h4>
                <p class="text-gray-600 leading-relaxed">
                  {truncateContent(message.content)}
                </p>
              </div>
              
              <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                <div class="flex items-center gap-2 text-sm text-gray-500">
                  <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>ส่งแล้ว</span>
                </div>
                <div class="text-sm text-gray-500">
                  {message.content.length} ตัวอักษร
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Pagination info -->
      <div class="text-center mt-8 text-gray-500">
        แสดง {filteredMessages.length} ข้อความจากทั้งหมด {sentMessages.length} ข้อความ
      </div>
    {/if}
  {/if}
</div>