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

export type MessageType =
  | "demo_started"
  | "ai_thinking"
  | "ai_move"
  | "ai_victory"
  | "game_reset"
  | "error"
  | "demo_stopped"
  | "status_update";

export interface WebSocketMessage {
  type: MessageType;
  data?: any;
  initial_state?: number[][];
}

export interface ClientMessage {
  type: string;
  speed?: number;
  data?: any;
}

export interface ConnectionManager {
  isConnected: boolean;
  websocket: WebSocket | null;
}

export interface ErrorData {
  message: string;
}

export interface VictoryData {
  total_moves: number;
  total_time: number;
}

export interface DemoStoppedData {
  message: string;
}

export interface StatusUpdateData {
  ai_running: boolean;
  game_running: boolean;
  current_speed: number;
  game_state: number[][];
  connected_clients: number;
}

export interface GameResetData {
  state: number[][];
}
