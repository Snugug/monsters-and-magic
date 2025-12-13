<script>
  import { createMarkdownProcessor } from '@astrojs/markdown-remark';
  import { markdown } from '$$lib/markdown';
  import { tags } from '$lib/shared';

  const md = await createMarkdownProcessor(markdown);

  // Convert the tags object into an array and render markdown
  const tagList = (
    await Promise.all(
      Object.entries(tags).map(async ([key, val]) => ({
        tag: val.tag || key,
        points: val.points,
        desc: (await md.render(val.full)).code,
      })),
    )
  ).sort((a, b) => a.tag.localeCompare(b.tag));
</script>

<table>
  <thead>
    <tr>
      <th style="width: 7rem; text-align: left">Trait</th>
      <th style="width: 4rem;">Points</th>
      <th style="text-align: left">Description</th>
    </tr>
  </thead>
  <tbody>
    {#each tagList as tag}
      <tr>
        <td class="tag-name">{tag.tag}</td>
        <td class="tag-points">{tag.points}</td>
        <td>{@html tag.desc}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .tag-name {
    text-transform: capitalize;
  }

  .tag-points {
    text-align: center;
  }
</style>
