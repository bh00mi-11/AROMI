from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app.auth import get_current_worker
from app.models.models import Worker, HomeVisit, Child, NutritionStatus, AgentEvent, ActivityPlan
from app.schemas.schemas import (
    ActivityPlanRequest, MPRRequest, AgentEventOut, DashboardStats
)
from app.services.tools import tool_activity_plan, tool_visit_schedule, tool_mpr_report

router = APIRouter()
