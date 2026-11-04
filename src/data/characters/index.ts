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
  'pai-bella': { name: PERSONAL.bellaDad.name, portrait: 'portrait-pai-bella' },
  vizinha: { name: 'Dona Cida', portrait: 'portrait-vizinha' },
  narrador: { name: '' },
  celular: { name: 'Celular' },
};
