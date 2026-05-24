import { create } from 'zustand';

export interface RollRecord {
  id: string;
  timestamp: number;
  values: number[];
  total: number;
}

interface DiceState {
  diceCount: number;
  isRolling: boolean;
  currentRolls: number[];
  rollHistory: RollRecord[];

  // Actions
  incrementDiceCount: () => void;
  decrementDiceCount: () => void;
  rollDice: () => void;
  completeRoll: () => void;
}

const MAX_DICE = 30; // Hard limit to prevent WebGL buffer overflow

export const useDiceStore = create<DiceState>((set, get) => ({
  diceCount: 1,
  isRolling: false,
  currentRolls: [],
  rollHistory: [],

  incrementDiceCount: () => {
    const { isRolling, diceCount } = get();
    if (isRolling || diceCount >= MAX_DICE) return;
    set({ diceCount: diceCount + 1 });
  },

  decrementDiceCount: () => {
    const { isRolling, diceCount } = get();
    if (isRolling || diceCount <= 1) return;
    set({ diceCount: diceCount - 1 });
  },

  rollDice: () => {
    const { isRolling, diceCount } = get();
    if (isRolling) return;

    // Use Web Crypto API for true RNG distribution
    const randomBuffer = new Uint32Array(diceCount);
    window.crypto.getRandomValues(randomBuffer);
    
    // Map the 32-bit integers to a 1-20 range
    const newRolls = Array.from(randomBuffer).map(num => (num % 20) + 1);
    const total = newRolls.reduce((sum, val) => sum + val, 0);

    const record: RollRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      values: newRolls,
      total,
    };

    setTimeout(() => {
      const { isRolling } = get();
      if (isRolling) {
        console.warn('Roll animation timed out or frame dropped. Force UI unlock.');
        set({ isRolling: false });
      }
    }, 5000);

    set((state) => ({
      isRolling: true,
      currentRolls: newRolls,
      // Prepend the new record so the most recent roll is at index 0
      rollHistory: [record, ...state.rollHistory],
    }));
  },

  completeRoll: () => {
    set({ isRolling: false });
  }
}));