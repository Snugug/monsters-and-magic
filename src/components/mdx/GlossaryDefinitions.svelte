<script lang="ts">
  import { getCollection } from 'astro:content';

  /**
   * Component to render glossary entries as definition lists.
   * Filters by type and renders title + body for each entry.
   */
  interface Props {
    type:
      | 'Weapon Property'
      | 'Focus Property'
      | 'Weapon Mastery'
      | 'Armor Mastery'
      | 'Armor Property'
      | 'Damage Type';
  }

  const { type }: Props = $props();

  const items = await getCollection('glossary');
  console.log(type);

  const entries = items
    .filter((e) => e.data.type?.includes(type))
    .sort((a, b) => a.data.title.localeCompare(b.data.title));

  // console.log(entries);
</script>

<dl>
  {#each entries as entry}
    <dt>{entry.data.title}</dt>
    <dd>{@html entry.rendered.html}</dd>
  {/each}
</dl>
