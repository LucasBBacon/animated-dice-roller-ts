import { create } from 'zustand';

export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

export interface SingleRoll {
  type: DieType;
  value: number;
  globalIndex: number;
}

export interface RollRecord {
  id: string;
  timestamp: number;
  rolls: SingleRoll[];
  total: number;
}

interface DiceState {
  pool: Record<DieType, number>;
  isRolling: boolean;
  currentRolls: SingleRoll[];
  rollHistory: RollRecord[];

  updatePool: (type: DieType, delta: number) => void;
  rollDice: () => void;
  completeRoll: () => void;
}

const DIE_FACES: Record<DieType, number> = {
  d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20
}

export const useDiceStore = create<DiceState>((set, get) => ({
  pool: { d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0 },
  isRolling: false,
  currentRolls: [],
  rollHistory: [],

  updatePool: (type, delta) => {
    const { isRolling, pool } = get();
    if (isRolling) return;

    const newCount = Math.max(0, pool[type] + delta);
    set({ pool: { ...pool, [type]: newCount }});
  },

  rollDice: () => {
    const { isRolling, pool } = get();
    if (isRolling) return;

    const newRolls: SingleRoll[] = [];
    let globalIndex = 0;
    
    (Object.keys(pool) as DieType[]).forEach((type) => {
      const count = pool[type];
      if (count === 0) return;

      const randomBuffer = new Uint32Array(count);
      window.crypto.getRandomValues(randomBuffer);

      for (let i = 0; i < count; i++) {
        newRolls.push({
          type,
          value: (randomBuffer[i] % DIE_FACES[type]) + 1,
          globalIndex: globalIndex++,
        });
      }
    });

    if (newRolls.length === 0) return;

    const record: RollRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      rolls: newRolls,
      total: newRolls.reduce((sum, val) => sum + val.value, 0),
    }

    setTimeout(() => {
      if (get().isRolling) {
        set({ isRolling: false });
      }
    }, 5000);

    set((state) => ({ isRolling: true, currentRolls: newRolls, rollHistory: [record, ...state.rollHistory] }));
  },

  completeRoll: () => set({ isRolling: false }),
}));