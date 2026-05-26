import { create } from "zustand";
import type { RollRequest } from "../types";
import { parseRollNotation } from "../utils/parser";
import { audioEngine } from "../utils/audioEngine";

export type DieType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";

export interface KeepRule {
  type: DieType;
  operation: "kh" | "kl";
  count: number;
}

export interface SingleRoll {
  type: DieType;
  value: number;
  dropped: boolean;
  isMax: boolean;
  isMin: boolean;
  globalIndex: number;
}

export interface RollRecord {
  id: string;
  timestamp: number;
  rolls: SingleRoll[];
  modifier: number;
  total: number;
}

interface DiceState {
  pool: Record<DieType, number>;
  modifier: number;
  isRolling: boolean;
  currentRolls: SingleRoll[];
  rollHistory: RollRecord[];
  activeRules: KeepRule[];

  updatePool: (type: DieType, delta: number) => void;
  rollDice: () => void;
  forceRoll: (request: RollRequest) => void;
  completeRoll: () => void;
}

const DIE_FACES: Record<DieType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
};

export const useDiceStore = create<DiceState>((set, get) => ({
  pool: { d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0 },
  modifier: 0,
  isRolling: false,
  currentRolls: [],
  rollHistory: [],
  activeRules: [],

  updatePool: (type, delta) => {
    const { isRolling, pool } = get();
    if (isRolling) return;

    const newCount = Math.max(0, pool[type] + delta);
    set({ pool: { ...pool, [type]: newCount } });
  },

  rollDice: () => {
    const { isRolling, pool, modifier, activeRules } = get();
    if (isRolling) return;

    audioEngine.initialize();
    audioEngine.resumeContext();

    const newRolls: SingleRoll[] = [];
    let globalIndex = 0;

    (Object.keys(pool) as DieType[]).forEach((type) => {
      const count = pool[type];
      if (count === 0) return;

      const randomBuffer = new Uint32Array(count);
      window.crypto.getRandomValues(randomBuffer);

      for (let i = 0; i < count; i++) {
        const value = (randomBuffer[i] % DIE_FACES[type]) + 1;
        newRolls.push({
          type,
          value,
          dropped: false,
          isMax: value === DIE_FACES[type],
          isMin: value === 1,
          globalIndex: globalIndex++,
        });
      }
    });

    activeRules?.forEach((rule) => {
      const targetDice = newRolls.filter((r) => r.type === rule.type);
      if (targetDice.length <= rule.count) return;

      const sorted = [...targetDice].sort((a, b) => a.value - b.value);

      const diceToDrop =
        rule.operation === "kh"
          ? sorted.slice(0, sorted.length - rule.count)
          : sorted.slice(rule.count);

      diceToDrop.forEach((die) => {
        const originalDie = newRolls.find(
          (r) => r.globalIndex === die.globalIndex,
        );
        if (originalDie) originalDie.dropped = true;
      });
    });

    let baseTotal = 0;
    newRolls.forEach((roll) => {
      if (!roll.dropped) baseTotal += roll.value;
    });

    if (newRolls.length === 0) return;

    const finalTotal = baseTotal + modifier;

    const record: RollRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      rolls: newRolls,
      modifier,
      total: finalTotal,
    };

    setTimeout(() => {
      if (get().isRolling) {
        set({ isRolling: false });
      }
    }, 5000);

    set((state) => ({
      isRolling: true,
      currentRolls: newRolls,
      rollHistory: [record, ...state.rollHistory],
      activeRules: [],
    }));
  },

  forceRoll: (request) => {
    const { isRolling } = get();
    if (isRolling) return;

    let targetPool: Partial<Record<DieType, number>> = {};
    let targetModifier = 0;
    let targetRules: KeepRule[] = [];

    if (typeof request === "string") {
      const parsed = parseRollNotation(request);
      targetPool = parsed.pool;
      targetModifier = parsed.modifier;
      targetRules = parsed.keepRules;
    }

    const newPool = {
      d4: 0,
      d6: 0,
      d8: 0,
      d10: 0,
      d12: 0,
      d20: 0,
      ...targetPool,
    };

    set({ pool: newPool, modifier: targetModifier, activeRules: targetRules });
    get().rollDice();
  },

  completeRoll: () => set({ isRolling: false }),
}));
