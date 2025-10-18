<script lang="ts">
  import ImagePicker from '$components/ImagePicker.svelte';

  let image = $state('');
  let file = $state(null);

  // $inspect(image);
  $inspect(file);
  $inspect(image);
</script>

<h1>Build a Monster</h1>

<div class="image">
  <ImagePicker bind:image bind:file type="monster" />
</div>

<style lang="scss">
  .image {
    width: 100px;
    height: 100px;
    border: 1px solid black;
  }
</style>
