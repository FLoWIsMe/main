import React, { useState, useEffect } from "react";
import styles from "./GameStats.module.css";
import { GameStats as GameStatsType } from "../types";

interface GameStatsProps {
  stats: GameStatsType;
}

const GameStats: React.FC<GameStatsProps> = ({ stats }) => {
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (stats.time > 0) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - stats.time) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stats.time]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className={styles.gameStats}>
      <div className={styles.statItem}>
        <span className={styles.statLabel}>Moves:</span>
        <span className={styles.statValue}>{stats.moves}</span>
      </div>
      <div className={styles.statItem}>
        <span className={styles.statLabel}>Time:</span>
        <span className={styles.statValue}>{formatTime(elapsedTime)}</span>
      </div>
      <div className={styles.statItem}>
        <span className={styles.statLabel}>Optimal:</span>
        <span className={styles.statValue}>15 moves</span>
      </div>
    </div>
  );
};

export default GameStats;
