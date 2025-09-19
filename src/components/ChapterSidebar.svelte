<script lang="ts">
  import type { MarkdownHeading } from 'astro';
  import { chapterTitle } from '$lib/helpers';

  const {
    title,
    chapter,
    headings,
    slug,
  }: {
    title: string;
    chapter: number;
    headings: MarkdownHeading[];
    slug: string;
  } = $props();
  console.log(headings);
</script>

<div class="sidebar">
  <nav>
    <ul role="list" class="subnav">
      <li class="modesto type--h3 title">
        <a href={`#${slug}`}>{chapterTitle(chapter, title)}</a>
      </li>
      {#each headings as heading, i}
        <li>
          <a href={`#${heading.slug}`} style={`--depth: ${heading.depth - 1}`}
            >{heading.text}</a
          >
        </li>
      {/each}
    </ul>
  </nav>
</div>

<style lang="scss">
  .sidebar {
    background: var(--white);
    border: 1px solid var(--dark-yellow);
    // padding-block-end: 0.5rem;
    max-height: calc(100vh - (var(--header-height) + 2rem));
    overflow-y: auto;
    //
  }

  .subnav {
    scroll-target-group: auto;
  }

  a {
    color: currentColor;
    text-decoration: none;
  }

  .title {
    border-bottom: none;
    margin-block-end: 0;
  }

  a {
    display: block;
    width: 100%;
    padding: 0.25rem 0.5rem;
    border-left: 2px solid transparent;
    padding-inline-start: calc(0.5rem * var(--depth, 1));

    &:target-current,
    &:hover {
      background: hsl(from var(--light-yellow) h calc(s / 2) calc(l * 1.2));
      border-color: var(--dark-yellow);
    }
  }
</style>
