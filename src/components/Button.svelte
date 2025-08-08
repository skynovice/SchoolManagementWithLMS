<!--
  @component Button
  Reusable button component with modern design
-->
<script>
  /**
   * Button variant
   * @type {'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'ghost'}
   */
  export let variant = 'primary';
  
  /**
   * Button size
   * @type {'sm' | 'md' | 'lg'}
   */
  export let size = 'md';
  
  /**
   * Disabled state
   * @type {boolean}
   */
  export let disabled = false;
  
  /**
   * Loading state
   * @type {boolean}
   */
  export let loading = false;
  
  /**
   * Full width button
   * @type {boolean}
   */
  export let fullWidth = false;
  
  /**
   * Button type
   * @type {'button' | 'submit' | 'reset'}
   */
  export let type = 'button';

  /**
   * Link href (if provided, renders as link)
   * @type {string}
   */
  export let href = '';

  /**
   * Link target
   * @type {string}
   */
  export let target = '';

  /**
   * Additional CSS classes
   * @type {string}
   */
  let className = '';
  export { className as class };

  // Variant classes with modern colors
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white border-transparent shadow-sm hover:shadow-md',
    secondary: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 text-white border-transparent shadow-sm hover:shadow-md',
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white border-transparent shadow-sm hover:shadow-md',
    warning: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500 text-white border-transparent shadow-sm hover:shadow-md',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white border-transparent shadow-sm hover:shadow-md',
    outline: 'bg-white hover:bg-gray-50 focus:ring-blue-500 text-gray-700 border-gray-300 shadow-sm hover:shadow-md',
    ghost: 'bg-transparent hover:bg-gray-100 focus:ring-gray-500 text-gray-700 border-transparent'
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm font-medium',
    md: 'px-4 py-2 text-sm font-medium',
    lg: 'px-6 py-3 text-base font-medium'
  };

  // Base classes
  const baseClasses = 'inline-flex items-center justify-center rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  $: classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    disabled || loading ? 'cursor-not-allowed' : 'cursor-pointer',
    className
  ].filter(Boolean).join(' ');
</script>

{#if href}
  <a
    {href}
    {target}
    class={classes}
    class:pointer-events-none={disabled || loading}
    on:click
    on:focus
    on:blur
  >
    {#if loading}
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    {/if}
    <slot />
  </a>
{:else}
  <button
    {type}
    class={classes}
    disabled={disabled || loading}
    on:click
    on:focus
    on:blur
  >
    {#if loading}
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    {/if}
    <slot />
  </button>
{/if}