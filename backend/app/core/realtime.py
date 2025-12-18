from asyncio import Lock
from typing import Set

from fastapi import WebSocket


class DashboardRealtimeBroker:
    """Mantiene una lista de websockets conectados para el dashboard.

    El objetivo es enviar una señal de "dashboard_refresh" cada vez que
    se crea o actualiza un registro diario, para que el frontend vuelva a
    consultar los datos agregados.
    """

    def __init__(self) -> None:
        self.connections: Set[WebSocket] = set()
        self._lock = Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self.connections.add(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self.connections.discard(websocket)

    async def broadcast_refresh(self) -> None:
        async with self._lock:
            targets = list(self.connections)

        for connection in targets:
            try:
                await connection.send_json({"type": "dashboard_refresh"})
            except Exception:
                await self.disconnect(connection)


dashboard_realtime = DashboardRealtimeBroker()