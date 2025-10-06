<script>
  let { character } = $props();

  const enabled = $derived(!!character);
  console.log(enabled);
</script>

<table class="level-up">
  <thead>
    <tr>
      <th>Adventurer</th>
      <th>Heroic</th>
      <th>Legendary</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>+1 to 1 ability</span>
        </label>
      </td>
      <td>
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>+1 to 1 ability</span>
        </label>
      </td>
      <td>
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>+1 to 1 ability</span>
        </label>
      </td>
    </tr>
    <tr>
      <td>
        <input type="checkbox" disabled={!enabled} />
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>Gain 1 non-rare feat</span>
        </label>
      </td>
      <td>
        <input type="checkbox" disabled={!enabled} />
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>Gain 1 feat</span>
        </label>
      </td>
      <td>
        <input type="checkbox" disabled={!enabled} />
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>Gain 1 feat</span>
        </label>
      </td>
    </tr>
    <tr>
      <td>
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>+10 HP</span>
        </label>
      </td>
      <td>
        <input type="checkbox" disabled={!enabled} />
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>+10 HP</span>
        </label>
      </td>
      <td>
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>+10 HP</span>
        </label>
      </td>
    </tr>
    <tr>
      <td>
        <input type="checkbox" disabled={!enabled} />
        <input type="checkbox" disabled={!enabled} />
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>Learn 1 non-rare technique or charm</span>
        </label>
      </td>
      <td>
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>Learn 1 technique or charm</span>
        </label>
      </td>
      <td>
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>Learn 1 technique or charm</span>
        </label>
      </td>
    </tr>
    <tr>
      <td>
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>+1 to two talents</span>
        </label>
      </td>
      <td>
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>+1 to two talents</span>
        </label>
      </td>
      <td>
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>+1 to two talents</span>
        </label>
      </td>
    </tr>
    <tr>
      <td>
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>Gain a talent</span>
        </label>
      </td>
      <td>
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>Gain a talent or expertise in a talent</span>
        </label>
      </td>
      <td>
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>Gain a talent or expertise in a talent</span>
        </label>
      </td>
    </tr>
    <tr>
      <td>
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>+1 thread of fate</span>
        </label>
      </td>
      <td>
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>+1 thread of fate</span>
        </label>
      </td>
      <td>
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>+1 thread of fate</span>
        </label>
      </td>
    </tr>
    <tr>
      <td>
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>Gain proficiency and mastery of a single non-exotic weapon</span
          >
        </label>
      </td>
      <td>
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>Gain proficiency shields or the next tier of armor</span>
        </label>
      </td>
      <td>
        <label>
          <input type="checkbox" disabled={!enabled} />
          <span>+1 AC</span>
        </label>
      </td>
    </tr>
  </tbody>
</table>
