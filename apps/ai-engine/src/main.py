from fastapi import FastAPI

from api.routes import router as api_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="SquirrellAI AI Engine",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )
    app.include_router(api_router, prefix="/v1")
    return app


app = create_app()
