import type React from "react";
import "./DiceControls.css";
import { useDiceStore, type DieType } from "../../store/useDiceStore";

const DIE_TYPES: DieType[] = ["d4", "d6", "d8", "d10", "d12", "d20"];

export const DiceControls: React.FC = () => {
  // bind only to the required state slices
  const pool = useDiceStore((state) => state.pool);
  const modifier = useDiceStore((state) => state.modifier);
  const isRolling = useDiceStore((state) => state.isRolling);
  const { updatePool, rollDice, clearPool } = useDiceStore();

  const totalDiceInPool = Object.values(pool).reduce(
    (sum, count) => sum + count,
    0,
  );

  const poolString =
    Object.entries(pool)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => `${count}${type}`)
      .join(" + ") +
    (modifier !== 0
      ? modifier > 0
        ? ` + ${modifier}`
        : ` - ${Math.abs(modifier)}`
      : "");

  return (
    <div className="dice-controls">
      <div className="active-pool-ribbon">
        <span className="pool-text">{poolString || "Empty Hand"}</span>
        {totalDiceInPool > 0 && (
          <button
            className="clear-pool-btn"
            onClick={clearPool}
            disabled={isRolling}
            aria-label="Clear Pool"
          >
            ✖
          </button>
        )}
      </div>

      <div className="dice-rack">
        {DIE_TYPES.map((type) => {
          const count = pool[type];
          return (
            <div key={type} className="die-rack-slot">
              <button
                type="button"
                className="add-die-btn"
                onClick={() => updatePool(type, 1)}
                disabled={isRolling}
                aria-label={`Decrease ${type} count`}
                title={`Add ${type}`}
              >
                <span className="die-label">{type.toUpperCase()}</span>
                {count > 0 && <span className="die-badge">{count}</span>}
              </button>

              <button
                type="button"
                className={`remove-die-btn ${count > 0 ? "visible" : ""}`}
                onClick={() => updatePool(type, -1)}
                disabled={isRolling || pool[type] === 0}
                aria-label={`Increase ${type} count`}
                title={`Remove ${type}`}
              >
                -
              </button>
            </div>
          );
        })}
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
