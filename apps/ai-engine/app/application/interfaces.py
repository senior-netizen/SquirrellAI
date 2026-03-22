from __future__ import annotations

from typing import Protocol, Sequence

from .models import (
    ExecutionLogEvent,
    FinalAgentOutput,
    NormalizedIntent,
    PlanStep,
    PromptSubmissionRequest,
    ToolInvocation,
    ToolResult,
)


class IntentParser(Protocol):
    """Normalizes a raw prompt into a deterministic intent representation."""

    async def parse(self, request: PromptSubmissionRequest) -> NormalizedIntent:
        ...


class Planner(Protocol):
    """Builds an ordered plan from a normalized intent without performing side effects."""

    async def create_plan(self, intent: NormalizedIntent) -> Sequence[PlanStep]:
        ...


class ToolExecutor(Protocol):
    """Executes tools inside the isolated runtime boundary and returns normalized results."""

    async def execute(self, invocation: ToolInvocation) -> ToolResult:
        ...


class ObservationAnalyzer(Protocol):
    """Interprets tool results and emits the next orchestration signal or final output."""

    async def analyze(
        self,
        *,
        intent: NormalizedIntent,
        plan: Sequence[PlanStep],
        result: ToolResult,
        events: Sequence[ExecutionLogEvent],
    ) -> FinalAgentOutput | ExecutionLogEvent:
        ...


class RetryPolicy(Protocol):
    """Determines whether and how a failed or partial observation should be retried."""

    def should_retry(self, *, result: ToolResult, events: Sequence[ExecutionLogEvent]) -> bool:
        ...

    def next_attempt_delay_seconds(
        self,
        *,
        result: ToolResult,
        events: Sequence[ExecutionLogEvent],
    ) -> float:
        ...
