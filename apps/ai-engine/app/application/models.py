from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

ExecutionState = Literal[
    'RECEIVED',
    'PARSED',
    'PLANNED',
    'ACTING',
    'OBSERVING',
    'RETRYING',
    'SUCCEEDED',
    'FAILED',
]


class PromptSubmissionRequest(BaseModel):
    execution_id: str = Field(..., description='Durable execution identifier from the control plane.')
    idempotency_key: str | None = Field(default=None)
    prompt: str
    user_id: str | None = Field(default=None)
    metadata: dict[str, str] = Field(default_factory=dict)
    submitted_at: datetime


class PromptSubmissionResponse(BaseModel):
    execution_id: str
    accepted_state: Literal['RECEIVED']
    contract_version: str
    accepted_at: datetime


class NormalizedIntent(BaseModel):
    execution_id: str
    intent_id: str
    summary: str
    goals: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    required_tools: list[str] = Field(default_factory=list)
    risk_level: Literal['LOW', 'MEDIUM', 'HIGH']
    parsed_at: datetime


class PlanStep(BaseModel):
    step_id: str
    description: str
    tool_name: str | None = None
    deterministic_input: dict[str, Any] = Field(default_factory=dict)


class ToolInvocation(BaseModel):
    execution_id: str
    invocation_id: str
    tool_name: str
    deterministic_input: dict[str, Any] = Field(default_factory=dict)
    issued_at: datetime


class ToolResult(BaseModel):
    execution_id: str
    invocation_id: str
    tool_name: str
    status: Literal['SUCCEEDED', 'FAILED']
    output: dict[str, Any] = Field(default_factory=dict)
    output_payload_hash: str
    observed_at: datetime


class ExecutionLogEvent(BaseModel):
    execution_id: str
    event_id: str
    prior_state: ExecutionState
    next_state: ExecutionState
    tool_invoked: str | None = None
    deterministic_input_payload: dict[str, Any] = Field(default_factory=dict)
    output_payload_hash: str
    timestamp: datetime
    attempt: int = Field(ge=0)
    notes: str | None = None


class FinalAgentOutput(BaseModel):
    execution_id: str
    final_state: Literal['SUCCEEDED', 'FAILED']
    summary: str
    artifacts: list[dict[str, str]] = Field(default_factory=list)
    completed_at: datetime
