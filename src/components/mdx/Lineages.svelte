<script>
  import { getCollection } from 'astro:content';
  import Icon from '$components/Icon.svelte';

  const traits = Object.groupBy(
    (await getCollection('traits')).sort((a, b) =>
      a.data.title.localeCompare(b.data.title),
    ),
    (o) => o.data.lineage.id,
  );

  const lineage = await Promise.all(
    (await getCollection('lineage')).sort((a, b) =>
      a.data.title.localeCompare(b.data.title),
    ),
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
        {#each traits[a.slug] as t}
          <li>
            <h4 id={t.slug} class="type--h3 trait--title">
              <span>{t.data.title}</span>
              <Icon
                label={`Points: ${t.data.points}`}
                icon={`c${t.data.points}`}
              />
            </h4>
            <div class="type">
              {@html t.rendered.html}
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
