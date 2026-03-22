from dataclasses import dataclass


@dataclass(frozen=True)
class ToolDescriptor:
    name: str
    owner: str
    timeout_seconds: int


class ToolRegistry:
    def list_tools(self) -> list[ToolDescriptor]:
        return [ToolDescriptor(name="search", owner="ai-engine", timeout_seconds=30)]
