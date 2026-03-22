from enum import Enum

from pydantic import BaseModel, ConfigDict


class ExecutionState(str, Enum):
    PENDING = "PENDING"
    SCHEDULED = "SCHEDULED"
    RUNNING = "RUNNING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    TIMED_OUT = "TIMED_OUT"


class ExecutionRecord(BaseModel):
    model_config = ConfigDict(frozen=True)

    execution_id: str
    state: ExecutionState
    summary: str
