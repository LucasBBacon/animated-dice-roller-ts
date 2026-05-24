import type React from "react";
import { useDiceStore } from "../../store/useDiceStore";

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
                <span className="history-dice-array">
                  [{isCurrentRoll ? "..." : record.values.join(", ")}]
                </span>
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
