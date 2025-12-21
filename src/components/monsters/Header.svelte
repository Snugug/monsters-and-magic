<script>
  import { getEntry } from 'astro:content';

  const { monster, m } = $props();

  const meta = monster;
  const lineageTitle = meta.lineage.id
    ? (await getEntry(meta.lineage)).data.title
    : '';
</script>

<header>
  <h1 class="title modesto">{meta.title}</h1>
  <p class="size-type">
    {meta.ancient && 'Ancient '}
    {meta.legendary && 'Legendary '}
    {meta.size}
    {meta.swarm
      ? ` swarm of ${meta.swarm} ${meta.type}s`
      : meta.type}{lineageTitle ? ` (${lineageTitle})` : ''}
  </p>
</header>

<style lang="scss">
  .title {
    grid-column: 1 / -1;
    font-size: 2rem;
    color: var(--dark-red);
    line-height: 1;
    border-bottom: 1px solid var(--gold);
  }

  .size-type {
    font-size: 0.9rem;
    text-transform: capitalize;
    font-style: italic;
    color: var(--dark-grey);
  }
</style>
