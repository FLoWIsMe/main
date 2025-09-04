from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import logging
from ..core.websocket_manager import manager
from ..services.game_service import game_service
from ..services.ai_service import ai_service
from ..models.schemas import ClientMessage
import asyncio

logger = logging.getLogger(__name__)
router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    client_id = id(websocket)
    logger.info(f"Client {client_id} connected")
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
                client_message = ClientMessage(**message_data)
                await handle_client_message(client_message, websocket)
            except (json.JSONDecodeError, ValueError) as e:
                logger.error(f"Invalid message from client {client_id}: {e}")
                await manager.send_personal_message({
                    'type': 'error',
                    'data': {'message': 'Invalid message format'}
                }, websocket)
            except Exception as e:
                logger.error(f"Error processing message from client {client_id}: {e}")
                await manager.send_personal_message({
                    'type': 'error',
                    'data': {'message': 'Internal server error'}
                }, websocket)
                
    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected")
    except Exception as e:
        logger.error(f"Unexpected error with client {client_id}: {e}")
    finally:
        manager.disconnect(websocket)

async def handle_client_message(message: ClientMessage, websocket: WebSocket):
    """Handle incoming client messages"""
    message_type = message.type.lower()
    
    if message_type == 'start_ai_demo':
        await handle_start_ai_demo(websocket)
    
    elif message_type == 'set_speed':
        if message.speed is not None:
            ai_service.set_speed(message.speed)
            logger.info(f"Speed set to {message.speed}")
        else:
            await manager.send_personal_message({
                'type': 'error',
                'data': {'message': 'Speed value required'}
            }, websocket)
    
    elif message_type == 'stop_demo':
        ai_service.stop_demo()
        game_service.stop_game()
        await manager.broadcast({
            'type': 'demo_stopped',
            'data': {'message': 'AI demo stopped by user'}
        })
    
    elif message_type == 'reset_game':
        ai_service.stop_demo()
        game = game_service.reset_game()
        await manager.broadcast({
            'type': 'game_reset',
            'data': {'state': game.get_state()}
        })
    
    elif message_type == 'get_status':
        await send_status_update(websocket)
    
    else:
        await manager.send_personal_message({
            'type': 'error',
            'data': {'message': f'Unknown message type: {message.type}'}
        }, websocket)

async def handle_start_ai_demo(websocket: WebSocket):
    """Start AI demo"""
    if ai_service.is_running:
        await manager.send_personal_message({
            'type': 'error',
            'data': {'message': 'AI demo already running'}
        }, websocket)
        return
    
    # Create or reset game
    game = game_service.create_new_game()
    game_service.start_game()
    
    # Start AI demo in background task
    ai_service.current_task = asyncio.create_task(ai_service.run_ai_demo(game))

async def send_status_update(websocket: WebSocket):
    """Send current system status to client"""
    game = game_service.get_current_game()
    game_state = game.get_state() if game else [[1, 2, 3, 4], [], []]
    
    status = {
        'type': 'status_update',
        'data': {
            'ai_running': ai_service.is_running,
            'game_running': game_service.is_running,
            'current_speed': ai_service.speed,
            'game_state': game_state,
            'connected_clients': manager.get_connection_count()
        }
    }
    
    await manager.send_personal_message(status, websocket)
