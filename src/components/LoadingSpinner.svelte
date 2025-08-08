<!--
  @component LoadingSpinner
  Loading spinner component
-->
<script>
  /**
   * Spinner size
   * @type {'sm' | 'md' | 'lg'}
   */
  export let size = 'md';
  
  /**
   * Spinner color
   * @type {string}
   */
  export let color = 'text-primary-700';
  
  /**
   * Show text
   * @type {boolean}
   */
  export let showText = true;
  
  /**
   * Loading text
   * @type {string}
   */
  export let text = 'กำลังโหลด...';

  // Size classes
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
</script>

<div class="flex flex-col items-center justify-center p-4">
  <svg 
    class="animate-spin {sizeClasses[size]} {color}" 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
  >
    <circle 
      class="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      stroke-width="4"
    ></circle>
    <path 
      class="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
  
  {#if showText}
    <p class="mt-2 text-sm text-gray-600">{text}</p>
  {/if}
</div>