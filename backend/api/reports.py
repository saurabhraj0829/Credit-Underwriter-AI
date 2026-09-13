from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.loan_application import LoanApplication
from backend.models.underwriting_decision import UnderwritingDecision


router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"],
)


def _period_range(
    period: str,
) -> tuple[datetime | None, datetime | None]:
    """
    Return the start and exclusive end of a supported reporting period.

    Supported values:
    - all
    - current_month
    - previous_month
    - current_quarter
    - previous_quarter
    - year_to_date

    None for both values means all available records.
    """

    now = datetime.now(timezone.utc)

    current_month_start = now.replace(
        day=1,
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )

    next_month_start = (
        current_month_start.replace(
            month=current_month_start.month % 12 + 1,
            year=(
                current_month_start.year
                + (1 if current_month_start.month == 12 else 0)
            ),
        )
    )

    if period == "current_month":
        return current_month_start, next_month_start

    if period == "previous_month":
        previous_month_end = current_month_start
        previous_month_start = (
            previous_month_end - timedelta(days=1)
        ).replace(
            day=1,
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        return previous_month_start, previous_month_end

    current_quarter_month = (
        ((now.month - 1) // 3) * 3
    ) + 1

    current_quarter_start = now.replace(
        month=current_quarter_month,
        day=1,
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )

    next_quarter_month = current_quarter_month + 3

    if next_quarter_month > 12:
        next_quarter_start = current_quarter_start.replace(
            year=current_quarter_start.year + 1,
            month=next_quarter_month - 12,
        )
    else:
        next_quarter_start = current_quarter_start.replace(
            month=next_quarter_month,
        )

    if period == "current_quarter":
        return current_quarter_start, next_quarter_start

    if period == "previous_quarter":
        previous_quarter_end = current_quarter_start
        previous_quarter_start = (
            previous_quarter_end - timedelta(days=1)
        )

        previous_quarter_month = (
            ((previous_quarter_start.month - 1) // 3) * 3
        ) + 1

        previous_quarter_start = previous_quarter_start.replace(
            month=previous_quarter_month,
            day=1,
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        return previous_quarter_start, previous_quarter_end

    if period == "year_to_date":
        year_start = now.replace(
            month=1,
            day=1,
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        return year_start, next_month_start

    return None, None


@router.get("/overview")
def get_reports_overview(
    period: str = "all",
    db: Session = Depends(get_db),
):
    """
    Return live underwriting report metrics derived from
    persisted underwriting decisions.
    """

    decisions = (
        db.query(UnderwritingDecision)
        .order_by(
            UnderwritingDecision.created_at.desc()
        )
        .all()
    )

    start_date, end_date = _period_range(period)

    if start_date is not None:
        filtered_decisions = []

        for decision in decisions:
            if decision.created_at is None:
                continue

            created_at = decision.created_at

            if created_at.tzinfo is None:
                created_at = created_at.replace(
                    tzinfo=timezone.utc
                )

            if (
                created_at >= start_date
                and (
                    end_date is None
                    or created_at < end_date
                )
            ):
                filtered_decisions.append(decision)

        decisions = filtered_decisions

    total_reports = len(decisions)

    executive_reports = total_reports

    risk_reports = sum(
        1
        for decision in decisions
        if decision.risk_score is not None
        or decision.risk_category is not None
    )

    compliance_reports = sum(
        1
        for decision in decisions
        if decision.compliance_status is not None
    )

    approved_reports = sum(
        1
        for decision in decisions
        if decision.decision == "Approved"
    )

    rejected_reports = sum(
        1
        for decision in decisions
        if decision.decision == "Rejected"
    )

    manual_review_reports = sum(
        1
        for decision in decisions
        if decision.decision == "Manual Review"
    )

    high_risk_reports = sum(
        1
        for decision in decisions
        if decision.risk_category in {
            "High",
            "Very High",
        }
    )

    fraud_flagged_reports = sum(
        1
        for decision in decisions
        if decision.fraud_category in {
            "High",
            "Critical",
        }
    )

    compliance_review_reports = sum(
        1
        for decision in decisions
        if decision.compliance_status
        in {
            "Review Required",
            "Non-Compliant",
        }
    )

    recent_reports = []

    for decision in decisions[:10]:
        application = (
            db.query(LoanApplication)
            .filter(
                LoanApplication.id
                == decision.application_id
            )
            .first()
        )

        recent_reports.append(
            {
                "report_id": decision.id,
                "application_number": (
                    decision.application_number
                ),
                "applicant_name": (
                    application.applicant_name
                    if application
                    else None
                ),
                "loan_type": (
                    application.loan_type
                    if application
                    else None
                ),
                "loan_amount": (
                    application.loan_amount
                    if application
                    else None
                ),
                "report_type": "Executive Underwriting",
                "decision": decision.decision,
                "decision_status": (
                    decision.decision_status
                ),
                "risk_category": (
                    decision.risk_category
                ),
                "risk_score": decision.risk_score,
                "fraud_category": (
                    decision.fraud_category
                ),
                "compliance_status": (
                    decision.compliance_status
                ),
                "policy_version": (
                    decision.policy_version
                ),
                "created_at": (
                    decision.created_at.isoformat()
                    if decision.created_at
                    else None
                ),
            }
        )

    return {
        "period": period,
        "data_source": "Persisted Underwriting Decisions",
        "total_reports": total_reports,
        "executive_reports": executive_reports,
        "risk_reports": risk_reports,
        "compliance_reports": compliance_reports,
        "approved_reports": approved_reports,
        "rejected_reports": rejected_reports,
        "manual_review_reports": manual_review_reports,
        "high_risk_reports": high_risk_reports,
        "fraud_flagged_reports": fraud_flagged_reports,
        "compliance_review_reports": (
            compliance_review_reports
        ),
        "recent_reports": recent_reports,
    }