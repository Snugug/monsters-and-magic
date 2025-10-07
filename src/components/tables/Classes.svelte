<script>
  import { getCollection } from 'astro:content';
  import Icon from '$components/Icon.svelte';
  import { createMarkdownProcessor } from '@astrojs/markdown-remark';
  import { markdown } from '$$lib/markdown';

  const md = await createMarkdownProcessor(markdown);

  const classes = await Promise.all(
    (await getCollection('classes'))
      .sort((a, b) => a.data.title.localeCompare(b.data.title))
      .map(async (p) => {
        p.data.feats = await Promise.all(
          p.data.feats.map(async (f) => {
            const desc = await md.render(f.description);
            f.description = desc.code;
            return f;
          }),
        );
        return p;
      }),
  );
</script>

<ul role="list">
  {#each classes as a}
    <li class="lineage">
      <header>
        <h2 class="title type--h2">{a.data.title}</h2>
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
        <ul role="list">
          {#each a.data.feats as t}
            <li>
              <h3 class="type--h3 feat--title">
                <span>{t.title}</span>
                {#if t.core || t.spellcasting || t.rare}
                  <span class="icons">
                    {#if t.core}
                      <Icon label="Core Feat" icon="diamond" />
                    {/if}
                    {#if t.spellcasting}
                      <Icon label="Spellcasting Feat" icon="wand" />
                    {/if}
                    {#if t.rare}
                      <span class="rare">
                        <Icon label="Rare Feat" icon="flare" />
                      </span>
                    {/if}
                  </span>
                {/if}
              </h3>

              <div class="type">
                {@html t.description}
              </div>
            </li>
          {/each}
        </ul>
      </section>
    </li>
  {/each}
</ul>

<style lang="scss">
  li,
  ul {
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
