import type React from "react";
import { useDiceStore } from "../../store/useDiceStore";

export const DiceControls: React.FC = () => {
  // bind only to the required state slices
  const diceCount = useDiceStore((state) => state.diceCount);
  const isRolling = useDiceStore((state) => state.isRolling);
  const { incrementDiceCount, decrementDiceCount, rollDice } = useDiceStore();

  return (
    <div className="dice-controls">
      <div className="dice-count-stepper">
        <button
          type="button"
          onClick={decrementDiceCount}
          disabled={isRolling || diceCount <= 1}
          aria-label="Decrease dice count"
          className="stepper-btn"
        >
          -
        </button>

        <span className="dice-count-display">
          {diceCount} <span className="dice-label">d20</span>
        </span>

        <button
          type="button"
          onClick={incrementDiceCount}
          disabled={isRolling || diceCount >= 20}
          aria-label="Increase dice count"
          className="stepper-btn"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={rollDice}
        disabled={isRolling}
        className={`roll-btn ${isRolling ? "rolling" : ""}`}
      >
        {isRolling ? "Rolling..." : "Roll Dice"}
      </button>
    </div>
  );
};
