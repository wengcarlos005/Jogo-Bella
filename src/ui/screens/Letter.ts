import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { PERSONAL } from '@/data/personal';
import { textureURL } from '../textures';
import { assetURL } from '@/utils/asset';

/**
 * A carta do Weng, que abre o jogo (Novo jogo, antes do prólogo).
 * Um envelope com selo de coração aparece; Espaço abre. Cada Espaço revela o próximo
 * parágrafo; no fim, "Começar a nossa história". Funciona só no teclado (Espaço / E / Enter).
 */
/** Envelope desenhado (assets/ui/envelope.png); sem a arte, o envelope em CSS. */
export function envArt(): HTMLElement {
  const css = h('div', { class: 'lt-env-body' }, h('div', { class: 'lt-env-flap' }), h('b', { class: 'lt-seal' }, '♥'));
  const img = h('img', { class: 'lt-env-img', src: assetURL('assets/ui/envelope.png'), alt: '' }) as HTMLImageElement;
  const box = h('div', { class: 'lt-env-art' }, img);
  img.addEventListener('error', () => box.replaceChildren(css));
  return box;
}

export function playLetter(root: HTMLElement): Promise<void> {
  const paras = PERSONAL.letter.filter((p) => p.trim() && !p.trim().startsWith('['));
  if (!paras.length) return Promise.resolve();
  return new Promise((resolve) => {
    const stars = h('div', { class: 'end-stars' }, ...Array.from({ length: 40 }, (_, i) => h('i', { style: `left:${(i * 37) % 100}%;top:${(i * 53) % 100}%;animation-delay:${-(i % 9) * 0.4}s` })));
    const env = h(
      'div',
      { class: 'lt-env' },
      envArt(),
      h('div', { class: 'lt-env-to' }, 'Para a Bella'),
      h('div', { class: 'lt-env-hint' }, 'Aperte Espaço para abrir'),
    );
    const fb = textureURL('portrait-weng');
    const body = h('div', { class: 'lt-body' });
    const paper = h('div', { class: 'lt-paper off' }, body);
    const hint = h('div', { class: 'end-hint' }, 'Espaço ▸');
    const btn = h('button', { class: 'btn primary lt-go off' }, 'Continuar');
    const col = h('div', { class: 'lt-col' }, paper, btn);
    const screen = h('div', { class: 'screen opaque end-screen lt-screen' }, stars, env, col, hint);
    root.append(screen);
    InputSystem.push('chapter');
    InputSystem.releaseAll();

    let i = -1; // -1 = envelope fechado
    let done = false;
    // depois da carta: um bilhetinho pra ela aproveitar o jogo (com as teclas)
    let welcome = false;
    const showWelcome = () => {
      welcome = true;
      AudioSystem.play('pickup');
      paper.classList.add('off');
      btn.classList.add('off');
      setTimeout(() => {
        paper.classList.add('compact');
        body.replaceChildren(
          h('p', { class: 'hi' }, 'Antes de começar...'),
          ...PERSONAL.welcome.map((t) => h('p', {}, t)),
          h(
            'div',
            { class: 'lt-keys' },
            h('div', {}, h('kbd', {}, '← ↑ → ↓'), h('span', {}, 'andar (Shift corre)')),
            h('div', {}, h('kbd', {}, 'Espaço'), h('kbd', {}, 'E'), h('span', {}, 'conversar e interagir')),
            h('div', {}, h('kbd', {}, 'Esc'), h('span', {}, 'missões, mochila, álbum e mapa')),
            h('div', {}, h('b', {}, '🎬'), h('span', {}, 'em Cenas dá pra rever qualquer capítulo')),
          ),
          h('p', { class: 'ps' }, 'Bom jogo, meu amor. ♥'),
        );
        if (fb) body.append(h('div', { class: 'lt-sign' }, h('img', { src: fb, alt: '' }), h('span', {}, 'Weng')));
        paper.scrollTop = 0;
        paper.classList.remove('off');
        btn.textContent = 'Bora jogar!';
        btn.classList.remove('off');
      }, 650);
    };
    const finish = () => {
      if (done) return;
      if (!welcome) return showWelcome();
      done = true;
      window.removeEventListener('keydown', onKey, true);
      AudioSystem.play('confirm');
      screen.classList.add('out');
      setTimeout(() => {
        screen.remove();
        InputSystem.pop('chapter');
        resolve();
      }, 600);
    };
    const step = () => {
      if (i === -1) {
        i = 0;
        AudioSystem.play('pickup');
        env.classList.add('open');
        // envelope desenhado: troca pro quadro "aberto" (se a arte existir)
        const im = env.querySelector<HTMLImageElement>('.lt-env-img');
        if (im) {
          const open = new Image();
          open.onload = () => (im.src = open.src);
          open.src = assetURL('assets/ui/envelope-aberto.png');
        }
        setTimeout(() => {
          env.remove();
          paper.classList.remove('off');
          step();
        }, 900);
        return;
      }
      if (i < paras.length) {
        const last = i === paras.length - 1;
        const p = paras[i];
        const el = h('p', { class: i === 0 ? 'hi' : last ? 'ps' : '' }, p);
        body.append(el);
        el.scrollIntoView({ behavior: 'smooth', block: 'end' });
        AudioSystem.play('blip');
        i++;
        if (i === paras.length) {
          if (fb) body.append(h('div', { class: 'lt-sign' }, h('img', { src: fb, alt: '' }), h('span', {}, 'Weng')));
          hint.remove();
          btn.classList.remove('off');
          btn.classList.add('kb-focus');
        } else hint.classList.add('on');
        return;
      }
      finish();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.code !== 'KeyE' && e.code !== 'Enter') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.repeat || paper.classList.contains('off') !== (i === -1)) return;
      if (welcome) {
        // papel maior que a tela: Espaço desce até o fim antes de começar
        if (paper.scrollTop + paper.clientHeight < paper.scrollHeight - 8) {
          paper.scrollBy({ top: paper.clientHeight * 0.8, behavior: 'smooth' });
          return;
        }
        return finish();
      }
      step();
    };
    window.addEventListener('keydown', onKey, true);
    screen.addEventListener('click', (e) => {
      if (e.target === btn || welcome) return;
      if (i <= paras.length - 1) step();
    });
    btn.addEventListener('click', finish);
  });
}
