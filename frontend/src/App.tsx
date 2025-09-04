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
  const [connectionError, setConnectionError] = useState<string>("");
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    console.log("Received WebSocket message:", message);

    try {
      switch (message.type) {
        case "demo_started":
          setAiRunning(true);
          if (message.initial_state) {
            setGameState(message.initial_state);
          }
          setGameStats({ moves: 0, time: Date.now() });
          setConnectionError("");
          console.log("AI demo started");
          break;

        case "ai_thinking":
          if (message.data) {
            setAiThinking(message.data as AIThinkingData);
          }
          break;

        case "ai_move":
          if (message.data?.valid && message.data?.new_state) {
            setGameState(message.data.new_state);
            setGameStats((prev) => ({
              ...prev,
              moves: message.data.move_count,
            }));
          }
          console.log("AI move:", message.data);
          break;

        case "ai_victory":
          setAiRunning(false);
          const moves = message.data?.total_moves || 0;
          const time = message.data?.total_time || 0;
          alert(
            `🎉 AI solved the puzzle in ${moves} moves and ${time.toFixed(
              2
            )} seconds!`
          );
          console.log("AI victory:", message.data);
          break;

        case "game_reset":
          if (message.data?.state) {
            setGameState(message.data.state);
          }
          setAiThinking(null);
          setGameStats({ moves: 0, time: 0 });
          setAiRunning(false);
          console.log("Game reset");
          break;

        case "error":
          console.error("Server error:", message.data?.message);
          setConnectionError(message.data?.message || "Unknown server error");
          break;

        default:
          console.warn("Unknown message type:", message.type);
      }
    } catch (error) {
      console.error("Error handling WebSocket message:", error);
      setConnectionError("Error processing server message");
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    try {
      // Get WebSocket URL from environment or use default
      const wsUrl = process.env.REACT_APP_WS_URL || "ws://localhost:8000/ws";
      console.log("Attempting to connect to WebSocket:", wsUrl);

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setConnection({ isConnected: true, websocket: ws });
        setConnectionError("");
        setReconnectAttempts(0);
        console.log("✅ Connected to AI server");
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
          setConnectionError("Invalid message format received");
        }
      };

      ws.onclose = (event: CloseEvent) => {
        setConnection({ isConnected: false, websocket: null });
        console.log(
          "❌ Disconnected from AI server. Code:",
          event.code,
          "Reason:",
          event.reason
        );

        // Attempt reconnection if it wasn't a manual close
        if (event.code !== 1000 && reconnectAttempts < 5) {
          setReconnectAttempts((prev) => prev + 1);
          setConnectionError(
            `Connection lost. Reconnecting... (${reconnectAttempts + 1}/5)`
          );

          setTimeout(() => {
            console.log(`Reconnection attempt ${reconnectAttempts + 1}`);
            connectWebSocket();
          }, Math.pow(2, reconnectAttempts) * 1000); // Exponential backoff
        } else {
          setConnectionError("Connection failed. Please refresh the page.");
        }
      };

      ws.onerror = (error: Event) => {
        console.error("WebSocket error:", error);
        setConnectionError("WebSocket connection error");
      };

      return ws;
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      setConnectionError("Failed to create WebSocket connection");
      return null;
    }
  }, [handleWebSocketMessage, reconnectAttempts]);

  useEffect(() => {
    const ws = connectWebSocket();

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log("Closing WebSocket connection");
        ws.close(1000, "Component unmounting");
      }
    };
  }, []); // Only run on mount/unmount

  const sendMessage = useCallback(
    (message: object) => {
      if (
        connection.websocket &&
        connection.websocket.readyState === WebSocket.OPEN
      ) {
        try {
          const messageStr = JSON.stringify(message);
          console.log("Sending message:", messageStr);
          connection.websocket.send(messageStr);
          return true;
        } catch (error) {
          console.error("Error sending message:", error);
          setConnectionError("Failed to send message to server");
          return false;
        }
      } else {
        console.warn("WebSocket not connected. Message not sent:", message);
        setConnectionError("Not connected to server");
        return false;
      }
    },
    [connection.websocket]
  );

  const startAIDemo = useCallback(() => {
    if (!connection.isConnected) {
      setConnectionError("Please wait for connection to be established");
      return;
    }

    if (aiRunning) {
      setConnectionError("AI demo is already running");
      return;
    }

    const success = sendMessage({ type: "start_ai_demo" });
    if (success) {
      setShowAiPanel(true);
      setConnectionError("");
      console.log("Starting AI demo...");
    }
  }, [sendMessage, connection.isConnected, aiRunning]);

  const stopAIDemo = useCallback(() => {
    const success = sendMessage({ type: "stop_demo" });
    if (success) {
      setAiRunning(false);
      setAiThinking(null);
      console.log("Stopping AI demo...");
    }
  }, [sendMessage]);

  const resetGame = useCallback(() => {
    const success = sendMessage({ type: "reset_game" });
    if (success) {
      setAiRunning(false);
      setAiThinking(null);
      console.log("Resetting game...");
    }
  }, [sendMessage]);

  const setAISpeed = useCallback(
    (speed: number) => {
      if (speed < 0.1 || speed > 3.0) {
        console.warn("Invalid speed value:", speed);
        return;
      }

      const success = sendMessage({ type: "set_speed", speed });
      if (success) {
        console.log(`AI speed set to ${speed}s`);
      }
    },
    [sendMessage]
  );

  const toggleAIPanel = useCallback(() => {
    setShowAiPanel((prev) => !prev);
  }, []);

  const retryConnection = useCallback(() => {
    setReconnectAttempts(0);
    setConnectionError("");
    connectWebSocket();
  }, [connectWebSocket]);

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
          {connectionError && (
            <div className="connection-error">
              <span className="error-text">⚠️ {connectionError}</span>
              {!connection.isConnected && (
                <button onClick={retryConnection} className="retry-btn">
                  🔄 Retry Connection
                </button>
              )}
            </div>
          )}
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
            onTogglePanel={toggleAIPanel}
            aiRunning={aiRunning}
            isConnected={connection.isConnected}
          />
        </div>

        {showAiPanel && (
          <div className="ai-section">
            <div className="ai-panel-header">
              <h3>🧠 AI Neural Network Analysis</h3>
              <button
                onClick={toggleAIPanel}
                className="close-panel-btn"
                title="Close AI Panel"
              >
                ✕
              </button>
            </div>
            <NeuralNetworkViz aiThinking={aiThinking} />
          </div>
        )}
      </main>

      {/* Loading overlay when AI is starting */}
      {aiRunning && !aiThinking && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>🤖 AI is initializing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
