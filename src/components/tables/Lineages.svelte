<script>
  import { getCollection } from 'astro:content';
  import Icon from '$components/Icon.svelte';
  import { createMarkdownProcessor } from '@astrojs/markdown-remark';
  import { markdown } from '$$lib/markdown';

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

<ul role="list">
  {#each lineage as a}
    <li class="lineage">
      <header>
        <h2 class="title type--h2">{a.data.title}</h2>
        <p>
          <strong>Size:</strong>
          {a.data.size.join(', ')}
        </p>
      </header>
      <div class="type" set:html={a.rendered.html} />
      <section>
        <ul role="list">
          {#each a.data.traits as t}
            <li>
              <h3 class="type--h3 trait--title">
                <span>{t.title}</span>
                <Icon label={`Points: ${t.points}`} icon={`c${t.points}`} />
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
