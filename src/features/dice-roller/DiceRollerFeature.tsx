import type React from "react";
import "./DiceRollerFeature.css";
import { DiceScene } from "./components/canvas/DiceScene";
import { RollHistory } from "./components/ui/RollHistory";
import { DiceControls } from "./components/ui/DiceControls";

export const DiceRollerFeature: React.FC = () => {
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
    )
}