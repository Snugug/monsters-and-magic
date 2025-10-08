<script>
  import { getCollection } from 'astro:content';
  import Icon from '$components/Icon.svelte';
  import { createMarkdownProcessor } from '@astrojs/markdown-remark';
  import { markdown } from '$$lib/markdown';
  import slugify from 'slugify';

  const md = await createMarkdownProcessor(markdown);

  const lineage = await Promise.all(
    (await getCollection('lineage'))
      .sort((a, b) => a.data.title.localeCompare(b.data.title))
      .map(async (p) => {
        p.data.traits = await Promise.all(
          p.data.traits.map(async (t) => {
            const desc = await md.render(t.description);
            t.description = desc.code;
            return t;
          }),
        );
        return p;
      }),
  );
</script>

{#each lineage as a}
  <section class="lineage">
    <header>
      <h3 id={a.slug} class="title type--h2">{a.data.title}</h3>
      <p>
        <strong>Size:</strong>
        {a.data.size.join(', ')}
      </p>
    </header>
    <div>
      {@html a.rendered.html}
    </div>
    <section>
      <ul role="list">
        {#each a.data.traits as t}
          <li>
            <h4
              id={slugify(t.title, { lower: true })}
              class="type--h3 trait--title"
            >
              <span>{t.title}</span>
              <Icon label={`Points: ${t.points}`} icon={`c${t.points}`} />
            </h4>
            <div class="type">
              {@html t.description}
            </div>
          </li>
        {/each}
      </ul>
    </section>
  </section>
{/each}

<style lang="scss">
  li,
  ul {
    margin: 0;
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

  .trait {
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
</style>
