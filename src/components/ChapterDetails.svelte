<script lang="ts">
  import { type MarkdownHeading } from 'astro';
  import Icon from '$components/Icon.svelte';
  import ChapterDetails from '$components/ChapterDetails.svelte';

  interface ChapterSubnav extends MarkdownHeading {
    children?: ChapterSubnav[];
  }

  const { chapter }: { chapter: ChapterSubnav } = $props();
</script>

<li>
  {#if chapter?.children?.length}
    <details>
      <summary>
        <a href={`#${chapter.slug}`} style={`--depth: ${chapter.depth - 1}`}
          >{chapter.text}</a
        >
        <Icon icon="forward" label="expand" />
      </summary>
      <ul role="list">
        {#each chapter.children as child}
          <ChapterDetails chapter={child} />
        {/each}
      </ul>
    </details>
  {:else}
    <a href={`#${chapter.slug}`} style={`--depth: ${chapter.depth - 1}`}
      >{chapter.text}</a
    >
  {/if}
</li>

<style lang="scss">
  details {
    summary {
      list-style: none;
      display: grid;
      grid-template-columns: 1fr 1.25rem;
      gap: 0.5rem;
      align-items: center;

      :global(svg) {
        height: 1.25rem;
        width: 1.25rem;
      }

      &:has(:target-current),
      &:hover {
        background: hsl(from var(--light-yellow) h calc(s / 2) calc(l * 1.2));
        a {
          border-color: var(--dark-yellow);
        }
      }

      &::-webkit-details-marker {
        display: none;
      }
    }

    &[open] > summary :global(svg) {
      transform: rotate(90deg);
    }

    ul + ul {
      margin: 0;
      padding: 0;
    }

    li {
      margin: 0;
      padding: 0;
    }

    &:has(:target-current),
    &[open] {
      background: hsl(from var(--light-yellow) h 25 85);
    }

    &:has(:target-current) {
      > summary :global(svg) {
        transform: rotate(90deg);
      }
      // background: yellow;
      &::details-content {
        content-visibility: visible;
        height: auto !important;
      }
    }
  }

  a {
    display: block;
    width: 100%;
    padding: 0.25rem 0.5rem;
    text-decoration: none;
    border-left: 2px solid transparent;
    color: var(--black);
    padding-inline-start: calc(0.5rem * var(--depth, 1));

    &:target-current,
    &:hover {
      background: hsl(from var(--light-yellow) h calc(s / 2) calc(l * 1.2));
      border-color: var(--dark-yellow);
    }
  }
</style>
