<script>
  import { goto } from '$app/navigation';
  import { signOut } from '$stores/auth.js';
  import { showSuccess, showError } from '$stores/notifications.js';
  
  export let user = null;

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      showSuccess('ออกจากระบบสำเร็จ');
      goto('/');
    } else {
      showError(result.error);
    }
  };
</script>

<header class="bg-primary-800 shadow-lg px-5">
  <div class="max-w-6xl mx-auto flex justify-between items-center h-18">
    <a href="/" class="text-2xl font-bold text-white no-underline">
      🏫 School Management
    </a>
    
    <nav class="flex gap-5 items-center">
      {#if user}
        <a href="/dashboard" class="text-primary-100 font-medium px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors no-underline">
          แดชบอร์ด
        </a>
        <a href="/lms" class="text-primary-100 font-medium px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors no-underline">
          📚 LMS
        </a>
        <a href="/messages" class="text-primary-100 font-medium px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors no-underline">
          ข้อความ
        </a>
        <a href="/reports" class="text-primary-100 font-medium px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors no-underline">
          รายงาน
        </a>
        <button 
          class="bg-gold-500 text-white px-4 py-2 rounded-lg hover:bg-gold-600 transition-colors text-sm font-medium shadow-md"
          on:click={handleSignOut}
        >
          ออกจากระบบ
        </button>
      {:else}
        <a href="/lms" class="text-primary-100 font-medium px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors no-underline">
          📚 LMS
        </a>
        <a href="/login" class="text-primary-100 font-medium px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors no-underline">
          เข้าสู่ระบบ
        </a>
      {/if}
    </nav>
  </div>
</header>