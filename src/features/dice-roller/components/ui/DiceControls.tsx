import type React from "react";
import { useDiceStore, type DieType } from "../../store/useDiceStore";

const DIE_TYPES: DieType[] = ["d4", "d6", "d8", "d10", "d12", "d20"];

export const DiceControls: React.FC = () => {
  // bind only to the required state slices
  const pool = useDiceStore((state) => state.pool);
  const isRolling = useDiceStore((state) => state.isRolling);
  const { updatePool, rollDice } = useDiceStore();

  const totalDiceInPool = Object.values(pool).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <div className="dice-controls">
      <div className="dice-count-stepper">
        {DIE_TYPES.map((type) => (
          <div key={type} className="dice-stepper">
            <button
              type="button"
              onClick={() => updatePool(type, -1)}
              disabled={isRolling || pool[type] === 0}
              aria-label={`Decrease ${type} count`}
              className="stepper-btn"
            >
              -
            </button>

            <span className="dice-count-display">
              {pool[type]} <span className="dice-label">{type}</span>
            </span>

            <button
              type="button"
              onClick={() => updatePool(type, 1)}
              disabled={isRolling}
              aria-label={`Increase ${type} count`}
              className="stepper-btn"
            >
              +
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={rollDice}
        disabled={isRolling || totalDiceInPool === 0}
        className={`roll-btn ${isRolling ? "rolling" : ""}`}
      >
        {isRolling ? "Rolling..." : "Roll Dice"}
      </button>
    </div>
  );
};
