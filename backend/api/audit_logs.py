from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.audit_log import AuditLog


router = APIRouter(
    prefix="/api/audit-logs",
    tags=["Audit Logs"],
)


@router.get("/")
def get_audit_logs(
    application_number: str | None = Query(default=None),
    event_type: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog)

    if application_number:
        query = query.filter(
            AuditLog.application_number == application_number
        )

    if event_type:
        query = query.filter(
            AuditLog.event_type == event_type
        )

    total_count = query.count()

    completed_count = query.filter(
        AuditLog.event_status == "Completed"
    ).count()

    error_count = query.filter(
        AuditLog.event_status == "Error"
    ).count()

    ready_count = query.filter(
        AuditLog.event_status == "Ready"
    ).count()

    event_type_counts = dict(
        query.with_entities(
            AuditLog.event_type,
            func.count(AuditLog.id),
        )
        .group_by(AuditLog.event_type)
        .all()
    )

    logs = (
        query
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )

    return {
        "total": len(logs),
        "total_count": total_count,
        "completed_count": completed_count,
        "error_count": error_count,
        "ready_count": ready_count,
        "event_type_counts": event_type_counts,
        "filters": {
            "application_number": application_number,
            "event_type": event_type,
        },
        "logs": [
            {
                "id": log.id,
                "application_id": log.application_id,
                "application_number": log.application_number,
                "event_type": log.event_type,
                "event_status": log.event_status,
                "agent_name": log.agent_name,
                "message": log.message,
                "created_at": (
                    log.created_at.isoformat()
                    if log.created_at
                    else None
                ),
            }
            for log in logs
        ],
    }