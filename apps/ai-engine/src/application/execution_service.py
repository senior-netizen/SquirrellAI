from domain.execution import ExecutionRecord, ExecutionState
from infrastructure.control_plane_store import load_control_plane_store


class ExecutionService:
    """Application service for querying execution state."""

    def list_executions(self) -> list[ExecutionRecord]:
        snapshot = load_control_plane_store()
        return [
            ExecutionRecord(
                execution_id=execution['id'],
                state=ExecutionState(execution['state']),
                summary=f"Execution requested by {execution['requestedBy']}",
            )
            for execution in snapshot.get('executions', [])
        ]
