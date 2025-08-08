<!--
  @component Card
  Reusable card component following Tailwind design system
-->
<script>
  /**
   * Card padding
   * @type {'none' | 'sm' | 'md' | 'lg'}
   */
  export let padding = 'md';
  
  /**
   * Card shadow
   * @type {'none' | 'sm' | 'md' | 'lg'}
   */
  export let shadow = 'sm';
  
  /**
   * Card border
   * @type {boolean}
   */
  export let border = true;
  
  /**
   * Hover effect
   * @type {boolean}
   */
  export let hover = false;

  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  // Shadow classes
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  // Base classes
  const baseClasses = 'bg-white rounded-xl';
  
  $: classes = [
    baseClasses,
    paddingClasses[padding],
    shadowClasses[shadow],
    border ? 'border border-gray-200' : '',
    hover ? 'hover:shadow-md transition-shadow duration-200' : ''
  ].filter(Boolean).join(' ');
</script>

<div class={classes} {...$$restProps}>
  <slot />
</div>