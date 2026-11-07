import { PERSONAL } from '../personal';

export interface SpeakerDef {
  name: string;
  /** Chave de textura do retrato (96x96). */
  portrait?: string;
}

/** Quem pode falar nos diálogos. */
export const SPEAKERS: Record<string, SpeakerDef> = {
  bella: { name: PERSONAL.bella.name, portrait: 'portrait-bella' },
  weng: { name: PERSONAL.weng.name, portrait: 'portrait-weng' },
  'mae-bella': { name: PERSONAL.bellaMom.name, portrait: 'portrait-mae-bella' },
  'pai-bella': { name: PERSONAL.bellaStepdad.name, portrait: 'portrait-pai-bella' }, // padrasto
  vizinha: { name: 'Dona Cida', portrait: 'portrait-vizinha' },
  atendente: { name: 'Atendente', portrait: 'portrait-atendente' },
  meli: { name: 'Meli' },
  gatinho: { name: 'Gatinho' },
  recepcionista: { name: 'Recepcionista' },
  pipoqueiro: { name: 'Pipoqueiro' },
  garcom: { name: 'Garçom', portrait: 'portrait-garcom' },
  'atendente-acai': { name: 'Atendente' },
  'atendente-cine': { name: 'Atendente da bomboniere' },
  lala: { name: 'Lala' },
  pombo: { name: 'Pombo' },
  'mae-tel': { name: 'Mãe (no celular)', portrait: 'portrait-mae-bella' },
  'vof-weng': { name: PERSONAL.wengGrandparents.avo, portrait: 'portrait-vof-weng' },
  'vom-weng': { name: PERSONAL.wengGrandparents.avoh, portrait: 'portrait-vom-weng' },
  kelly: { name: PERSONAL.bellaFamily.prima, portrait: 'portrait-kelly' },
  'tia-jaque': { name: `Tia ${PERSONAL.bellaFamily.tia}`, portrait: 'portrait-tia-jaque' },
  'avo-bella': { name: 'Vó', portrait: 'portrait-avo-bella' },
  narrador: { name: '' },
  celular: { name: 'Celular' },
};
