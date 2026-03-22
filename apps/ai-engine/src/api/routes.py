from fastapi import APIRouter

from application.execution_service import ExecutionService

router = APIRouter()
service = ExecutionService()


@router.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/executions")
def list_executions() -> dict[str, list[dict[str, str]]]:
    executions = [execution.model_dump(mode="json") for execution in service.list_executions()]
    return {"items": executions}
