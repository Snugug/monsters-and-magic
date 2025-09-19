import { writable, get } from 'svelte/store';

class TermReference extends HTMLElement {
  static register(tag = 'ref-') {
    if ('customElements' in window) {
      customElements.define(tag, TermReference);
    }
  }

  static html = `
    <header>
      <a><h2 class="modesto"></h2><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"/></svg></a>
      <button class="close"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" aria-label="Close"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"></path></svg></button>
    </header>
    <div class="body"></div>
  `;

  static index = 0;
  static cache = writable({});

  #instance;
  #set = false;

  constructor() {
    super();
    TermReference.index++;
    this.#instance = TermReference.index;
  }

  get #id() {
    return `termpopover${this.#instance}`;
  }
  get #anchor() {
    return `--termanchor-${this.#instance}`;
  }

  get #ref() {
    return this.getAttribute('src');
  }

  get #href() {
    return `/rules/${this.#ref}`;
  }

  // Build the popup from the found cached item
  #buildPopup(cache) {
    const popover = document.createElement('aside');
    popover.setAttribute('popover', 'manual');
    popover.id = this.#id;
    popover.innerHTML = TermReference.html;
    popover.classList.add('term-popover');
    popover.style.setProperty('position-anchor', this.#anchor);

    const body = popover.querySelector('.body') as HTMLDivElement;
    const header = popover.querySelector('h2') as HTMLHeadingElement;
    const link = popover.querySelector('a') as HTMLAnchorElement;
    const close = popover.querySelector('.close') as HTMLButtonElement;

    const { title, content } = cache;

    header.textContent = title;
    link.href = this.#href;
    document.body.append(popover);
    body.append(content.cloneNode(true));
    close.setAttribute('popoverTarget', this.#id);
    popover.showPopover();

    // Close all children popovers when this one closes
    popover.addEventListener('toggle', (e: ToggleEvent) => {
      if (e.newState === 'closed') {
        const popovers = popover.querySelectorAll(
          '[popovertarget]',
        ) as NodeListOf<HTMLElement>;
        const open = [] as Array<HTMLElement>;
        for (const p of popovers) {
          const target =
            '#' + p.getAttribute('popovertarget') + ':popover-open';
          const elem = document.querySelector(target) as HTMLElement;

          if (elem) {
            open.push(elem);
          }
        }

        for (const child of open) {
          child.hidePopover();
        }
      }

      if (e.newState.state === 'open' && body.children.length === 0) {
        body.append(content.cloneNode(true));
      }
    });

    return popover;
  }

  async connectedCallback() {
    const original = this.innerHTML;
    const span = document.createElement('span');
    span.classList.add('term-ref');
    span.innerHTML = original;
    this.innerHTML = '';
    this.append(span);

    if (get(TermReference.cache)[this.#href] === undefined) {
      // Set the value to _something_ so it won't run multiple times
      TermReference.cache.update((t) => {
        t[this.#href] = false;
        return t;
      });
      const find = await fetch(this.#href);
      if (find.status === 200) {
        const html = await find.text();
        const holder = document.createElement('div');
        holder.innerHTML = html;
        TermReference.cache.update((t) => {
          t[this.#href] = {
            title: holder.querySelector('#title')?.textContent || '',
            content: holder.querySelector('#content') as HTMLDivElement,
          };
          return t;
        });
      }
    }

    // Subscribe to updates to the cache and build the button once the needed item is found.
    TermReference.cache.subscribe((cache) => {
      if (cache[this.#href] && !this.#set) {
        this.#set = true;
        const button = document.createElement('button');
        // button.setAttribute('data-enabled', 'true');
        button.setAttribute('popovertarget', this.#id);
        button.style.setProperty('anchor-name', this.#anchor);
        button.classList.add('term-ref');
        button.innerHTML = original;
        this.innerHTML = '';
        this.append(button);
        let popover;

        // Dynamically add the popup only when first clicked
        button.addEventListener(
          'click',
          (e) => {
            e.preventDefault();
            popover = this.#buildPopup(cache[this.#href]);
            // popover.classList.toggle('active');

            // button.addEventListener('click', (e) => {
            //   e.preventDefault();
            //   popover.classList.toggle('active');
            // });
          },
          { once: true },
        );
      }
    });
  }
}

TermReference.register();

class SvelteTermRef extends TermReference {
  static register(tag = 's-ref') {
    if ('customElements' in window) {
      customElements.define(tag, SvelteTermRef);
    }
  }

  constructor() {
    super();
  }
}

SvelteTermRef.register();
