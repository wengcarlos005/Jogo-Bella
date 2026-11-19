import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { textureURL } from '../textures';

/**
 * Minigames de Petrópolis (sprites em assets/minigames):
 *  - Formas nas Nuvens (piquenique no Quitandinha): ache a nuvem pedida entre as que passam no céu.
 *  - Corrida de Pedalinho (lago do Quitandinha): o casal pedala sozinho; você só desvia com ← →.
 *  - Café da manhã (varanda do hotel): o Weng monta a bandeja de memória.
 */
export interface MiniResult {
  stars: number;
  mistakes: number;
}

const mg = (f: string) => new URL(`assets/minigames/${f}.png`, document.baseURI).href;
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/** Moldura comum: título, área de jogo, fala com retrato e botões. */
export function shell(parent: HTMLElement, cls: string, title: string) {
  const stage = h('div', { class: `pg-stage ${cls}-stage` });
  const hud = h('div', { class: 'pg-hud' });
  const face = h('img', { class: 'pg-face', alt: '' }) as HTMLImageElement;
  const msg = h('div', { class: 'gp-bubble pg-msg' });
  const actions = h('div', { class: 'bg-actions' });
  const panel = h('div', { class: `bg-panel panel gp-panel pg-panel ${cls}-panel` }, h('div', { class: `bg-title pg-title ${cls}-title` }, title), hud, stage, h('div', { class: 'pg-talk' }, face, msg), actions);
  const screen = h('div', { class: 'screen bg-screen pg-screen' }, panel);
  parent.append(screen);
  InputSystem.push('minigame');
  InputSystem.releaseAll();
  const say = (who: string, t: string) => {
    const url = textureURL(`portrait-${who}`);
    if (url) face.src = url;
    msg.textContent = t;
    msg.classList.remove('pop');
    void msg.offsetWidth;
    msg.classList.add('pop');
  };
  const shake = () => {
    stage.classList.remove('bg-shake');
    void stage.offsetWidth;
    stage.classList.add('bg-shake');
  };
  const end = (stars: number, label: string, done: () => void) => {
    AudioSystem.play('quest');
    actions.replaceChildren(
      h('div', { class: 'bg-stars' }, ...[0, 1, 2].map((k) => h('span', { class: k < stars ? 'on' : '', style: `animation-delay:${k * 0.25}s` }, '★'))),
      h('button', { class: 'btn primary', onclick: close }, label),
    );
    function close() {
      // com o cursor do teclado em "Jogar de novo", o Espaço é dele (não fecha o jogo por baixo)
      const replay = actions.querySelector('.mg-replay.kb-sel') as HTMLButtonElement | null;
      if (replay && !replay.dataset.fired) {
        replay.dataset.fired = '1';
        replay.click();
        return;
      }
      InputSystem.off('minigame:interact', close);
      InputSystem.pop('minigame');
      screen.remove();
      done();
    }
    InputSystem.once('minigame:interact', close);
  };
  return { stage, hud, actions, say, shake, end, screen };
}

// ====================================================================== Formas nas Nuvens
const CLOUDS = [
  { id: 'gato', name: 'gato', line: 'É a Meli! Olha o rabinho!' },
  { id: 'burger', name: 'hambúrguer', line: 'Você só pensa em comida. (Eu também.)' },
  { id: 'coracao', name: 'coração', line: 'Um coração. Meio torto. Igual o nosso primeiro beijo na chuva.' },
  { id: 'cisne', name: 'cisne', line: 'O nosso pedalinho subiu pro céu!' },
  { id: 'dragao', name: 'dragão', line: 'Um dragão! Ele tá cuidando do castelo.' },
  { id: 'bolo', name: 'bolo de aniversário', line: 'Até o céu sabe que amanhã é seu aniversário.' },
];

export function playCloudGame(parent: HTMLElement): Promise<MiniResult> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'nv', 'Formas nas Nuvens');
    const sky = textureURL('cena-pt-ceu');
    const layer = h('div', { class: 'nv-sky' });
    const badge = h('div', { class: 'nv-target off' });
    const rules = h(
      'div',
      { class: 'cs-rules nv-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('img', { src: mg('nv-dragao'), alt: '' }), h('span', {}, 'Lá em cima aparece qual forma procurar: ', h('kbd', {}, 'Procure: DRAGÃO'), '. As nuvens vão passando devagar pelo céu.')),
      h('div', {}, h('img', { src: mg('nv-gato'), alt: '' }), h('span', {}, 'Clique na nuvem certa. Ou escolha com ', h('kbd', {}, '←'), ' ', h('kbd', {}, '→'), ' e confirme com ', h('kbd', {}, 'Espaço'), '.')),
      h('div', {}, h('img', { src: mg('nv-coracao'), alt: '' }), h('span', {}, 'Nuvem errada ou deixar a certa ', h('u', {}, 'passar e sumir'), ' custa 1 ♥. São 3 corações e 6 nuvens.')),
    );
    ui.stage.append(sky ? h('img', { class: 'nv-bg', src: sky, alt: '' }) : h('div'), layer, h('img', { class: 'nv-couple', src: mg('nv-deitados'), alt: '' }), h('div', { class: 'nv-grass' }), rules);
    const order = [...CLOUDS].sort(() => Math.random() - 0.5);
    const ROUNDS = 6;
    let round = 0;
    let mistakes = 0;
    let lives = 3;
    let raf = 0;
    let last = 0;
    let target = '';
    let lock = true;
    let sel = -1;
    let over = false;
    const live: { el: HTMLElement; id: string; x: number; v: number }[] = [];

    const hud = () =>
      ui.hud.replaceChildren(
        h(
          'div',
          { class: 'so-sb' },
          h('div', { class: 'so-sb-chip' }, h('span', {}, 'Nuvem'), h('b', { class: 'so-sb-n' }, `${Math.min(round + 1, ROUNDS)}/${ROUNDS}`)),
          badge.classList.contains('off') ? h('span') : h('div', { class: 'so-sb-chip' }, badge),
          h('div', { class: 'so-sb-chip' }, h('span', {}, 'Vidas'), h('span', { class: 'tp-sb-lives' }, ...[0, 1, 2].map((k) => h('i', { class: k < lives ? 'on' : '' }, '♥')))),
        ),
      );
    const visible = () => live.filter((c) => c.x > -8 && c.x < 102).sort((p, q) => p.x - q.x);
    const paintSel = () => live.forEach((c, i) => c.el.classList.toggle('sel', i === sel));
    const spawnSet = () => {
      layer.replaceChildren();
      live.length = 0;
      sel = -1;
      // a nuvem certa + 3 outras, em alturas diferentes, entrando uma de cada vez pela esquerda
      const others = CLOUDS.filter((c) => c.id !== target).sort(() => Math.random() - 0.5).slice(0, 3);
      const set = [CLOUDS.find((c) => c.id === target)!, ...others].sort(() => Math.random() - 0.5);
      const v = 8 + round * 1.3;
      set.forEach((c, i) => {
        const el = h('img', { class: 'nv-cloud', src: mg(`nv-${c.id}`), alt: c.name, style: `top:${3 + i * 12}%;left:-30%` }) as HTMLImageElement;
        el.addEventListener('pointerdown', () => tap(live.findIndex((o) => o.el === el)));
        layer.append(el);
        live.push({ el, id: c.id, x: -14 - i * 19, v: v + Math.random() * 2 });
      });
    };
    const next = () => {
      if (over) return;
      if (round >= ROUNDS) return finish();
      target = order[round % order.length].id;
      const name = CLOUDS.find((c) => c.id === target)!.name;
      lock = false;
      badge.replaceChildren('Procure: ', h('b', {}, name.toUpperCase()));
      badge.classList.remove('off', 'pop');
      hud();
      void badge.offsetWidth;
      badge.classList.add('pop');
      ui.say(round % 2 ? 'weng' : 'bella', `${round % 2 ? 'E aquela ali...' : 'Olha!'} Acha a nuvem de ${name}!`);
      spawnSet();
    };
    const loseLife = (line: string) => {
      lives--;
      mistakes++;
      AudioSystem.play('cancel');
      ui.shake();
      ui.say('weng', line);
      hud();
      if (lives <= 0) {
        over = true;
        lock = true;
        setTimeout(() => finish(), 900);
        return true;
      }
      return false;
    };
    const tap = (i: number) => {
      if (lock || i < 0) return;
      const c = live[i];
      if (c.id !== target) {
        c.el.classList.add('wrong');
        setTimeout(() => c.el.classList.remove('wrong'), 400);
        loseLife(pick(['Isso aí é uma batata. Uma batata nuvem.', 'Hmm... não. Olha de novo.', 'Você tá vendo coisa, hein?']));
        return;
      }
      lock = true;
      AudioSystem.play('pickup');
      c.el.classList.add('found');
      ui.say('bella', CLOUDS.find((x) => x.id === c.id)!.line);
      round++;
      setTimeout(next, 1700);
    };
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      for (const c of live) {
        c.x += c.v * dt;
        c.el.style.left = `${c.x}%`;
      }
      if (!lock) {
        // a certa passou e sumiu
        const tg = live.find((c) => c.id === target);
        if (tg && tg.x > 108) {
          lock = true;
          round++;
          if (!loseLife('Ih, ela passou! Foi embora com o vento...')) setTimeout(next, 1400);
        }
        // seleção pelo teclado/controle: já começa marcando a primeira nuvem que aparece (E confirma);
        // se a nuvem escolhida saiu, pula pra próxima visível
        if (sel < 0 && visible().length) {
          sel = live.indexOf(visible()[0]);
          paintSel();
        } else if (sel >= 0 && live[sel].x > 102) {
          const vs = visible();
          sel = vs.length ? live.indexOf(vs[vs.length - 1]) : -1;
          paintSel();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || e.repeat || lock) return;
      const vs = visible();
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'KeyA' || e.code === 'KeyD') {
        if (!vs.length) return;
        const d = e.code === 'ArrowLeft' || e.code === 'KeyA' ? -1 : 1;
        const cur = sel >= 0 ? vs.indexOf(live[sel]) : -1;
        const ni = cur < 0 ? (d > 0 ? 0 : vs.length - 1) : Math.max(0, Math.min(vs.length - 1, cur + d));
        sel = live.indexOf(vs[ni]);
        paintSel();
        AudioSystem.play('blip');
      } else if ((e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') && sel >= 0) tap(sel);
      else return;
      e.preventDefault();
    };
    const finish = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      layer.replaceChildren();
      badge.classList.add('off');
      const won = lives > 0;
      const stars = !won ? 1 : lives === 3 ? 3 : lives === 2 ? 2 : 1;
      const cp = ui.stage.querySelector('.nv-couple') as HTMLImageElement;
      cp.src = mg('nv-sentados');
      cp.classList.add('sit');
      ui.say('bella', won ? 'Eu queria parar o tempo aqui. Nessa toalha, com você.' : 'O vento ganhou de nós hoje... mas essa toalha, com você, já é o melhor céu.');
      ui.end(stars, 'Ficar mais um pouquinho', () => resolve({ stars, mistakes }));
    };
    const startBtn = h('button', { class: 'btn primary' }, 'Olhar pro céu');
    const start = () => {
      if (!lock || over || round) return;
      startBtn.remove();
      rules.classList.add('off');
      next();
    };
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    InputSystem.once('minigame:interact', start);
    window.addEventListener('keydown', onKey);
    hud();
    raf = requestAnimationFrame(tick);
    ui.say('bella', 'Deitados na toalha, olhando pro céu... Bora brincar de achar formas nas nuvens?');
  });
}

// Corrida de Pedalinho: veja BoatKart.ts (estilo kart, o cisne rosa corre junto)
export { playBoatGame } from './BoatKart';

// ====================================================================== Café da manhã
const CAFE = [
  { id: 'paodequeijo', name: 'Pão de queijo', love: true },
  { id: 'bolo', name: 'Bolo de fubá', love: true },
  { id: 'cafe', name: 'Café com leite', love: true },
  { id: 'geleia', name: 'Geleia de morango', love: true },
  { id: 'frutas', name: 'Salada de frutas', love: true },
  { id: 'suco', name: 'Suco de laranja', love: false },
  { id: 'ovos', name: 'Ovos mexidos', love: false },
  { id: 'mamao', name: 'Mamão', love: false },
  { id: 'croissant', name: 'Croissant', love: false },
];
const EXTRA = [
  { id: 'hortensia', name: 'Hortênsia azul' },
  { id: 'cartao', name: 'Cartãozinho' },
];

export function playBreakfastGame(parent: HTMLElement): Promise<MiniResult> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'cf', 'Café da manhã de aniversário');
    const loves = CAFE.filter((c) => c.love);
    const tray: string[] = [];
    let mistakes = 0;
    let phase: 'memo' | 'pick' | 'done' = 'memo';
    const trayEl = h('div', { class: 'cf-tray' }, h('img', { class: 'cf-tray-bg', src: mg('cf-bandeja'), alt: '' }), h('div', { class: 'cf-tray-items' }));
    const note = h('div', { class: 'cf-note' }, h('b', {}, 'O que a Bella ama:'), ...loves.map((c) => h('div', {}, h('img', { src: mg(`cf-${c.id}`), alt: '' }), c.name)));
    const shelf = h(
      'div',
      { class: 'cf-shelf' },
      ...[...CAFE, ...EXTRA].sort(() => Math.random() - 0.5).map((c) => {
        const b = h('button', { class: 'cf-item', title: c.name, 'data-nav': '' }, h('img', { src: mg(`cf-${c.id}`), alt: '' }), h('span', {}, c.name)) as HTMLButtonElement;
        b.addEventListener('click', () => add(c.id, b));
        return b;
      }),
    );
    const room = h('div', { class: 'cf-room', style: `background-image:url(${new URL('assets/maps/pt-quarto-bg.png', document.baseURI).href})` });
    ui.stage.append(room, note, shelf, trayEl);
    const hud = () =>
      ui.hud.replaceChildren(
        h(
          'div',
          { class: 'so-sb' },
          phase === 'memo'
            ? h('div', { class: 'so-sb-chip' }, h('span', {}, 'Decore a lista!'))
            : h('div', { class: 'so-sb-chip' }, h('span', {}, 'Bandeja'), h('b', { class: 'so-sb-n' }, `${tray.length}/${loves.length}`)),
          h('div', { class: 'so-sb-chip' }, h('span', {}, 'Erros'), h('b', { class: 'so-sb-n' }, String(mistakes))),
        ),
      );
    const renderTray = () =>
      (trayEl.querySelector('.cf-tray-items') as HTMLElement).replaceChildren(...tray.map((id) => h('img', { src: mg(`cf-${id}`), alt: '' })));
    const add = (id: string, b: HTMLButtonElement) => {
      if (phase !== 'pick' || tray.includes(id)) return;
      const c = CAFE.find((x) => x.id === id);
      if (c && !c.love) {
        mistakes++;
        AudioSystem.play('cancel');
        ui.shake();
        ui.say('weng', id === 'mamao' ? '(Mamão não! Ela odeia mamão. Foco, Weng.)' : `(${c.name}? Hmm... não tava na lista.)`);
        hud();
        return;
      }
      tray.push(id);
      b.classList.add('taken');
      AudioSystem.play('pickup');
      renderTray();
      hud();
      if (!c) ui.say('weng', id === 'hortensia' ? '(Uma hortênsia azul. A cidade das hortênsias.)' : '(E um cartãozinho escrito "feliz aniversário, meu amor".)');
      if (loves.every((l) => tray.includes(l.id))) serve();
    };
    const serve = () => {
      phase = 'done';
      const extras = EXTRA.filter((e) => tray.includes(e.id)).length;
      const stars = Math.max(1, Math.min(3, (mistakes === 0 ? 2 : mistakes <= 2 ? 1 : 0) + (extras > 0 ? 1 : 0)));
      ui.say('bella', extras ? 'Café na cama, flor E cartãozinho?! Weng... eu vou chorar no pão de queijo.' : 'Tudo que eu amo, numa bandeja. Você decorou mesmo, né?');
      ui.end(stars, 'Tomar café', () => resolve({ stars, mistakes }));
    };
    ui.say('weng', '(Ela ainda tá dormindo. Café na cama: tudo que ela ama. Decora a lista!)');
    hud();
    const go = h('button', { class: 'btn primary', 'data-nav': '', 'data-nav-default': '' }, 'Decorei!');
    // enquanto decora, a prateleira não entra no cursor do teclado
    shelf.setAttribute('data-nav-off', '');
    ui.actions.append(go);
    const startPick = () => {
      if (phase !== 'memo') return;
      phase = 'pick';
      note.classList.add('hide');
      shelf.classList.add('on');
      shelf.removeAttribute('data-nav-off');
      go.remove();
      ui.say('weng', '(Agora monta a bandeja. E se quiser, um mimo a mais...)');
      hud();
    };
    go.addEventListener('click', startPick);
    setTimeout(startPick, 6000);
  });
}
