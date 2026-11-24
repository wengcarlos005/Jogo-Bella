import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { SettingsStore } from '@/systems/SaveSystem';
import { currentPad, saveCustomMap, setCalibrating, setDevice, glyph, type Bind, type PadAction, type PadMap } from '@/systems/Gamepad';

/**
 * Configurar controle: cada fabricante numera os botões de um jeito (controles "estilo PS5" genéricos,
 * com SELECT / MODE / START, chegam fora de ordem). Aqui o jogo pede um botão de cada vez e grava.
 * Abre sozinho quando um controle desconhecido conecta, e fica em Opções › Configurar controle.
 * Direcional de eixo (o "chapéu" dos controles genéricos, ou com MODE ligado) também vale.
 */
/** Um botão por vez, pelo NOME que está escrito no controle dela (A B X Y ou ✕ ◯ □ △). */
const steps = (): [PadAction, string, string][] => [
  ['confirm', glyph('confirm'), `o ${glyph('confirm')} (confirmar / conversar)`],
  ['back', glyph('back'), `o ${glyph('back')} (voltar)`],
  ['run', glyph('run'), `o ${glyph('run')} (correr)`],
  ['bag', glyph('bag'), `o ${glyph('bag')} (mochila)`],
  ['menu', glyph('menu'), `o ${glyph('menu')} (menu)`],
  ['album', glyph('album'), `o ${glyph('album')} (álbum)`],
  ['tabPrev', 'L1', 'o L1 (aba anterior no menu)'],
  ['tabNext', 'R1', 'o R1 (próxima aba no menu)'],
  ['run', 'R2', 'o R2 (também corre)'],
  ['up', '↑', 'CIMA no direcional'],
  ['down', '↓', 'BAIXO no direcional'],
  ['left', '←', 'ESQUERDA no direcional'],
  ['right', '→', 'DIREITA no direcional'],
];

let open = false;

export function openPadSetup(root: HTMLElement): Promise<boolean> {
  if (open) return Promise.resolve(false);
  open = true;
  const STEPS = steps();
  return new Promise((resolve) => {
    const big = h('div', { class: 'ps-big' });
    const what = h('div', { class: 'ps-what' });
    const warn = h('div', { class: 'ps-warn' });
    const dots = h('div', { class: 'ps-dots' }, ...STEPS.map(() => h('i')));
    const skipBtn = h('button', { class: 'btn small', onclick: () => next(null) }, 'Pular este');
    const cancelBtn = h('button', { class: 'btn small', onclick: () => finish(false) }, 'Cancelar');
    const box = h(
      'div',
      { class: 'ps-box panel' },
      h('div', { class: 'ps-title' }, 'Configurar controle'),
      h('div', { class: 'ps-sub' }, 'Cada controle numera os botões de um jeito. Aperte o botão que o jogo pedir.'),
      big,
      what,
      warn,
      dots,
      h('div', { class: 'ps-btns' }, skipBtn, cancelBtn),
    );
    const screen = h('div', { class: 'screen ps-screen no-swap' }, box);
    root.append(screen);
    InputSystem.push('padsetup');
    InputSystem.releaseAll();
    setCalibrating(true);

    const map: PadMap = [];
    let step = 0;
    let waitRelease = true; // começa esperando soltar tudo (o botão que abriu esta tela)
    let base: { b: boolean[]; a: number[] } | null = null;
    let rest: { b: boolean[]; a: number[] } | null = null;
    let raf = 0;

    const paint = () => {
      const [, sym, txt] = STEPS[step];
      big.textContent = sym;
      what.textContent = `Aperte ${txt}`;
      warn.textContent = '';
      dots.querySelectorAll('i').forEach((d, i) => d.className = i < step ? 'ok' : i === step ? 'now' : '');
      big.classList.remove('pop');
      void big.offsetWidth;
      big.classList.add('pop');
    };
    const used = (b: Bind) => map.some(([, x]) => ('b' in x && 'b' in b && x.b === b.b) || ('a' in x && 'a' in b && x.a === b.a && Math.abs(x.v - b.v) < 0.12));
    const next = (b: Bind | null) => {
      if (b) {
        map.push([STEPS[step][0], b]);
        AudioSystem.play('confirm');
      } else AudioSystem.play('blip');
      step++;
      waitRelease = true;
      base = null;
      if (step >= STEPS.length) return finish(true);
      paint();
    };
    const snapshot = (pad: Gamepad) => ({ b: pad.buttons.map((x) => x.pressed || x.value > 0.5), a: [...pad.axes] });
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const pad = currentPad();
      if (!pad) {
        warn.textContent = 'Nenhum controle conectado. Aperte qualquer botão nele.';
        return;
      }
      const snap = snapshot(pad);
      // "em repouso": lido uma vez, no primeiro instante sem nenhum botão apertado
      if (!rest) {
        if (!snap.b.some(Boolean)) rest = snap;
        return;
      }
      base = rest;
      const still = !snap.b.some(Boolean) && snap.a.every((v, i) => Math.abs(v - (rest?.a[i] ?? 0)) < 0.25);
      if (waitRelease) {
        // só pede o próximo depois de soltar tudo (botão e direcional de volta ao repouso)
        if (still) waitRelease = false;
        return;
      }
      // botão novo?
      const bi = snap.b.findIndex((on, i) => on && !base?.b[i]);
      let bind: Bind | null = bi >= 0 ? { b: bi } : null;
      // eixo que se mexeu? (direcional de eixo, gatilho ou analógico)
      if (!bind) {
        const ai = snap.a.findIndex((v, i) => Math.abs(v - (base?.a[i] ?? 0)) > 0.5);
        if (ai >= 0) {
          const v = snap.a[ai];
          bind = { a: ai, v: Math.abs(v) >= 0.9 ? Math.sign(v) : Math.round(v * 1000) / 1000 };
        }
      }
      if (!bind) return;
      if (used(bind)) {
        warn.textContent = 'Esse botão já foi usado. Aperte outro.';
        waitRelease = true;
        return;
      }
      next(bind);
    };
    const onKey = (e: KeyboardEvent) => {
      if (!e.isTrusted) return;
      if (e.code === 'Escape') finish(false);
    };
    window.addEventListener('keydown', onKey, true);

    function finish(ok: boolean): void {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey, true);
      const pad = currentPad();
      if (ok && pad && map.length) {
        saveCustomMap(pad.id, map);
        SettingsStore.data.device = 'controle';
        SettingsStore.save();
        setDevice('controle');
        AudioSystem.play('quest');
      }
      setCalibrating(false);
      screen.classList.add('out');
      setTimeout(() => {
        screen.remove();
        InputSystem.pop('padsetup');
        open = false;
        resolve(ok);
      }, 300);
    }
    paint();
    raf = requestAnimationFrame(tick);
  });
}
