import { h } from '@/utils/dom';
import { MemoryAlbumSystem } from '@/systems/MemoryAlbumSystem';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { dateOrPlaceholder } from '@/data/personal';
import { textureURL } from '../textures';

/** Tela "Nova lembrança no álbum!" — resolve quando o jogador fecha. */
export function showMemoryPopup(parent: HTMLElement, id: string): Promise<void> {
  const def = MemoryAlbumSystem.get(id);
  if (!def) return Promise.resolve();
  AudioSystem.play('memory');
  const url = textureURL(def.image);
  return new Promise((resolve) => {
    const close = () => {
      InputSystem.off('memory:interact', close);
      InputSystem.pop('memory');
      screen.remove();
      resolve();
    };
    const screen = h(
      'div',
      { class: 'screen' },
      h(
        'div',
        { class: 'memory-pop panel-dark' },
        h('div', { class: 'kicker' }, '♥ Nova lembrança no álbum ♥'),
        h('div', { class: 't' }, def.title),
        h('div', { class: 'img' }, url ? h('img', { src: url, alt: '' }) : h('span', { class: 'mp-soon' }, 'foto em breve')),
        h('p', {}, def.text),
        h('p', { class: 'muted', style: 'opacity:.7;font-size:.85em' }, `${def.year} · ${dateOrPlaceholder(def.date ?? '')}`),
        h('button', { class: 'btn primary', onclick: close }, 'Guardar no álbum'),
      ),
    );
    parent.append(screen);
    InputSystem.push('memory');
    setTimeout(() => InputSystem.on('memory:interact', close), 400);
  });
}
