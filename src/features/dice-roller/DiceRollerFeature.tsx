import "./DiceRollerFeature.css";
import { DiceScene } from "./components/canvas/DiceScene";
import { RollHistory } from "./components/ui/RollHistory";
import { DiceControls } from "./components/ui/DiceControls";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { DiceRollerAPI, DiceRollerProps } from "./types";
import { useDiceStore } from "./store/useDiceStore";

export const DiceRollerFeature = forwardRef<DiceRollerAPI, DiceRollerProps>(
  ({ onRollComplete }, ref) => {
    const forceRoll = useDiceStore((state) => state.forceRoll);
    const isRolling = useDiceStore((state) => state.isRolling);
    const rollHistory = useDiceStore((state) => state.rollHistory);

    const wasRolling = useRef(isRolling);

    useImperativeHandle(ref, () => ({
      triggerRoll: (request) => forceRoll(request),
      clearHistory: () => useDiceStore.setState({ rollHistory: [] }),
    }));

    useEffect(() => {
      if (wasRolling.current && !isRolling && rollHistory.length > 0) {
        onRollComplete?.(rollHistory[0]);
      }

      wasRolling.current = isRolling;
    }, [isRolling, rollHistory, onRollComplete]);

    return (
      <div className="dice-roller-module">
        <div className="canvas-layer">
          <DiceScene />
        </div>

        <div className="ui-layer">
          <div className="ui-header">
            <RollHistory />
          </div>
          <div className="ui-footer">
            <DiceControls />
          </div>
        </div>
      </div>
    );
  },
);
