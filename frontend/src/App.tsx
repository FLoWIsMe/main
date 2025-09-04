import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import TowerGame from "./components/TowerGame";
import NeuralNetworkViz from "./components/NeuralNetworkViz";
import AIControls from "./components/AIControls";
import GameStats from "./components/GameStats";
import {
  GameStats as GameStatsType,
  AIThinkingData,
  WebSocketMessage,
  ConnectionManager,
} from "./types";

const App: React.FC = () => {
  const [connection, setConnection] = useState<ConnectionManager>({
    isConnected: false,
    websocket: null,
  });

  const [gameState, setGameState] = useState<number[][]>([
    [1, 2, 3, 4],
    [],
    [],
  ]);
  const [aiThinking, setAiThinking] = useState<AIThinkingData | null>(null);
  const [aiRunning, setAiRunning] = useState<boolean>(false);
  const [gameStats, setGameStats] = useState<GameStatsType>({
    moves: 0,
    time: 0,
  });
  const [showAiPanel, setShowAiPanel] = useState<boolean>(false);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case "demo_started":
        setAiRunning(true);
        if (message.initial_state) {
          setGameState(message.initial_state);
        }
        setGameStats({ moves: 0, time: Date.now() });
        break;

      case "ai_thinking":
        setAiThinking(message.data as AIThinkingData);
        break;

      case "ai_move":
        if (message.data?.valid && message.data?.new_state) {
          setGameState(message.data.new_state);
          setGameStats((prev) => ({ ...prev, moves: message.data.move_count }));
        }
        break;

      case "ai_victory":
        setAiRunning(false);
        alert(`AI solved the puzzle in ${message.data?.total_moves} moves!`);
        break;

      case "game_reset":
        if (message.data?.state) {
          setGameState(message.data.state);
        }
        setAiThinking(null);
        setGameStats({ moves: 0, time: 0 });
        break;

      default:
        console.log("Unknown message type:", message.type);
    }
  }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onopen = () => {
      setConnection({ isConnected: true, websocket: ws });
      console.log("Connected to AI server");
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      setConnection({ isConnected: false, websocket: null });
      console.log("Disconnected from AI server");
    };

    ws.onerror = (error: Event) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [handleWebSocketMessage]);

  const sendMessage = useCallback(
    (message: object) => {
      if (
        connection.websocket &&
        connection.websocket.readyState === WebSocket.OPEN
      ) {
        connection.websocket.send(JSON.stringify(message));
      }
    },
    [connection.websocket]
  );

  const startAIDemo = useCallback(() => {
    sendMessage({ type: "start_ai_demo" });
    setShowAiPanel(true);
  }, [sendMessage]);

  const stopAIDemo = useCallback(() => {
    sendMessage({ type: "stop_demo" });
    setAiRunning(false);
  }, [sendMessage]);

  const resetGame = useCallback(() => {
    sendMessage({ type: "reset_game" });
  }, [sendMessage]);

  const setAISpeed = useCallback(
    (speed: number) => {
      sendMessage({ type: "set_speed", speed });
    },
    [sendMessage]
  );

  return (
    <div className="App">
      <header className="app-header">
        <h1>🗼 Tower of Hanoi AI Visualizer</h1>
        <p>Watch an AI solve the puzzle and see how it thinks!</p>
        <div className="connection-status">
          Status:{" "}
          <span
            className={connection.isConnected ? "connected" : "disconnected"}
          >
            {connection.isConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </span>
        </div>
      </header>

      <main className="main-content">
        <div className="game-section">
          <GameStats stats={gameStats} />
          <TowerGame
            gameState={gameState}
            aiThinking={aiThinking}
            aiRunning={aiRunning}
          />
          <AIControls
            onStartDemo={startAIDemo}
            onStopDemo={stopAIDemo}
            onResetGame={resetGame}
            onSpeedChange={setAISpeed}
            onTogglePanel={() => setShowAiPanel(!showAiPanel)}
            aiRunning={aiRunning}
            isConnected={connection.isConnected}
          />
        </div>

        {showAiPanel && (
          <div className="ai-section">
            <NeuralNetworkViz aiThinking={aiThinking} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
