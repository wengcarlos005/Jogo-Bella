import { h } from '@/utils/dom';
import { InputSystem } from '@/systems/InputSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { SettingsStore } from '@/systems/SaveSystem';
import { allPads, bindActive, saveCustomMap, setCalibrating, setDevice, glyph, type Bind, type PadAction, type PadMap } from '@/systems/Gamepad';

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
    let raf = 0;
    let padId = '';
    /** por controle: estado anterior (pra pegar só o APERTO, não o que já estava segurado) e o repouso dos eixos */
    const prevB = new Map<string, boolean[]>();
    const restA = new Map<string, number[]>();
    let holdUntilRelease: { id: string; bind: Bind } | null = null;
    const seen = h('div', { class: 'ps-seen' });
    box.insertBefore(seen, dots);

    const paint = () => {
      const [, sym, txt] = STEPS[step];
      big.textContent = sym;
      what.textContent = `Aperte ${txt}`;
      warn.textContent = '';
      dots.querySelectorAll('i').forEach((d, i) => (d.className = i < step ? 'ok' : i === step ? 'now' : ''));
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
      if (step >= STEPS.length) return finish(true);
      paint();
    };
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const pads = allPads();
      if (!pads.length) {
        warn.textContent = 'Nenhum controle encontrado. Aperte qualquer botão nele (o navegador só "vê" o controle depois do primeiro aperto).';
        return;
      }
      // esperando soltar o botão que acabou de ser gravado
      if (holdUntilRelease) {
        const p = pads.find((x) => x.id === holdUntilRelease!.id);
        if (!p || !bindActive(p, holdUntilRelease.bind)) holdUntilRelease = null;
        else return;
      }
      for (const pad of pads) {
        const b = pad.buttons.map((x) => x.pressed || x.value > 0.5);
        const pb = prevB.get(pad.id) ?? b.map(() => true); // 1º quadro: não conta nada como aperto
        prevB.set(pad.id, b);
        if (!restA.has(pad.id)) restA.set(pad.id, [...pad.axes]);
        const ra = restA.get(pad.id)!;
        let bind: Bind | null = null;
        const bi = b.findIndex((on, i) => on && !pb[i]);
        if (bi >= 0) bind = { b: bi };
        if (!bind) {
          const ai = pad.axes.findIndex((v, i) => Math.abs(v - (ra[i] ?? 0)) > 0.5);
          if (ai >= 0) {
            const v = pad.axes[ai];
            bind = { a: ai, v: Math.abs(v) >= 0.9 ? Math.sign(v) : Math.round(v * 1000) / 1000 };
          }
        }
        if (!bind) continue;
        // mostra o que chegou (ajuda a saber que o controle está sendo lido)
        seen.textContent = `Recebido: ${'b' in bind ? `botão ${bind.b}` : `eixo ${bind.a}`} · ${pad.id.slice(0, 40)}`;
        holdUntilRelease = { id: pad.id, bind };
        if (padId && pad.id !== padId) continue; // outro controle (ex.: o "fantasma"): ignora
        if (used(bind)) {
          warn.textContent = 'Esse botão já foi usado. Aperte outro.';
          continue;
        }
        padId = pad.id;
        next(bind);
        return;
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (!e.isTrusted) return;
      if (e.code === 'Escape') finish(false);
    };
    window.addEventListener('keydown', onKey, true);

    function finish(ok: boolean): void {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey, true);
      if (ok && padId && map.length) {
        saveCustomMap(padId, map);
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
