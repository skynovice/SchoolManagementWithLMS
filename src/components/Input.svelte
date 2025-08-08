<!--
  @component Input
  Reusable input component following Tailwind design system
-->
<script>
  /**
   * Input type
   * @type {string}
   */
  export let type = 'text';
  
  /**
   * Input value
   * @type {string}
   */
  export let value = '';
  
  /**
   * Input placeholder
   * @type {string}
   */
  export let placeholder = '';
  
  /**
   * Input label
   * @type {string}
   */
  export let label = '';
  
  /**
   * Required field
   * @type {boolean}
   */
  export let required = false;
  
  /**
   * Disabled state
   * @type {boolean}
   */
  export let disabled = false;
  
  /**
   * Error message
   * @type {string}
   */
  export let error = '';
  
  /**
   * Help text
   * @type {string}
   */
  export let help = '';
  
  /**
   * Input size
   * @type {'sm' | 'md' | 'lg'}
   */
  export let size = 'md';

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-4 py-3 text-lg'
  };

  // Base classes
  const baseClasses = 'w-full border rounded-lg font-kanit transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold-500';
  
  $: inputClasses = [
    baseClasses,
    sizeClasses[size],
    error ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-gold-500',
    disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
  ].filter(Boolean).join(' ');
</script>

<div class="w-full">
  {#if label}
    <label class="block text-sm font-medium text-gray-700 mb-2">
      {label}
      {#if required}
        <span class="text-red-500">*</span>
      {/if}
    </label>
  {/if}
  
  {#if type === 'text'}
    <input
      type="text"
      {placeholder}
      {required}
      {disabled}
      class={inputClasses}
      bind:value
      on:input
      on:change
      on:focus
      on:blur
      on:keydown
      on:keyup
    />
  {:else if type === 'email'}
    <input
      type="email"
      {placeholder}
      {required}
      {disabled}
      class={inputClasses}
      bind:value
      on:input
      on:change
      on:focus
      on:blur
      on:keydown
      on:keyup
    />
  {:else if type === 'password'}
    <input
      type="password"
      {placeholder}
      {required}
      {disabled}
      autocomplete="current-password"
      class={inputClasses}
      bind:value
      on:input
      on:change
      on:focus
      on:blur
      on:keydown
      on:keyup
    />
  {:else if type === 'number'}
    <input
      type="number"
      {placeholder}
      {required}
      {disabled}
      class={inputClasses}
      bind:value
      on:input
      on:change
      on:focus
      on:blur
      on:keydown
      on:keyup
    />
  {:else if type === 'tel'}
    <input
      type="tel"
      {placeholder}
      {required}
      {disabled}
      class={inputClasses}
      bind:value
      on:input
      on:change
      on:focus
      on:blur
      on:keydown
      on:keyup
    />
  {:else if type === 'url'}
    <input
      type="url"
      {placeholder}
      {required}
      {disabled}
      class={inputClasses}
      bind:value
      on:input
      on:change
      on:focus
      on:blur
      on:keydown
      on:keyup
    />
  {:else if type === 'search'}
    <input
      type="search"
      {placeholder}
      {required}
      {disabled}
      class={inputClasses}
      bind:value
      on:input
      on:change
      on:focus
      on:blur
      on:keydown
      on:keyup
    />
  {:else}
    <input
      type="text"
      {placeholder}
      {required}
      {disabled}
      class={inputClasses}
      bind:value
      on:input
      on:change
      on:focus
      on:blur
      on:keydown
      on:keyup
    />
  {/if}
  
  {#if error}
    <p class="mt-1 text-sm text-red-600">{error}</p>
  {:else if help}
    <p class="mt-1 text-sm text-gray-500">{help}</p>
  {/if}
</div>