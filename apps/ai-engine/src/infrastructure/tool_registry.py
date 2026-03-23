from dataclasses import dataclass

from infrastructure.control_plane_store import load_control_plane_store


@dataclass(frozen=True)
class ToolDescriptor:
    name: str
    owner: str
    timeout_seconds: int


class ToolRegistry:
    def list_tools(self) -> list[ToolDescriptor]:
        snapshot = load_control_plane_store()
        return [
            ToolDescriptor(
                name=tool['name'],
                owner=tool['owner'],
                timeout_seconds=tool['timeoutSeconds'],
            )
            for tool in snapshot.get('tools', [])
        ]
