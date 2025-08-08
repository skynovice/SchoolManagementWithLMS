<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import { goto } from '$app/navigation';

  let user = null;
  let messages = [];
  let loading = true;
  let activeTab = 'inbox'; // inbox, sent

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      goto('/login');
      return;
    }
    
    user = session.user;
    await loadMessages();
    loading = false;
  });

  async function loadMessages() {
    if (!user) return;
    
    let query;
    if (activeTab === 'inbox') {
      query = supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            id,
            full_name,
            role
          )
        `)
        .eq('recipient_id', user.id);
    } else {
      query = supabase
        .from('messages')
        .select(`
          *,
          recipient:profiles!messages_recipient_id_fkey (
            id,
            full_name,
            role
          )
        `)
        .eq('sender_id', user.id);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (data) {
      messages = data;
    }
  }

  async function markAsRead(messageId) {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId);
    
    await loadMessages();
  }

  async function deleteMessage(messageId) {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบข้อความนี้?')) {
      await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
      
      await loadMessages();
    }
  }

  function switchTab(tab) {
    activeTab = tab;
    loadMessages();
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
</script>



<div class="max-w-4xl mx-auto">
  <div class="flex justify-between items-center mb-8">
    <h1 class="text-3xl font-semibold text-gray-900">ข้อความ</h1>
    <a href="/messages/compose" class="bg-gold-500 hover:bg-gold-600 text-white font-medium px-6 py-2 rounded-lg transition-colors no-underline shadow-md">
      เขียนข้อความใหม่
    </a>
  </div>

  <div class="flex bg-white rounded-lg shadow-sm border border-gray-200 mb-5 overflow-hidden">
    <button 
      class="flex-1 px-5 py-4 text-center transition-colors {activeTab === 'inbox' ? 'bg-primary-700 text-white' : 'text-gray-600 hover:bg-gray-50'}"
      on:click={() => switchTab('inbox')}
    >
      📥 กล่องข้อความ
    </button>
    <button 
      class="flex-1 px-5 py-4 text-center transition-colors {activeTab === 'sent' ? 'bg-primary-700 text-white' : 'text-gray-600 hover:bg-gray-50'}"
      on:click={() => switchTab('sent')}
    >
      📤 ข้อความที่ส่ง
    </button>
  </div>

  {#if loading}
    <div class="text-center py-12 text-gray-600">กำลังโหลดข้อความ...</div>
  {:else if messages.length === 0}
    <div class="text-center py-12 text-gray-600">
      <p>
        {activeTab === 'inbox' ? 'ไม่มีข้อความในกล่องข้อความ' : 'ยังไม่ได้ส่งข้อความ'}
      </p>
    </div>
  {:else}
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {#each messages as message, index}
        <div 
          class="p-5 transition-colors hover:bg-gray-50 cursor-pointer {activeTab === 'inbox' && !message.is_read ? 'bg-gold-50 border-l-4 border-gold-500' : ''} {index < messages.length - 1 ? 'border-b border-gray-200' : ''}"
        >
          <div class="flex justify-between items-start mb-3">
            <div class="flex flex-col gap-1">
              {#if activeTab === 'inbox'}
                <div class="font-semibold text-gray-900">{message.sender?.full_name || 'ไม่ทราบชื่อ'}</div>
                <div class="text-sm text-gray-500">{getRoleDisplayName(message.sender?.role)}</div>
              {:else}
                <div class="font-semibold text-gray-900">ถึง: {message.recipient?.full_name || 'ไม่ทราบชื่อ'}</div>
                <div class="text-sm text-gray-500">{getRoleDisplayName(message.recipient?.role)}</div>
              {/if}
            </div>
            <div class="text-sm text-gray-500">
              {new Date(message.created_at).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
          
          <div class="text-lg font-medium text-primary-800 mb-2">{message.subject}</div>
          <div class="text-gray-600 leading-relaxed line-clamp-2 mb-3">{message.content}</div>
          
          <div class="flex gap-3">
            {#if activeTab === 'inbox' && !message.is_read}
              <button 
                class="bg-success text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors" 
                on:click={() => markAsRead(message.id)}
              >
                ทำเครื่องหมายว่าอ่านแล้ว
              </button>
            {/if}
            <button 
              class="bg-danger text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors" 
              on:click={() => deleteMessage(message.id)}
            >
              ลบ
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>