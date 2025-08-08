<script>
  import { onMount } from 'svelte';
  import { initAuth, user, loading } from '$stores/auth.js';
  import SimpleHeader from '$lib/components/SimpleHeader.svelte';
  import NotificationToast from '$components/NotificationToast.svelte';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';
  import '../app.css';

  // Accept params prop to avoid warnings
  export const params = {};

  onMount(() => {
    initAuth();
  });
</script>

{#if $loading}
  <div class="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" text="กำลังโหลดระบบ..." />
  </div>
{:else}
  <div class="min-h-screen flex flex-col bg-white">
    <SimpleHeader user={$user} />
    <main class="flex-1 p-5 bg-gray-50">
      <slot />
    </main>
  </div>
{/if}

<NotificationToast />