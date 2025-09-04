import asyncio
import time
from typing import Dict, Any
import logging
from ..models.ai import NeuralNetworkAI, Individual
from ..models.game import TowerOfHanoiGame
from ..core.websocket_manager import manager
from ..core.config import settings

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.ai = NeuralNetworkAI()
        self.speed = settings.default_speed
        self.is_running = False
        self.current_task: asyncio.Task = None
    
    async def run_ai_demo(self, game: TowerOfHanoiGame) -> None:
        """Run AI demo with real-time updates"""
        if self.is_running:
            logger.warning("AI demo already running")
            return
        
        self.is_running = True
        moves = 0
        start_time = time.time()
        
        logger.info("Starting AI demo")
        
        await manager.broadcast({
            'type': 'demo_started',
            'initial_state': game.get_state()
        })
        
        try:
            while self.is_running and not game.is_solved() and moves < settings.max_moves:
                # Get current game state
                state = self.ai.encode_game_state(game.towers)
                
                # Get AI's thoughts
                result = self.ai.get_activations_and_prediction(state)
                
                # Broadcast AI thinking process
                await manager.broadcast({
                    'type': 'ai_thinking',
                    'data': {
                        'game_state': game.get_state(),
                        'neural_activations': result['activations'],
                        'predicted_move': result['prediction'],
                        'move_number': moves + 1,
                        'encoded_state': state.tolist()
                    }
                })
                
                # Wait for visualization (adjustable speed)
                await asyncio.sleep(self.speed)
                
                if not self.is_running:  # Check if stopped during sleep
                    break
                
                # Make the predicted move
                prediction = result['prediction']
                from_tower = prediction['from_tower']
                to_tower = prediction['to_tower']
                
                move_success = game.make_move(from_tower, to_tower)
                
                if move_success:
                    moves += 1
                    logger.info(f"AI made move {moves}: Tower {from_tower} -> Tower {to_tower}")
                    
                    await manager.broadcast({
                        'type': 'ai_move',
                        'data': {
                            'from_tower': from_tower,
                            'to_tower': to_tower,
                            'new_state': game.get_state(),
                            'valid': True,
                            'move_count': moves
                        }
                    })
                else:
                    moves += 1  # Count invalid moves as penalty
                    logger.warning(f"AI attempted invalid move: Tower {from_tower} -> Tower {to_tower}")
                    
                    await manager.broadcast({
                        'type': 'ai_move',
                        'data': {
                            'from_tower': from_tower,
                            'to_tower': to_tower,
                            'valid': False,
                            'reason': 'Invalid move attempted',
                            'move_count': moves
                        }
                    })
                
                await asyncio.sleep(self.speed * 0.5)  # Brief pause after move
            
            # Game completion
            if game.is_solved():
                end_time = time.time()
                total_time = end_time - start_time
                logger.info(f"AI solved puzzle in {moves} moves, {total_time:.2f} seconds")
                
                await manager.broadcast({
                    'type': 'ai_victory',
                    'data': {
                        'total_moves': moves,
                        'total_time': total_time
                    }
                })
            elif moves >= settings.max_moves:
                logger.info(f"AI reached maximum moves ({settings.max_moves})")
                await manager.broadcast({
                    'type': 'error',
                    'data': {'message': f'AI reached maximum moves limit ({settings.max_moves})'}
                })
        
        except asyncio.CancelledError:
            logger.info("AI demo cancelled")
        except Exception as e:
            logger.error(f"Error in AI demo: {e}")
            await manager.broadcast({
                'type': 'error',
                'data': {'message': f'AI demo error: {str(e)}'}
            })
        finally:
            self.is_running = False
            logger.info("AI demo finished")
    
    def stop_demo(self):
        """Stop the current AI demo"""
        if self.is_running:
            self.is_running = False
            if self.current_task and not self.current_task.done():
                self.current_task.cancel()
            logger.info("AI demo stopped")
    
    def set_speed(self, speed: float):
        """Set AI demo speed"""
        self.speed = max(0.1, min(3.0, speed))  # Clamp between 0.1 and 3.0
        logger.info(f"AI speed set to {self.speed}s")
    
    def load_trained_model(self, model_path: str):
        """Load a trained AI model"""
        try:
            # Implementation for loading trained model
            logger.info(f"Loading AI model from {model_path}")
            # For now, create a new random model
            self.ai = NeuralNetworkAI()
        except Exception as e:
            logger.error(f"Failed to load AI model: {e}")

# Global AI service instance
ai_service = AIService()
