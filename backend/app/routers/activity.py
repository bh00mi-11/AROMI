import json
from datetime import date
from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_worker
from app.models.models import Worker, ActivityPlan
from app.schemas.schemas import ActivityPlanRequest
from app.services.tools import tool_activity_plan
from app.services.pdf_generator import generate_activity_plan_pdf

router = APIRouter()


@router.post("/generate")
async def generate_activity_plan(
    data: ActivityPlanRequest,
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    result = await tool_activity_plan(
        age_group=data.age_group,
        child_count=data.child_count,
        language=data.language,
        worker_id=worker.id,
        db=db,
    )
    return result


@router.get("/today")
def get_today_plan(db: Session = Depends(get_db), worker: Worker = Depends(get_current_worker)):
    plan = (
        db.query(ActivityPlan)
        .filter(ActivityPlan.worker_id == worker.id, ActivityPlan.plan_date == date.today())
        .order_by(ActivityPlan.id.desc())
        .first()
    )
    if not plan:
        return {"message": "No plan generated today. Use /activity/generate"}
    return {"plan_id": plan.id, "plan": json.loads(plan.plan_content), "language": plan.language}


@router.post("/pdf")
async def download_activity_pdf(
    data: dict,
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    # Check if a generated plan payload was passed
    if "session_title" in data and "activities" in data:
        plan_data = data
    else:
        # Otherwise generate plan from parameters
        age_group = str(data.get("age_group", "3-6"))
        child_count = int(data.get("child_count", 15))
        language = str(data.get("language", "hindi"))
        plan_data = await tool_activity_plan(
            age_group=age_group,
            child_count=child_count,
            language=language,
            worker_id=worker.id,
            db=db,
        )

    worker_data = {
        "name": worker.name,
        "centre_name": getattr(worker, "centre_name", None) or f"आंगनवाड़ी केंद्र ({worker.centre_id})",
        "centre_id": worker.centre_id,
    }

    pdf_bytes = generate_activity_plan_pdf(plan_data, worker_data)
    filename = "AROMI_ECCE_Daily_Activity_Plan.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@router.get("/today/pdf")
def download_today_activity_pdf(
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    plan = (
        db.query(ActivityPlan)
        .filter(ActivityPlan.worker_id == worker.id, ActivityPlan.plan_date == date.today())
        .order_by(ActivityPlan.id.desc())
        .first()
    )
    if plan and plan.plan_content:
        plan_data = json.loads(plan.plan_content)
    else:
        plan_data = {
            "session_title": "दैनिक पाठ्यचर्या सत्र — रंग, संख्या ज्ञान और लयबद्ध गतिविधि",
            "total_duration_minutes": 45,
            "activities": [
                {
                    "name": "पत्थर से गिनती व संख्या ज्ञान",
                    "type": "गणितीय कौशल",
                    "duration_minutes": 15,
                    "materials_needed": ["10 छोटे पत्थर", "जमीन पर खींची गई रेखा"],
                    "steps": ["बच्चों को 2-2 के जोड़े में बिठाएं", "एक-एक पत्थर उठाकर गिनें", "1 से 10 तक गिनती बोलें"],
                    "learning_objective": "संख्यात्मक बोध व बुनियादी गणना कौशल",
                },
                {
                    "name": "मेंढक की छलांग व शारीरिक समन्वय",
                    "type": "स्थूल क्रियात्मक कौशल",
                    "duration_minutes": 15,
                    "materials_needed": ["खुला मैदान", "चाक से बने घेरे"],
                    "steps": ["जमीन पर 5 घेरे बनाएं", "मेंढक की तरह कूदकर घेरों में जाएं"],
                    "learning_objective": "शारीरिक संतुलन और स्थूल मोटर विकास",
                },
                {
                    "name": "वर्षा गीत व सामूह गान",
                    "type": "भाषा व भावनात्मक विकास",
                    "duration_minutes": 15,
                    "materials_needed": ["कोई नहीं"],
                    "steps": ["बच्चों को गोल घेरे में बिठाएं", "लयबद्ध ताली के साथ गीत प्रस्तुत करें"],
                    "learning_objective": "शब्दावली विस्तार और स्मृति संवर्धन",
                },
            ],
            "tips_for_worker": "गतिविधि शुरू करने से पहले बच्चों को पेयजल उपलब्ध कराएं। शर्मीले बच्चों को विशेष प्रोत्साहन दें।",
        }

    worker_data = {
        "name": worker.name,
        "centre_name": getattr(worker, "centre_name", None) or f"आंगनवाड़ी केंद्र ({worker.centre_id})",
        "centre_id": worker.centre_id,
    }

    pdf_bytes = generate_activity_plan_pdf(plan_data, worker_data)
    filename = "AROMI_ECCE_Today_Plan.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )
