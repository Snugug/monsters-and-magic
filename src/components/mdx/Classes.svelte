<script>
  import { getCollection } from 'astro:content';
  import Icon from '$components/Icon.svelte';
  import { sortFeats } from '$lib/helpers';

  const classes = await Promise.all(
    (await getCollection('classes')).sort((a, b) =>
      a.data.title.localeCompare(b.data.title),
    ),
  );

  const feats = Object.groupBy(
    sortFeats((await getCollection('feats')).filter((a) => a.data.class)),
    (o) => o.data.class.id,
  );
</script>

{#each classes as a}
  <section class="lineage">
    <header>
      <h2 id={a.slug} class="title type--h2">{a.data.title}</h2>
      <footer>
        {#if a.data.proficiencies.weapons}
          <p>Proficient with {a.data.proficiencies.weapons}</p>
        {/if}
        {#if a.data.proficiencies.armor}
          <p>Proficient with {a.data.proficiencies.armor}</p>
        {/if}
        <p>{a.data.hp} HP</p>
      </footer>
    </header>
    <div class="type" set:html={a.rendered.html} />
    <section>
      {#each feats[a.slug] as t}
        <h3 id={t.slug} class="type--h3 feat--title">
          <span>{t.data.title}</span>
          {#if t.data.core || t.data.spellcasting || t.data.rare}
            <span class="icons">
              {#if t.data.core}
                <Icon label="Core Feat" icon="diamond" />
              {/if}
              {#if t.data.spellcasting}
                <Icon label="Spellcasting Feat" icon="wand" />
              {/if}
              {#if t.data.rare}
                <span class="rare">
                  <Icon label="Rare Feat" icon="flare" />
                </span>
              {/if}
            </span>
          {/if}
        </h3>

        <div class="type">
          {@html t.rendered.html}
        </div>
      {/each}
    </section>
  </section>
{/each}

<style lang="scss">
  li,
  ul {
    padding: 0;
    display: grid;
    gap: 1rem;
  }

  ul:has(ul) {
    gap: 2rem;
  }

  .type {
    width: 100%;
  }

  .lineage {
    // border: 1px solid var(--dark-yellow) !important;
    // padding: 0.5rem;
    // background: var(--white);
  }

  .feat {
    &--title {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;

      :global(svg) {
        height: 0.75em;
        width: 0.75em;
      }
    }
  }

  .icons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    align-items: center;
  }

  .rare {
    fill: var(--dark-red);
  }
</style>
