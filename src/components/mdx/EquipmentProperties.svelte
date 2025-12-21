<script lang="ts">
  import { getCollection } from 'astro:content';

  /**
   * Component to render equipment properties (weapon properties, focus properties, weapon masteries)
   * as definition lists. Queries the dedicated 'properties' collection.
   */
  interface Props {
    type: 'Weapon Property' | 'Focus Property' | 'Weapon Mastery';
  }

  const { type }: Props = $props();

  const entries = (await getCollection('properties'))
    .filter((e) => e.data.type === type)
    .sort((a, b) => a.data.title.localeCompare(b.data.title));
</script>

<dl>
  {#each entries as entry}
    <dt>{entry.data.title}</dt>
    <dd>{@html entry.rendered?.html}</dd>
  {/each}
</dl>
