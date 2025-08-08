<!--
  @component NotificationToast
  Toast notification component
-->
<script>
  import { notifications, removeNotification } from '$stores/notifications.js';
  import { fly } from 'svelte/transition';

  // Notification type styles
  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  // Notification icons
  const typeIcons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
</script>

<div class="fixed top-4 right-4 z-50 space-y-2">
  {#each $notifications as notification (notification.id)}
    <div
      class="flex items-center p-4 border rounded-lg shadow-lg max-w-sm {typeStyles[notification.type]}"
      transition:fly={{ x: 300, duration: 300 }}
    >
      <span class="mr-3 text-lg">
        {typeIcons[notification.type]}
      </span>
      
      <div class="flex-1">
        <p class="text-sm font-medium">{notification.message}</p>
      </div>
      
      <button
        class="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
        on:click={() => removeNotification(notification.id)}
        aria-label="ปิดการแจ้งเตือน"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  {/each}
</div>