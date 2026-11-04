import Phaser from 'phaser';

/**
 * Barramento global. Sistemas conversam por eventos, sem se conhecerem.
 *
 * Eventos principais:
 *  - 'flag:changed'      (key, value)
 *  - 'item:added'        (itemId, qty)
 *  - 'quest:started'     (questId)
 *  - 'quest:objective'   (questId, objectiveId)
 *  - 'quest:completed'   (questId)
 *  - 'memory:unlocked'   (memoryId)
 *  - 'state:changed'     ()
 *  - 'ui:modal'          (open: boolean)
 */
export const EventBus = new Phaser.Events.EventEmitter();
