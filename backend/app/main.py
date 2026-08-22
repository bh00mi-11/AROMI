import os
from app.config import settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.database import engine, Base
from app.routers import auth, children, growth, attendance, visits, activity, mpr, voice, rag, agent, dashboard, photo

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AROMI — Anganwadi AI Assistant",
    description="Agentic AI system for Anganwadi workers. Hindi-first, offline-capable.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",")] if settings.CORS_ORIGINS != "*" else ["*"],
    allow_credentials=True if settings.CORS_ORIGINS != "*" else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(children.router, prefix="/children", tags=["Children"])
app.include_router(growth.router, prefix="/growth", tags=["Growth"])
app.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
app.include_router(visits.router, prefix="/visits", tags=["Visits"])
app.include_router(activity.router, prefix="/activity", tags=["Activity Planner"])
app.include_router(mpr.router, prefix="/mpr", tags=["MPR"])
app.include_router(voice.router, prefix="/voice", tags=["Voice Agent"])
app.include_router(rag.router, prefix="/rag", tags=["RAG"])
app.include_router(agent.router, prefix="/agent", tags=["Agent Pipeline"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(photo.router, prefix="/photo", tags=["Photo Malnutrition Check"])


@app.get("/")
async def root():
    
    spa = os.path.join(os.path.dirname(__file__), "..", "static", "index.html")
    if os.path.exists(spa):
        return FileResponse(spa)
    return {
        "app": "AROMI",
        "status": "running",
        "description": "Anganwadi AI Assistant — Agentic & Autonomous Systems",
        "docs": "/docs",
    }


_static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.isdir(_static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(_static_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        """Catch-all: serve index.html for client-side routing."""
        return FileResponse(os.path.join(_static_dir, "index.html"))

