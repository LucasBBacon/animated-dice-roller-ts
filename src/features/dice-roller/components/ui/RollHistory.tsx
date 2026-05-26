import type React from "react";
import { useDiceStore, type SingleRoll } from "../../store/useDiceStore";

export const RollHistory: React.FC = () => {
  const rollHistory = useDiceStore((state) => state.rollHistory);
  const isRolling = useDiceStore((state) => state.isRolling);

  if (rollHistory.length === 0) return null;

  return (
    <div className="roll-history">
      <h3 className="history-title">History</h3>
      <ul className="history-list">
        {rollHistory.map((record, index) => {
          // if a roll is active, 0 index is one on canvas
          const isCurrentRoll = index === 0 && isRolling;

          const groupedRolls = record.rolls.reduce(
            (acc, roll) => {
              if (!acc[roll.type]) acc[roll.type] = [];
              acc[roll.type].push(roll);
              return acc;
            },
            {} as Record<string, SingleRoll[]>,
          );

          return (
            <li
              key={record.id}
              className={`history-item ${isCurrentRoll ? "pending" : ""}`}
            >
              <div className="history-meta">
                <span className="history-time">
                  {new Date(record.timestamp).toLocaleTimeString([], {
                    hour12: false,
                  })}
                </span>
                <div className="history-dice-groups">
                  {isCurrentRoll ? (
                    <span className="rolling-indicator">Tumbling...</span>
                  ) : (
                    Object.entries(groupedRolls).map(([type, rolls]) => (
                      <span key={type} className="dice-group">
                        <strong className="dice-group-label">{type}:</strong>
                        <span className="dice-group-values">
                          [
                          {rolls.map((roll, i) => {
                            let statusClass = "kept-die";
                            if (roll.dropped) {
                              statusClass = "dropped-die";
                            } else if (roll.isMax) {
                              statusClass = "max-roll";
                            } else if (roll.isMin) {
                              statusClass = "min-roll";
                            }
                            return (
                              <span key={i} className={statusClass}>
                                {roll.value}
                                {i < rolls.length - 1 ? ", " : ""}
                              </span>
                            );
                          })}
                          ]
                        </span>
                      </span>
                    ))
                  )}
                </div>
              </div>
              <div className="history-total">
                {isCurrentRoll ? "?" : record.total}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
