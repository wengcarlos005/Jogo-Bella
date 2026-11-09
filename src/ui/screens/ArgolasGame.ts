import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { shell, type MiniResult } from './PetroGames';

/**
 * Minigame — Argolas (parque de diversões de Araruama, 1º de janeiro de 2024).
 *
 * O Weng quer ganhar uma pelúcia pra Bella. Uma garrafa da prateleira brilha: é o alvo. A mira
 * (a argola) corre de um lado pro outro sobre as garrafas; aperte Espaço / E / JOGAR quando ela
 * estiver em cima da garrafa que brilha. 8 argolas; 5 acertos ganham a pelúcia.
 * Pensado pra controle: 1 botão.
 */
/** Centro das 7 garrafas na barraca (em % da imagem da barraca). */
const BOTTLES = [33.7, 40.3, 47.4, 54.2, 60.8, 67.4, 74.0];
const BOTTLE_Y = 58;
const RINGS = 8;
const NEED = 5;
const mg = (f: string) => new URL(`assets/objects/${f}.png`, document.baseURI).href;

export function playArgolasGame(parent: HTMLElement): Promise<MiniResult & { prize: boolean }> {
  return new Promise((resolve) => {
    const ui = shell(parent, 'ag', 'Argolas');
    const marks = BOTTLES.map((x) => h('i', { class: 'ag-glow', style: `left:${x}%;top:${BOTTLE_Y}%` }));
    const aim = h('i', { class: 'ag-aim' });
    const booth = h('div', { class: 'ag-booth' }, h('img', { class: 'ag-img', src: mg('pq-argolas'), alt: '' }), ...marks, aim);
    const left = h('div', { class: 'ag-left' });
    const rules = h(
      'div',
      { class: 'cs-rules ag-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('span', { class: 'ag-ico' }), h('span', {}, 'Uma garrafa da prateleira vai brilhar: é o alvo.')),
      h('div', {}, h('span', { class: 'ag-ico' }), h('span', {}, 'A argola corre de um lado pro outro. Aperte ', h('kbd', {}, 'Espaço'), ' ou ', h('kbd', {}, 'E'), ' quando ela estiver em cima da garrafa que brilha.')),
      h('div', {}, h('span', { class: 'ag-ico' }), h('span', {}, `São ${RINGS} argolas. Acerte ${NEED} e o Weng ganha uma pelúcia pra Bella.`)),
    );
    ui.stage.append(booth, left, rules);

    let thrown = 0;
    let hits = 0;
    let target = 3;
    let phase: 'rules' | 'aim' | 'fly' | 'done' = 'rules';
    let t0 = 0;
    let raf = 0;
    let x = BOTTLES[0];

    const hud = () => {
      ui.hud.replaceChildren(h('span', {}, `Acertos: ${hits}/${NEED}`), h('span', {}, `Argolas: ${RINGS - thrown}`));
      left.replaceChildren(...Array.from({ length: RINGS - thrown }, () => h('i', { class: 'ag-ring' })));
    };
    const pickTarget = () => {
      let n = target;
      while (n === target) n = Math.floor(Math.random() * BOTTLES.length);
      target = n;
      marks.forEach((m, i) => m.classList.toggle('on', i === target));
    };
    const tick = (t: number) => {
      if (!t0) t0 = t;
      if (phase === 'aim') {
        // vai e volta sobre as garrafas, mais rápido a cada argola
        const speed = 0.55 + thrown * 0.09;
        const p = (((t - t0) / 1000) * speed) % 2;
        const f = p < 1 ? p : 2 - p;
        x = BOTTLES[0] - 4 + f * (BOTTLES[BOTTLES.length - 1] - BOTTLES[0] + 8);
        aim.style.left = `${x}%`;
      }
      raf = requestAnimationFrame(tick);
    };
    const throwRing = () => {
      if (phase !== 'aim') return;
      phase = 'fly';
      thrown++;
      const d = Math.abs(x - BOTTLES[target]);
      const hit = d < 2.6;
      aim.classList.add('fly');
      setTimeout(() => {
        aim.classList.remove('fly');
        if (hit) {
          hits++;
          AudioSystem.play('pickup');
          marks[target].classList.add('hit');
          setTimeout(() => marks[target].classList.remove('hit'), 600);
          ui.say('weng', hits >= NEED ? 'ACERTEI! A pelúcia é sua!' : ['Na mosca!', 'Viu? Técnica.', 'Mais uma!', 'Tô pegando o jeito!'][hits % 4]);
        } else {
          AudioSystem.play('cancel');
          ui.shake();
          ui.say('weng', d < 6 ? 'Bateu na boca da garrafa e pulou! Quase!' : ['Ela escorregou da minha mão.', 'O vento!', 'Essa foi de aquecimento.'][thrown % 3]);
        }
        hud();
        if (hits >= NEED || RINGS - thrown + hits < NEED || thrown >= RINGS) return finish();
        setTimeout(() => {
          pickTarget();
          phase = 'aim';
          t0 = 0;
        }, 700);
      }, 380);
    };
    const finish = () => {
      phase = 'done';
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      const prize = hits >= NEED;
      const stars = !prize ? 1 : thrown <= 6 ? 3 : 2;
      ui.say(prize ? 'bella' : 'weng', prize ? 'O ursinho laranja! Weng, ele é a sua cara. Vou dormir abraçada com ele.' : 'Faltou pouco... o moço ficou com dó e me deu um chaveirinho. Serve?');
      ui.end(stars, prize ? 'Pegar a pelúcia' : 'Aceitar o chaveirinho', () => resolve({ stars, mistakes: thrown - hits, prize }));
    };
    const start = () => {
      if (phase !== 'rules') return;
      rules.classList.add('off');
      ui.actions.replaceChildren(throwBtn);
      pickTarget();
      phase = 'aim';
      t0 = 0;
      ui.say('weng', 'Escolhe a pelúcia que eu ganho pra você. Qualquer uma.');
    };
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || e.repeat) return;
      if (e.code !== 'Space' && e.code !== 'KeyE' && e.code !== 'Enter') return;
      e.preventDefault();
      if (phase === 'rules') start();
      else throwRing();
    };
    const throwBtn = h('button', { class: 'btn primary ce-serve' }, 'JOGAR');
    throwBtn.addEventListener('click', throwRing);
    const startBtn = h('button', { class: 'btn primary' }, 'Comprar as argolas');
    startBtn.addEventListener('click', start);
    ui.actions.append(startBtn);
    window.addEventListener('keydown', onKey);
    hud();
    ui.say('bella', 'Weng, olha aquele ursinho laranja lá em cima...');
    raf = requestAnimationFrame(tick);
  });
}
