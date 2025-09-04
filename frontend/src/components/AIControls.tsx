import React, { useState, useCallback } from "react";
import { Play, Square, RotateCcw, Brain, Gauge } from "lucide-react";
import styles from "./AIControls.module.css";

interface AIControlsProps {
  onStartDemo: () => void;
  onStopDemo: () => void;
  onResetGame: () => void;
  onSpeedChange: (speed: number) => void;
  onTogglePanel: () => void;
  aiRunning: boolean;
  isConnected: boolean;
}

const AIControls: React.FC<AIControlsProps> = ({
  onStartDemo,
  onStopDemo,
  onResetGame,
  onSpeedChange,
  onTogglePanel,
  aiRunning,
  isConnected,
}) => {
  const [speed, setSpeed] = useState<number>(1.0);

  const handleSpeedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newSpeed = parseFloat(e.target.value);
      setSpeed(newSpeed);
      onSpeedChange(newSpeed);
    },
    [onSpeedChange]
  );

  return (
    <div className={styles.aiControls}>
      <div className={styles.controlGroup}>
        <h4>🤖 AI Controls</h4>
        <div className={styles.buttonRow}>
          <button
            onClick={onStartDemo}
            disabled={!isConnected || aiRunning}
            className={`${styles.controlBtn} ${styles.startBtn}`}
          >
            <Play size={16} />
            Watch AI Play
          </button>

          <button
            onClick={onStopDemo}
            disabled={!aiRunning}
            className={`${styles.controlBtn} ${styles.stopBtn}`}
          >
            <Square size={16} />
            Stop AI
          </button>

          <button
            onClick={onResetGame}
            disabled={aiRunning}
            className={`${styles.controlBtn} ${styles.resetBtn}`}
          >
            <RotateCcw size={16} />
            Reset Game
          </button>
        </div>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.speedControl}>
          <Gauge size={16} />
          <label htmlFor="speed-slider">AI Speed: {speed}s per move</label>
          <input
            id="speed-slider"
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={speed}
            onChange={handleSpeedChange}
            className={styles.speedSlider}
          />
        </div>
      </div>

      <div className={styles.controlGroup}>
        <button
          onClick={onTogglePanel}
          className={`${styles.controlBtn} ${styles.toggleBtn}`}
        >
          <Brain size={16} />
          Toggle Neural Network View
        </button>
      </div>

      {!isConnected && (
        <div className={styles.connectionWarning}>
          ⚠️ Not connected to AI server. Make sure the FastAPI server is
          running.
        </div>
      )}
    </div>
  );
};

export default AIControls;
