export interface GameState {
  towers: number[][];
}

export interface NeuralActivations {
  input: number[];
  hidden_1?: number[];
  hidden_2?: number[];
  output: number[];
}

export interface MovePrediction {
  from_tower: number;
  to_tower: number;
  confidence: number;
  from_probabilities: number[];
  to_probabilities: number[];
}

export interface AIThinkingData {
  game_state: number[][];
  neural_activations: NeuralActivations;
  predicted_move: MovePrediction;
  move_number: number;
  encoded_state: number[];
}

export interface AIMove {
  from_tower: number;
  to_tower: number;
  new_state?: number[][];
  valid: boolean;
  reason?: string;
  move_count: number;
}

export interface GameStats {
  moves: number;
  time: number;
}

export interface WebSocketMessage {
  type:
    | "demo_started"
    | "ai_thinking"
    | "ai_move"
    | "ai_victory"
    | "game_reset";
  data?: any;
  initial_state?: number[][];
}

export interface ConnectionManager {
  isConnected: boolean;
  websocket: WebSocket | null;
}
