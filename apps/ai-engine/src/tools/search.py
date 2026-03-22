from dataclasses import dataclass


@dataclass(frozen=True)
class SearchResult:
    title: str
    url: str


class SearchTool:
    def execute(self, query: str) -> list[SearchResult]:
        if not query.strip():
            raise ValueError("query must not be empty")
        return [SearchResult(title="Example Result", url="https://example.com")]
