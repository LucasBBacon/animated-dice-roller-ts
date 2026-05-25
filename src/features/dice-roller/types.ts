import type { DieType, RollRecord } from "./store/useDiceStore";

export type RollRequest = string | Partial<Record<DieType, number>>;

export interface DiceRollerAPI {
  triggerRoll: (request: RollRequest) => void;
  clearHistory: () => void;
}

export interface DiceRollerProps {
  onRollComplete?: (result: RollRecord) => void;
}
