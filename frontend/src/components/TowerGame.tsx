import React from "react";
import styles from "./TowerGame.module.css";
import { AIThinkingData } from "../types";

interface TowerGameProps {
  gameState: number[][];
  aiThinking: AIThinkingData | null;
  aiRunning: boolean;
}

const TowerGame: React.FC<TowerGameProps> = ({
  gameState,
  aiThinking,
  aiRunning,
}) => {
  const getDiskClass = (diskSize: number): string => {
    const classes = [
      "",
      styles.diskA,
      styles.diskB,
      styles.diskC,
      styles.diskD,
    ];
    return classes[diskSize] || "";
  };

  const getDiskLabel = (diskSize: number): string => {
    return String.fromCharCode(64 + diskSize); // A, B, C, D
  };

  const getTowerHighlight = (towerIndex: number): string => {
    if (!aiThinking) return "";

    const { predicted_move } = aiThinking;
    if (predicted_move.from_tower === towerIndex + 1) {
      return styles.towerHighlightFrom;
    }
    if (predicted_move.to_tower === towerIndex + 1) {
      return styles.towerHighlightTo;
    }
    return "";
  };

  return (
    <div className={styles.towerGame}>
      <div className={styles.gameContainer}>
        {gameState.map((tower, towerIndex) => (
          <div
            key={towerIndex}
            className={`${styles.tower} ${getTowerHighlight(towerIndex)}`}
          >
            <div className={styles.towerLabel}>Tower {towerIndex + 1}</div>
            <div className={styles.towerRod}></div>
            <div className={styles.towerBase}></div>
            <div className={styles.disksContainer}>
              {tower.map((diskSize, diskIndex) => (
                <div
                  key={`${towerIndex}-${diskIndex}-${diskSize}`}
                  className={`${styles.disk} ${getDiskClass(diskSize)}`}
                  style={{
                    zIndex: tower.length - diskIndex,
                    bottom: `${diskIndex * 32 + 20}px`,
                  }}
                >
                  {getDiskLabel(diskSize)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {aiRunning && aiThinking && (
        <div className={styles.aiMoveIndicator}>
          <div className={styles.thinkingBubble}>
            🤖 AI is thinking... Move {aiThinking.move_number}
            <div className={styles.movePreview}>
              Tower {aiThinking.predicted_move.from_tower} → Tower{" "}
              {aiThinking.predicted_move.to_tower}
              <span className={styles.confidence}>
                ({(aiThinking.predicted_move.confidence * 100).toFixed(1)}%
                confident)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TowerGame;
