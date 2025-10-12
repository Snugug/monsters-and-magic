<script>
  import { getCollection } from 'astro:content';
  import Icon from '$components/Icon.svelte';

  let { type } = $props();

  const techniques = await Promise.all(
    (await getCollection('techniques'))
      .filter((a) => a.data.type === type)
      .sort((a, b) => a.data.title.localeCompare(b.data.title)),
  );
</script>

{#each techniques as t}
  <section>
    <h3 id={t.slug}>
      <span>{t.data.title}</span>
      {#if t.data.ap}
        {#if t.data.ap === 1}
          <Icon label="1 AP" icon="ap1" />
        {:else if t.data.ap === 2}
          <span class="ap2">
            <Icon label="2 AP" icon="ap2" />
          </span>
        {:else if t.data.ap === 3}
          <span class="ap3">
            <Icon label="3 AP" icon="ap3" />
          </span>
        {/if}
      {/if}
      {#if t.data.reaction}
        <Icon label="Reaction" icon="rxn" />
      {/if}
    </h3>
    {#if t.data.reaction}
      <p class="reaction">
        <Icon label="Reaction" icon="rxn" />
        {t.data.reaction}
      </p>
    {/if}
    <div>
      {@html t.rendered.html}
    </div>
  </section>
{/each}

<style lang="scss">
  h3 {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;

    :global(.icon) {
      height: 0.75em;
      width: 0.75em;
    }

    .ap2 :global(.icon) {
      width: 1.0625em;
    }

    .ap3 :global(.icon) {
      width: 1.25em;
    }
  }

  .reaction {
    margin-block-end: 1rem;
  }
</style>
