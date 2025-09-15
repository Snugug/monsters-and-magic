<script>
  let { label, icon, hidden = false } = $props();
</script>

<svg
  aria-label={label}
  aria-hidden={hidden}
  xmlns:xlink="http://www.w3.org/1999/xlink"
  class="icon"
>
  <use aria-hidden="true" xlink:href={`#icon--${icon}`} />
</svg>
