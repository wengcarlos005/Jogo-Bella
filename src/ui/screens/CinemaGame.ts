import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';

/**
 * Minigame — Susto na Sala 3 (o filme de terror do 3º encontro).
 *
 * Na tela do cinema o corredor do filme apaga, aparecem dois olhos no escuro... e vem o susto.
 * Aperte NA HORA do susto pra segurar a pipoca e a mão da Bella:
 *  - cedo demais (ou num alarme falso: gatinho, luz piscando) = ela ri de você;
 *  - tarde demais = pipoca voando pra todo lado.
 * 8 cenas (5 sustos de verdade + 3 alarmes falsos), cada vez mais rápidas.
 *
 * Sprites: assets/minigames/cine-*.png (art-source/minigames/cinema-tela.webp e cinema-casal.webp).
 */
export interface CinemaResult {
  stars: number;
  /** quantas vezes errou (cedo, tarde ou alarme falso) */
  shh: number;
  late: number;
}

type Beat = { real: boolean; falso?: 'gato' | 'pisca' };
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export function playCinemaGame(parent: HTMLElement): Promise<CinemaResult> {
  return new Promise((resolve) => {
    const mg = (f: string) => new URL(`assets/minigames/cine-${f}.png`, document.baseURI).href;
    for (const f of ['corredor', 'escuro', 'olhos', 'susto', 'gato', 'pisca', 'calmo', 'pegou', 'pipoca', 'ri', 'abraco', 'balde']) new Image().src = mg(f);
    // 5 sustos + 3 alarmes falsos, embaralhados (o primeiro é sempre de verdade, pra aprender)
    const rest = ([{ real: true }, { real: true }, { real: true }, { real: true }, { real: false, falso: 'gato' }, { real: false, falso: 'pisca' }, { real: false, falso: 'gato' }] as Beat[]).sort(() => Math.random() - 0.5);
    const beats: Beat[] = [{ real: true }, ...rest];
    let idx = 0;
    let phase: 'idle' | 'tension' | 'scare' | 'falso' | 'between' | 'done' = 'idle';
    let scareAt = 0;
    let windowMs = 700;
    let perfect = 0;
    let mistakes = 0;
    let late = 0;
    const LIVES = 3;
    let lives = LIVES;
    let pressedThis = false;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

    const screenImg = h('img', { class: 'cs-screen', src: mg('corredor'), alt: '' }) as HTMLImageElement;
    const couple = h('img', { class: 'cs-couple', src: mg('calmo'), alt: '' }) as HTMLImageElement;
    const glow = h('div', { class: 'cs-glow' });
    const hearts = h('div', { class: 'cs-hearts' });
    const label = h('div', { class: 'cs-label' });
    // regras na tela antes de começar (o jogo fica claro de cara)
    const rules = h(
      'div',
      { class: 'cs-rules' },
      h('b', {}, 'Como jogar'),
      h('div', {}, h('img', { src: mg('susto'), alt: '' }), h('span', {}, 'Quando o MONSTRO aparecer na tela: aperte ', h('kbd', {}, 'PULAR!'), ' (ou espaço) na hora. Vocês pulam juntos e salvam a pipoca.')),
      h('div', {}, h('img', { src: mg('gato'), alt: '' }), h('span', {}, 'Gatinho ou luz piscando é alarme falso: ', h('u', {}, 'NÃO pule'), '.')),
      h('div', {}, h('img', { src: mg('olhos'), alt: '' }), h('span', {}, 'Os olhos no escuro avisam que ele vem... mas espere ele PULAR. Pulou cedo, tarde ou no alarme falso: perde 1 ♥ (são 3).')),
    );
    const coupleBox = h('div', { class: 'cs-couple-box' }, couple);
    const stage = h('div', { class: 'cs-stage' }, h('div', { class: 'cs-frame' }, screenImg), glow, h('div', { class: 'cs-seats' }), coupleBox, hearts, label, rules);
    const dots = h('div', { class: 'tr-dots cs-dots' }, ...beats.map(() => h('i')));
    const balde = h('div', { class: 'tr-lives cs-lives', title: 'Vidas' });
    const msg = h('div', { class: 'gp-bubble cs-msg' });
    const btn = h('button', { class: 'btn primary cs-btn' }, 'PULAR!');
    const startBtn = h('button', { class: 'btn primary' }, 'Começar o filme');
    const actions = h('div', { class: 'bg-actions' }, startBtn);
    const panel = h(
      'div',
      { class: 'bg-panel panel gp-panel cs-panel' },
      h('div', { class: 'bg-title cs-title' }, 'Susto na Sala 3'),
      h('div', { class: 'cs-top' }, dots, balde),
      stage,
      msg,
      actions,
    );
    const screen = h('div', { class: 'screen bg-screen cs-wrap' }, panel);
    parent.append(screen);
    InputSystem.push('minigame');
    InputSystem.releaseAll();

    const say = (t: string) => {
      msg.textContent = t;
      msg.classList.remove('pop');
      void msg.offsetWidth;
      msg.classList.add('pop');
    };
    const show = (f: string, cls = '') => {
      screenImg.src = mg(f);
      stage.dataset.scr = cls || f;
    };
    // altura de cada desenho do casal (px do recorte): todos ficam do mesmo tamanho e no mesmo lugar
    const COUPLE_H: Record<string, number> = { calmo: 251, pegou: 266, pipoca: 272, ri: 266, abraco: 258 };
    const setCouple = (f: string) => {
      couple.src = mg(f);
      couple.style.height = `${((COUPLE_H[f] ?? 260) / 272) * 100}%`;
    };
    const flashLabel = (t: string, good: boolean) => {
      label.textContent = t;
      label.className = `cs-label on ${good ? 'good' : 'bad'}`;
      later(900, () => (label.className = 'cs-label'));
    };
    const hud = () => {
      balde.replaceChildren(...Array.from({ length: LIVES }, (_, k) => h('i', { class: k < lives ? 'on' : '' }, '♥')));
    };
    const heart = () => {
      for (let k = 0; k < 6; k++) {
        const e = h('i', {}, '♥');
        e.style.left = `${44 + Math.random() * 12}%`;
        e.style.setProperty('--dx', `${(Math.random() - 0.5) * 70}px`);
        hearts.append(e);
        setTimeout(() => e.remove(), 1100);
      }
    };
    const mark = (ok: boolean) => dots.querySelectorAll('i')[idx]?.classList.add(ok ? 'ok' : 'bad');

    const nextBeat = () => {
      if (idx >= beats.length) return finish();
      const b = beats[idx];
      const speed = idx / (beats.length - 1); // 0 → 1
      windowMs = Math.round(700 - speed * 300);
      pressedThis = false;
      phase = 'tension';
      dots.querySelectorAll('i').forEach((d, k) => d.classList.toggle('now', k === idx));
      setCouple('calmo');
      show('corredor');
      say('Olho na tela... espera o MONSTRO aparecer pra apertar PULAR!');
      const t1 = 1100 + Math.random() * 900 - speed * 400;
      later(t1, () => {
        if (phase !== 'tension') return;
        show('escuro');
        AudioSystem.play('blip');
        const t2 = 700 + Math.random() * 1100 - speed * 300;
        later(t2, () => {
          if (phase !== 'tension') return;
          if (b.real) {
            show('olhos');
            say('Os olhos! Ele vai pular... prepara o dedo!');
            const t3 = 500 + Math.random() * 1300 - speed * 300;
            later(t3, () => {
              if (phase !== 'tension') return;
              phase = 'scare';
              scareAt = performance.now();
              show('susto', 'susto');
              AudioSystem.play('cancel');
              stage.classList.remove('bg-shake');
              void stage.offsetWidth;
              stage.classList.add('bg-shake');
              later(windowMs, () => {
                if (phase !== 'scare') return;
                // não apertou a tempo
                phase = 'between';
                mistakes++;
                late++;
                lives--;
                hud();
                mark(false);
                setCouple('pipoca');
                flashLabel('Tarde demais!', false);
                say(pick(['PIPOCA PRA TODO LADO! O cara da frente ganhou um chapéu de pipoca.', 'A Bella pulou, o balde voou e o Weng ficou cheio de pipoca no cabelo.', 'Moço de trás: "...obrigado pela pipoca."']));
                later(1700, advance);
              });
            });
          } else {
            phase = 'falso';
            show(b.falso!, b.falso);
            AudioSystem.play(b.falso === 'gato' ? 'pickup' : 'blip');
            later(1100, () => {
              if (phase !== 'falso') return;
              phase = 'between';
              mark(true);
              perfect++;
              flashLabel('Nem piscou!', true);
              say(b.falso === 'gato' ? 'Era só um gatinho. A Bella: "Own." O Weng: "...eu sabia."' : 'A luz piscou e... nada. O filme tá brincando com a gente.');
              later(1300, advance);
            });
          }
        });
      });
    };
    const advance = () => {
      if (lives <= 0) return lose();
      idx++;
      nextBeat();
    };
    const lose = () => {
      phase = 'done';
      show('susto', 'susto');
      setCouple('pipoca');
      AudioSystem.play('cancel');
      say('Sem vidas! A pipoca acabou no chão e a Bella não para de rir. Assistir de novo?');
      btn.remove();
      actions.replaceChildren(
        h(
          'button',
          {
            class: 'btn primary',
            onclick: () => {
              idx = 0;
              lives = LIVES;
              mistakes = 0;
              late = 0;
              perfect = 0;
              hud();
              dots.querySelectorAll('i').forEach((d) => d.classList.remove('ok', 'bad'));
              actions.replaceChildren(btn);
              phase = 'between';
              say('De novo! Olho na tela...');
              later(900, nextBeat);
            },
          },
          'Assistir de novo',
        ),
      );
    };

    const press = () => {
      if (phase === 'idle') return begin();
      if (pressedThis || phase === 'between' || phase === 'done') return;
      pressedThis = true;
      if (phase === 'scare') {
        const dt = performance.now() - scareAt;
        phase = 'between';
        perfect++;
        mark(true);
        setCouple('pegou');
        AudioSystem.play('quest');
        flashLabel(dt < windowMs * 0.45 ? 'PERFEITO!' : 'Segurou!', true);
        say(pick(['Pipoca salva! E a mão dela segurando a sua com força.', 'Ela pulou no seu braço. Você segurou o balde. Time perfeito.', 'O susto veio... e vocês nem derrubaram uma pipoca.']));
        later(700, () => {
          setCouple('abraco');
          heart();
        });
        later(1900, advance);
        return;
      }
      // cedo demais / alarme falso
      phase = 'between';
      mistakes++;
      lives--;
      hud();
      mark(false);
      setCouple('ri');
      AudioSystem.play('cancel');
      flashLabel('Cedo demais!', false);
      say(pick(['Bella: "HAHAHA você pulou do nada!"', 'Bella: "Era um GATINHO, Weng. Um gatinho."', 'Bella: "Medrosinho... vem cá, eu te protejo."']));
      later(1700, advance);
    };

    const finish = () => {
      phase = 'done';
      dots.querySelectorAll('i').forEach((d) => d.classList.remove('now'));
      show('corredor');
      setCouple(mistakes <= 2 ? 'abraco' : 'ri');
      const stars = Math.max(1, lives);
      AudioSystem.play('quest');
      say(stars === 3 ? 'As luzes acenderam. Pipoca quase inteira e os dois agarradinhos.' : late >= 3 ? 'Os créditos subiram. A sala inteira tava coberta de pipoca. A nossa.' : 'As luzes acenderam. A Bella ainda tá rindo do Weng.');
      btn.remove();
      actions.replaceChildren(
        h('div', { class: 'bg-stars' }, ...[0, 1, 2].map((k) => h('span', { class: k < stars ? 'on' : '', style: `animation-delay:${k * 0.25}s` }, '★'))),
        h('button', { class: 'btn primary', onclick: close }, 'Sair da sala ♥'),
      );
      const result = { stars, shh: mistakes, late };
      function close() {
        InputSystem.off('minigame:interact', close);
        cleanup();
        resolve(result);
      }
      InputSystem.once('minigame:interact', close);
    };

    const begin = () => {
      if (phase !== 'idle') return;
      startBtn.remove();
      rules.classList.add('off');
      actions.append(btn);
      say('Olho na tela... espera o MONSTRO aparecer pra apertar PULAR!');
      later(1200, nextBeat);
      phase = 'between';
    };
    startBtn.addEventListener('click', begin);
    btn.addEventListener('pointerdown', press);
    stage.addEventListener('pointerdown', press);
    const onKey = (e: KeyboardEvent) => {
      if (InputSystem.context !== 'minigame' || phase === 'done') return;
      if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') {
        e.preventDefault();
        if (!e.repeat) press();
      }
    };
    window.addEventListener('keydown', onKey);
    hud();
    say("Sala 3. Five Nights at Freddy's. A gente não tava com medo... mas os sustos, ah, os sustos.");

    function cleanup() {
      timers.forEach((t) => clearTimeout(t));
      window.removeEventListener('keydown', onKey);
      InputSystem.pop('minigame');
      screen.remove();
    }
  });
}
