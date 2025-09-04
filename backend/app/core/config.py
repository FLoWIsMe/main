from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    app_name: str = "Tower of Hanoi AI Visualizer"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS settings
    allowed_origins: List[str] = ["http://localhost:3000", "http://frontend:3000"]

    # WebSocket settings
    websocket_timeout: int = 60

    # AI settings
    max_moves: int = 50
    default_speed: float = 1.0

    class Config:
        env_file = ".env"


settings = Settings()
