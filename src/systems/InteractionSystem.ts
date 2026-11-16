import Phaser from 'phaser';
import type { Vec2 } from '@/core/types';

export interface Interactable {
  id: string;
  rect: () => Phaser.Geom.Rectangle;
  label: () => string;
  enabled: () => boolean;
  run: () => Promise<void> | void;
  /** Prioridade (maior vence). O Weng que segue a Bella tem prioridade baixa. */
  priority?: number | (() => number);
  /** Ponto (mundo) onde o prompt aparece. */
  anchor: () => Vec2;
}

/**
 * Sistema universal de interação: qualquer coisa registrada aqui
 * (NPC, porta, objeto, item) responde ao botão de ação quando o
 * jogador está de frente e perto.
 */
export class InteractionSystem {
  private items: Interactable[] = [];

  constructor(_scene: Phaser.Scene) {}

  add(i: Interactable): void {
    this.items = this.items.filter((x) => x.id !== i.id);
    this.items.push(i);
  }

  remove(id: string): void {
    this.items = this.items.filter((x) => x.id !== id);
  }

  /** Alvo sob o ponto à frente do jogador; desempate pela distância aos pés. */
  find(probe: Vec2, feet: Vec2): Interactable | null {
    let best: Interactable | null = null;
    let bestD = Infinity;
    for (const it of this.items) {
      if (!it.enabled()) continue;
      const r = Phaser.Geom.Rectangle.Clone(it.rect());
      Phaser.Geom.Rectangle.Inflate(r, 3, 3);
      // olha do pé até o ponto à frente (personagens pequenos/perspectiva: o ponto pode passar por cima da área)
      let hit = false;
      for (const t of [1, 0.66, 0.33]) if (r.contains(feet.x + (probe.x - feet.x) * t, feet.y + (probe.y - feet.y) * t)) hit = true;
      if (!hit) continue;
      const d = Phaser.Math.Distance.Between(feet.x, feet.y, r.centerX, r.centerY) - (typeof it.priority === 'function' ? it.priority() : it.priority ?? 0) * 100;
      if (d < bestD) {
        best = it;
        bestD = d;
      }
    }
    return best;
  }
}
