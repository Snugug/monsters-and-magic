<script lang="ts">
  import { type MarkdownHeading } from 'astro';
  import { chapterTitle } from '$lib/helpers';
  import ChapterNav from './ChapterNav.svelte';
  import ChapterDetails from '$components/ChapterDetails.svelte';
  import Icon from '$components/Icon.svelte';

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

  interface ChapterSubnav extends MarkdownHeading {
    children?: ChapterSubnav[];
  }

  interface TreeMap {
    [key: number]: {
      children: ChapterNav[];
    };
  }

  function buildTree(items: MarkdownHeading[]) {
    // The final tree will be built here.
    const tree: ChapterSubnav[] = [];
    // A dictionary to keep track of the last parent found at each depth level.
    // We use a dummy root at depth 0 to simplify the logic.
    const parentMap: TreeMap = { 0: { children: tree } };

    // Iterate over each item in the flat array.
    for (const item of items) {
      // Create a new node object, adding a 'children' array for future nested items.
      const node = { ...item, children: [] };

      // Find the parent for the current node by looking up the depth-1 level.
      const parent = parentMap[node.depth - 1];

      if (parent) {
        // Add the new node to its parent's children array.
        parent.children.push(node);
        // Update the parent map, so this node can be a parent for the next level down.
        parentMap[node.depth] = node;
      } else {
        // If no parent is found at the expected depth, it means this is a new root node.
        tree.push(node);
        parentMap[node.depth] = node;
      }
    }

    return tree;
  }

  const headingTree = buildTree(headings);
</script>

<nav class="sidebar">
  <details>
    <summary class="modesto type--h3 title">
      <a href={`#${slug}`}>{chapterTitle(chapter, title)}</a>
      <Icon icon="forward" label="expand" />
    </summary>
    <ul role="list" class="subnav">
      {#each headingTree as heading}
        <ChapterDetails chapter={heading} />
      {/each}
    </ul>
  </details>
</nav>

<style lang="scss">
  summary {
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }

    &:hover,
    &:hover a {
      background: hsl(from var(--light-yellow) h calc(s / 2) calc(l * 1.2));
      border-color: var(--dark-yellow);
    }

    @container style(--collapsed: 0) {
      &:has(:target-current),
      &:has(:target-current) a {
        background: hsl(from var(--light-yellow) h calc(s / 2) calc(l * 1.2));
        border-color: var(--dark-yellow);
      }
    }

    @container style(--collapsed: 1) {
      display: grid;
      grid-template-columns: 1fr 1.5rem;
      gap: 0.5rem;
      align-items: center;

      :global(svg) {
        height: 1.5rem;
        width: 1.5rem;
      }
    }

    @container style(--collapsed: 0) {
      :global(svg) {
        display: none;
      }
    }
  }

  details {
    &[open] > summary :global(svg) {
      transform: rotate(90deg);
    }

    @container style(--collapsed: 0) {
      &::details-content {
        content-visibility: visible;
        height: auto !important;
      }
    }
  }

  .sidebar {
    background: var(--white);
    border: 1px solid var(--dark-yellow);
    // padding-block-end: 0.5rem;
    max-height: calc(100vh - (var(--header-height) + 2rem));
    overflow-y: auto;
    scroll-target-group: auto;
    //
  }

  a {
    color: currentColor;
    text-decoration: none;
  }

  .title {
    border-bottom: none;
    margin-block-end: 0;
    padding-block-end: 0;
  }

  a {
    display: block;
    width: 100%;
    padding: 0.25rem 0.5rem;
    border-left: 2px solid transparent;
    padding-inline-start: calc(0.5rem * var(--depth, 1));

    // &:target-current,
    // &:hover {
    //   background: hsl(from var(--light-yellow) h calc(s / 2) calc(l * 1.2));
    //   border-color: var(--dark-yellow);
    // }
  }
</style>
