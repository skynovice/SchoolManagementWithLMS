<!--
  @component Modal
  Reusable modal component following Tailwind design system
-->
<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  /**
   * Modal open state
   * @type {boolean}
   */
  export let open = false;
  
  /**
   * Modal title
   * @type {string}
   */
  export let title = '';
  
  /**
   * Modal size
   * @type {'sm' | 'md' | 'lg' | 'xl'}
   */
  export let size = 'md';
  
  /**
   * Close on backdrop click
   * @type {boolean}
   */
  export let closeOnBackdrop = true;
  
  /**
   * Show close button
   * @type {boolean}
   */
  export let showCloseButton = true;

  // Size classes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  const handleBackdropClick = () => {
    if (closeOnBackdrop) {
      close();
    }
  };

  const close = () => {
    dispatch('close');
  };

  const handleKeydown = (event) => {
    if (event.key === 'Escape' && open) {
      close();
    }
  };
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby={title ? 'modal-title' : undefined}
  >
    <div 
      class="bg-white rounded-xl shadow-lg w-full {sizeClasses[size]} max-h-[90vh] overflow-y-auto"
      on:click|stopPropagation
    >
      {#if title || showCloseButton}
        <div class="flex justify-between items-center p-6 border-b border-gray-200">
          {#if title}
            <h2 id="modal-title" class="text-xl font-semibold text-primary-800">{title}</h2>
          {:else}
            <div></div>
          {/if}
          
          {#if showCloseButton}
            <button 
              class="text-gray-400 hover:text-gray-600 transition-colors"
              on:click={close}
              aria-label="ปิด"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          {/if}
        </div>
      {/if}
      
      <div class="p-6">
        <slot />
      </div>
      
      {#if $$slots.footer}
        <div class="flex justify-end gap-3 p-6 border-t border-gray-200">
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}