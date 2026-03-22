from domain.execution import ExecutionRecord, ExecutionState


class ExecutionService:
    """Application service for querying execution state."""

    def list_executions(self) -> list[ExecutionRecord]:
        return [
            ExecutionRecord(
                execution_id="exec_001",
                state=ExecutionState.PENDING,
                summary="Awaiting planner assignment",
            )
        ]
