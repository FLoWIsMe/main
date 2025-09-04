import asyncio
from typing import Optional
import logging
from ..models.game import TowerOfHanoiGame
from ..models.schemas import GameStats

logger = logging.getLogger(__name__)

class GameService:
    def __init__(self):
        self.current_game: Optional[TowerOfHanoiGame] = None
        self.is_running = False
    
    def create_new_game(self) -> TowerOfHanoiGame:
        """Create and return a new game instance"""
        self.current_game = TowerOfHanoiGame()
        logger.info("New game created")
        return self.current_game
    
    def get_current_game(self) -> Optional[TowerOfHanoiGame]:
        """Get the current game instance"""
        return self.current_game
    
    def reset_game(self) -> TowerOfHanoiGame:
        """Reset current game or create new one"""
        if self.current_game:
            self.current_game.reset()
        else:
            self.current_game = TowerOfHanoiGame()
        
        self.is_running = False
        logger.info("Game reset")
        return self.current_game
    
    def start_game(self):
        """Mark game as running"""
        self.is_running = True
        logger.info("Game started")
    
    def stop_game(self):
        """Mark game as stopped"""
        self.is_running = False
        logger.info("Game stopped")
    
    def get_game_stats(self) -> Optional[GameStats]:
        """Get current game statistics"""
        if not self.current_game:
            return None
        
        progress = self.current_game.get_progress()
        return GameStats(
            moves=progress['moves'],
            time_elapsed=0.0,  # Would need to track start time
            is_solved=progress['is_solved']
        )

# Global game service instance
game_service = GameService()
