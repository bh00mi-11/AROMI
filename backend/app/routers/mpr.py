from datetime import date
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_worker
from app.models.models import Worker
from app.schemas.schemas import MPRRequest
from app.services.tools import tool_mpr_report
from app.services.pdf_generator import generate_mpr_pdf

router = APIRouter()


@router.post("/generate")
async def generate_mpr(
    data: MPRRequest,
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    result = await tool_mpr_report(
        worker_id=worker.id,
        month=data.month,
        year=data.year,
        db=db,
    )
    return result


@router.post("/pdf")
async def download_mpr_pdf_post(
    data: dict,
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    month = int(data.get("month", date.today().month))
    year = int(data.get("year", date.today().year))

    # If already calculated MPR metrics were provided in payload, use them
    if "total_children" in data and "normal_count" in data:
        mpr_data = data
    else:
        mpr_data = await tool_mpr_report(
            worker_id=worker.id,
            month=month,
            year=year,
            db=db,
        )

    worker_data = {
        "name": worker.name,
        "centre_name": getattr(worker, "centre_name", None) or f"आंगनवाड़ी केंद्र ({worker.centre_id})",
        "centre_id": worker.centre_id,
        "sector": getattr(worker, "sector", "सेक्टर 02"),
        "district": getattr(worker, "district", "पुणे"),
    }

    pdf_bytes = generate_mpr_pdf(mpr_data, worker_data)
    filename = f"AROMI_MPR_{year}_{month:02d}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@router.get("/pdf")
async def download_mpr_pdf_get(
    month: int = Query(default=date.today().month, ge=1, le=12),
    year: int = Query(default=date.today().year, ge=2020, le=2030),
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    mpr_data = await tool_mpr_report(
        worker_id=worker.id,
        month=month,
        year=year,
        db=db,
    )

    worker_data = {
        "name": worker.name,
        "centre_name": getattr(worker, "centre_name", None) or f"आंगनवाड़ी केंद्र ({worker.centre_id})",
        "centre_id": worker.centre_id,
        "sector": getattr(worker, "sector", "सेक्टर 02"),
        "district": getattr(worker, "district", "पुणे"),
    }

    pdf_bytes = generate_mpr_pdf(mpr_data, worker_data)
    filename = f"AROMI_MPR_{year}_{month:02d}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )
