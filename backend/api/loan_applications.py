from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.loan_application import LoanApplication
from backend.models.bank_statement_data import BankStatementData
from backend.models.salary_slip_data import SalarySlipData
from backend.models.document import Document
from backend.models.underwriting_decision import UnderwritingDecision
from backend.models.loan_application_schema import (
    LoanApplicationCreate,
    UnderwritingDecisionCreate,
)
from backend.ai.agents.credit_risk_agent import credit_risk_agent
from backend.ai.agents.fraud_detection_agent import fraud_detection_agent
from backend.ai.agents.underwriting_coordinator_agent import (
    underwriting_coordinator_agent,
)
from backend.ai.agents.ai_copilot_agent import ai_copilot_agent


router = APIRouter(
    prefix="/api/loan-applications",
    tags=["Loan Applications"],
)


@router.post("/")
def create_loan_application(
    application_data: LoanApplicationCreate,
    db: Session = Depends(get_db),
):
    existing_application = (
        db.query(LoanApplication)
        .filter(
            LoanApplication.application_number
            == application_data.application_number
        )
        .first()
    )

    if existing_application is not None:
        raise HTTPException(
            status_code=409,
            detail="Application number already exists",
        )

    application = LoanApplication(
        application_number=application_data.application_number,
        applicant_name=application_data.applicant_name,
        loan_type=application_data.loan_type,
        loan_amount=application_data.loan_amount,
        annual_income=application_data.annual_income,
        credit_score=application_data.credit_score,
        debt_to_income_ratio=application_data.debt_to_income_ratio,
        employment_years=application_data.employment_years,
        risk_score=None,
        default_probability=None,
        risk_category=None,
        status="Pending",
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return application


@router.get("/")
def get_loan_applications(
    db: Session = Depends(get_db),
):
    applications = (
        db.query(LoanApplication)
        .order_by(LoanApplication.created_at.desc())
        .all()
    )

    return applications

@router.get("/decision-queue")
def get_decision_queue(
    db: Session = Depends(get_db),
):
    """
    Return live underwriting decision queue data.

    Pending queue items are applications whose current status
    requires underwriting review.
    """

    applications = (
        db.query(LoanApplication)
        .order_by(LoanApplication.created_at.desc())
        .all()
    )

    today = date.today()

    pending_queue = []
    pending_decisions = 0
    high_priority = 0
    approved_today = 0

    for application in applications:
        if application.status == "Approved":
            if (
                application.created_at
                and application.created_at.date() == today
            ):
                approved_today += 1

        if application.status != "Manual Review":
            continue

        pending_decisions += 1

        decision = (
            db.query(UnderwritingDecision)
            .filter(
                UnderwritingDecision.application_id
                == application.id
            )
            .order_by(
                UnderwritingDecision.created_at.desc()
            )
            .first()
        )

        risk_category = application.risk_category or "Pending"
        fraud_category = None
        compliance_status = None
        decision_status = None
        recommendation = application.status

        if decision is not None:
            fraud_category = decision.fraud_category
            compliance_status = decision.compliance_status
            decision_status = decision.decision_status
            recommendation = decision.decision

        priority = "Normal"

        if (
            risk_category in {"High", "Very High"}
            or fraud_category == "Critical"
            or compliance_status == "Non-Compliant"
        ):
            priority = "High"
            high_priority += 1

        pending_queue.append(
            {
                "application_number": application.application_number,
                "applicant_name": application.applicant_name,
                "loan_type": application.loan_type,
                "loan_amount": application.loan_amount,
                "risk_score": application.risk_score,
                "risk_category": risk_category,
                "default_probability": application.default_probability,
                "fraud_category": fraud_category,
                "compliance_status": compliance_status,
                "decision_status": decision_status,
                "recommendation": recommendation,
                "priority": priority,
                "created_at": (
                    application.created_at.isoformat()
                    if application.created_at
                    else None
                ),
            }
        )

    return {
        "pending_decisions": pending_decisions,
        "high_priority": high_priority,
        "approved_today": approved_today,
        "average_decision_time_minutes": None,
        "average_decision_time_available": False,
        "queue": pending_queue,
    }

@router.get("/risk/overview")
def get_risk_overview(
    db: Session = Depends(get_db),
):
    applications = (
        db.query(LoanApplication)
        .order_by(LoanApplication.created_at.desc())
        .all()
    )

    scored_applications = [
        application
        for application in applications
        if application.risk_score is not None
    ]

    total_scored = len(scored_applications)

    if total_scored > 0:
        average_risk_score = round(
            sum(
                float(application.risk_score)
                for application in scored_applications
            )
            / total_scored,
            2,
        )

        average_default_probability = round(
            sum(
                float(application.default_probability or 0)
                for application in scored_applications
            )
            / total_scored,
            4,
        )
    else:
        average_risk_score = 0.0
        average_default_probability = 0.0

    risk_counts = {
        "Low": 0,
        "Medium": 0,
        "High": 0,
        "Very High": 0,
    }

    for application in scored_applications:
        category = application.risk_category

        if category in risk_counts:
            risk_counts[category] += 1

    if total_scored > 0:
        risk_percentages = {
            category: round(
                (count / total_scored) * 100,
                2,
            )
            for category, count in risk_counts.items()
        }
    else:
        risk_percentages = {
            "Low": 0.0,
            "Medium": 0.0,
            "High": 0.0,
            "Very High": 0.0,
        }

    high_risk_categories = {
        "High",
        "Very High",
    }

    high_risk_cases = [
        {
            "application_number": application.application_number,
            "applicant_name": application.applicant_name,
            "risk_score": application.risk_score,
            "default_probability": application.default_probability,
            "risk_category": application.risk_category,
            "status": application.status,
        }
        for application in scored_applications
        if application.risk_category in high_risk_categories
    ]

    manual_review_cases = [
        {
            "application_number": application.application_number,
            "applicant_name": application.applicant_name,
            "risk_score": application.risk_score,
            "default_probability": application.default_probability,
            "risk_category": application.risk_category,
            "status": application.status,
        }
        for application in applications
        if application.status == "Manual Review"
    ]

    applications_data = [
        {
            "application_number": application.application_number,
            "applicant_name": application.applicant_name,
            "loan_type": application.loan_type,
            "loan_amount": application.loan_amount,
            "risk_score": application.risk_score,
            "default_probability": application.default_probability,
            "risk_category": application.risk_category,
            "status": application.status,
            "created_at": (
                application.created_at.isoformat()
                if application.created_at
                else None
            ),
        }
        for application in applications
    ]

    return {
        "total_applications": len(applications),
        "scored_applications": total_scored,
        "unscored_applications": (
            len(applications) - total_scored
        ),
        "average_risk_score": average_risk_score,
        "average_default_probability": (
            average_default_probability
        ),
        "risk_distribution": risk_counts,
        "risk_percentages": risk_percentages,
        "high_risk_cases": high_risk_cases,
        "high_risk_count": len(high_risk_cases),
        "manual_review_cases": manual_review_cases,
        "manual_review_count": len(manual_review_cases),
        "applications": applications_data,
    }

@router.get("/compliance/overview")
def get_compliance_overview(
    db: Session = Depends(get_db),
):
    """
    Return portfolio-level compliance overview
    for the Compliance Center.
    """

    applications = (
        db.query(LoanApplication)
        .order_by(
            LoanApplication.created_at.desc()
        )
        .all()
    )

    total_applications = len(applications)

    compliant_count = 0
    review_required_count = 0
    non_compliant_count = 0

    total_checks = 0
    total_failed_checks = 0
    total_warning_checks = 0

    compliance_applications = []

    for application in applications:

        decision = (
            db.query(UnderwritingDecision)
            .filter(
                UnderwritingDecision.application_id
                == application.id
            )
            .order_by(
                UnderwritingDecision.created_at.desc()
            )
            .first()
        )

        if decision is None:
            continue

        compliance_status = getattr(
            decision,
            "compliance_status",
            None,
        )

        failed_checks = getattr(
            decision,
            "failed_checks",
            0,
        ) or 0

        warning_checks = getattr(
            decision,
            "warning_checks",
            0,
        ) or 0

        total_failed_checks += int(
            failed_checks
        )

        total_warning_checks += int(
            warning_checks
        )

        total_checks += (
            int(failed_checks)
            + int(warning_checks)
        )

        if compliance_status == "Compliant":
            compliant_count += 1

        elif compliance_status == "Review Required":
            review_required_count += 1

        elif compliance_status == "Non-Compliant":
            non_compliant_count += 1

        compliance_applications.append(
            {
                "application_number":
                    application.application_number,

                "applicant_name":
                    application.applicant_name,

                "loan_type":
                    application.loan_type,

                "loan_amount":
                    application.loan_amount,

                "compliance_status":
                    compliance_status,

                "failed_checks":
                    int(failed_checks),

                "warning_checks":
                    int(warning_checks),

                "status":
                    application.status,

                "created_at":
                    application.created_at,
            }
        )

    reviewed_applications = (
        compliant_count
        + review_required_count
        + non_compliant_count
    )

    if reviewed_applications > 0:
        compliance_score = round(
            (
                compliant_count
                / reviewed_applications
            )
            * 100,
            1,
        )
    else:
        compliance_score = 0.0

    return {
        "total_applications":
            total_applications,

        "reviewed_applications":
            reviewed_applications,

        "compliance_score":
            compliance_score,

        "compliant_count":
            compliant_count,

        "review_required_count":
            review_required_count,

        "non_compliant_count":
            non_compliant_count,

        "total_policy_checks":
            total_checks,

        "failed_checks":
            total_failed_checks,

        "warning_checks":
            total_warning_checks,

        "applications":
            compliance_applications,
    }

@router.get("/analytics/overview")
def get_analytics_overview(
    db: Session = Depends(get_db),
):
    """
    Return portfolio-level analytics overview
    for the Analytics section.
    """

    applications = (
        db.query(LoanApplication)
        .order_by(
            LoanApplication.created_at.desc()
        )
        .all()
    )

    total_applications = len(applications)

    total_loan_volume = sum(
        float(application.loan_amount or 0)
        for application in applications
    )

    approved_count = sum(
        1
        for application in applications
        if application.status == "Approved"
    )

    high_risk_count = sum(
        1
        for application in applications
        if application.risk_category in {
            "High",
            "Very High",
        }
    )

    scored_applications = [
        application
        for application in applications
        if application.risk_score is not None
    ]

    if total_applications > 0:
        approval_rate = round(
            (
                approved_count
                / total_applications
            )
            * 100,
            1,
        )
    else:
        approval_rate = 0.0

    if total_applications > 0:
        high_risk_rate = round(
            (
                high_risk_count
                / total_applications
            )
            * 100,
            1,
        )
    else:
        high_risk_rate = 0.0

    # ---------------------------------------------------------
    # Risk distribution
    # ---------------------------------------------------------

    risk_distribution = {
        "Low": 0,
        "Medium": 0,
        "High": 0,
        "Very High": 0,
    }

    for application in scored_applications:
        category = application.risk_category

        if category in risk_distribution:
            risk_distribution[category] += 1

    # ---------------------------------------------------------
    # Monthly approval trend
    # ---------------------------------------------------------

    monthly_data = {}

    for application in applications:
        if not application.created_at:
            continue

        month_key = application.created_at.strftime(
            "%Y-%m"
        )

        if month_key not in monthly_data:
            monthly_data[month_key] = {
                "month": application.created_at.strftime(
                    "%b"
                ),
                "applications": 0,
                "approved": 0,
                "rejected": 0,
            }

        monthly_data[month_key]["applications"] += 1

        if application.status == "Approved":
            monthly_data[month_key]["approved"] += 1

        elif application.status == "Rejected":
            monthly_data[month_key]["rejected"] += 1

    approval_trend = []

    for month_key in sorted(monthly_data.keys()):
        item = monthly_data[month_key]

        applications_count = item["applications"]

        approval_rate_monthly = (
            round(
                (
                    item["approved"]
                    / applications_count
                )
                * 100,
                1,
            )
            if applications_count > 0
            else 0.0
        )

        approval_trend.append(
            {
                "month": item["month"],
                "applications": applications_count,
                "approved": item["approved"],
                "rejected": item["rejected"],
                "approval_rate": approval_rate_monthly,
            }
        )

    # ---------------------------------------------------------
    # Average processing time
    # ---------------------------------------------------------

    average_processing_time = 0.0

    # ---------------------------------------------------------
    # Final analytics response
    # ---------------------------------------------------------

    return {
        "total_applications": total_applications,

        "total_loan_volume": total_loan_volume,

        "approved_count": approved_count,

        "approval_rate": approval_rate,

        "high_risk_count": high_risk_count,

        "high_risk_rate": high_risk_rate,

        "risk_distribution": risk_distribution,

        "approval_trend": approval_trend,

        "average_processing_time": average_processing_time,

        "applications": [
            {
                "application_number":
                    application.application_number,

                "applicant_name":
                    application.applicant_name,

                "loan_type":
                    application.loan_type,

                "loan_amount":
                    application.loan_amount,

                "status":
                    application.status,

                "risk_score":
                    application.risk_score,

                "risk_category":
                    application.risk_category,

                "created_at": (
                    application.created_at.isoformat()
                    if application.created_at
                    else None
                ),
            }
            for application in applications
        ],
    }


@router.get("/{application_number}")
def get_loan_application(
    application_number: str,
    db: Session = Depends(get_db),
):
    application = (
        db.query(LoanApplication)
        .filter(
            LoanApplication.application_number
            == application_number
        )
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Loan application not found",
        )

    return application


@router.post("/{application_number}/risk")
def calculate_application_risk(
    application_number: str,
    db: Session = Depends(get_db),
):
    application = (
        db.query(LoanApplication)
        .filter(
            LoanApplication.application_number
            == application_number
        )
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Loan application not found",
        )

    bank_statement_data = (
        db.query(BankStatementData)
        .join(
            LoanApplication,
            LoanApplication.id == application.id,
        )
        .first()
    )

    salary_data = (
        db.query(SalarySlipData)
        .join(
            Document,
            Document.id == SalarySlipData.document_id,
        )
        .filter(
            Document.loan_application_id
            == application.id
        )
        .order_by(SalarySlipData.id.desc())
        .first()
    )

    

    risk_result = credit_risk_agent.analyze(
        application=application,
        bank_statement_data=bank_statement_data,
    )

    application.risk_score = risk_result["risk_score"]

    application.default_probability = (
        risk_result["default_probability"]
    )

    application.risk_category = (
        risk_result["risk_category"]
    )

    db.commit()
    db.refresh(application)

    return {
        "application_number": application.application_number,
        "risk_assessment": risk_result,
    }


@router.post("/{application_number}/fraud")
def calculate_application_fraud(
    application_number: str,
    db: Session = Depends(get_db),
):
    application = (
        db.query(LoanApplication)
        .filter(
            LoanApplication.application_number
            == application_number
        )
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Loan application not found",
        )

    documents = (
        db.query(Document)
        .filter(
            Document.loan_application_id
            == application.id
        )
        .all()
    )

    bank_statement_data = (
        db.query(BankStatementData)
        .join(
            Document,
            Document.id == BankStatementData.document_id,
        )
        .filter(
            Document.loan_application_id
            == application.id
        )
        .first()
    )

    fraud_result = fraud_detection_agent.analyze(
        documents=documents,
        bank_statement_data=bank_statement_data,
    )

    return {
        "application_number": application.application_number,
        "fraud_assessment": {
            "agent": "Fraud Detection Agent",
            "agent_version": "1.0",
            **fraud_result,
            "next_step": "Policy Compliance Agent",
        },
    }


@router.post("/{application_number}/decision")
def create_underwriting_decision(
    application_number: str,
    decision_data: UnderwritingDecisionCreate,
    db: Session = Depends(get_db),
):
    """
    Execute the complete underwriting workflow.

    The final decision is generated by the deterministic
    underwriting decision engine through the coordinator.

    Client-supplied decision values are not used to
    override the underwriting engine.
    """

    application = (
        db.query(LoanApplication)
        .filter(
            LoanApplication.application_number
            == application_number
        )
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Loan application not found",
        )

    documents = (
        db.query(Document)
        .filter(
            Document.loan_application_id
            == application.id
        )
        .all()
    )

    bank_statement_data = (
        db.query(BankStatementData)
        .join(
            Document,
            Document.id == BankStatementData.document_id,
        )
        .filter(
            Document.loan_application_id
            == application.id
        )
        .first()
    )

    salary_data = (
        db.query(SalarySlipData)
        .join(
            Document,
            Document.id == SalarySlipData.document_id,
        )
        .filter(
            Document.loan_application_id
            == application.id
        )
        .order_by(SalarySlipData.id.desc())
        .first()
    )

    result = underwriting_coordinator_agent.analyze(
        application=application,
        documents=documents,
        salary_data=salary_data,
        bank_statement_data=bank_statement_data,
        db=db,
    )

    final_decision = result.get(
        "final_decision",
        "Pending",
    )

    application.status = final_decision

    db.commit()
    db.refresh(application)

    return {
        "application_number": application.application_number,

        "workflow_status": result.get(
            "workflow_status"
        ),

        "decision": result.get(
            "final_decision"
        ),

        "decision_status": result.get(
            "decision_status"
        ),

        "policy_version": result.get(
            "policy_version"
        ),

        "reason_codes": result.get(
            "reason_codes",
            [],
        ),

        "reasons": result.get(
            "reasons",
            [],
        ),

        "risk_category": result.get(
            "risk_category"
        ),

        "risk_score": result.get(
            "risk_score"
        ),

        "default_probability": result.get(
            "default_probability"
        ),

        "fraud_category": result.get(
            "fraud_category"
        ),

        "fraud_score": result.get(
            "fraud_score"
        ),

        "compliance_status": result.get(
            "compliance_status"
        ),

        "income_status": result.get(
            "income_status"
        ),

        "audit_status": result.get(
            "audit_status"
        ),

        "executive_report": result.get(
            "executive_report"
        ),

        "notification_status": result.get(
            "notification_status"
        ),

        "copilot_status": result.get(
            "copilot_status"
        ),

        "copilot_result": result.get(
    "copilot_result"
),

        "next_step": result.get(
            "next_step"
        ),

        "persistence": result.get(
            "persistence"
        ),
    }


@router.get("/{application_number}/decisions")
def get_underwriting_decisions(
    application_number: str,
    db: Session = Depends(get_db),
):
    application = (
        db.query(LoanApplication)
        .filter(
            LoanApplication.application_number
            == application_number
        )
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Loan application not found",
        )

    decision = (
        db.query(UnderwritingDecision)
        .filter(
            UnderwritingDecision.application_id
            == application.id
        )
        .order_by(
            UnderwritingDecision.created_at.desc()
        )
        .first()
    )

    decisions = [decision] if decision else []

    return decisions


@router.post("/{application_number}/copilot")
def ask_ai_copilot(
    application_number: str,
    question: str,
    db: Session = Depends(get_db),
):
    """
    Ask the AI Copilot about a specific loan application.

    The Copilot uses its agentic tool layer to dynamically retrieve
    the information required to answer the user's question.

    Available information sources include:
    - Application data
    - Latest underwriting decision
    - Risk assessment
    - Fraud assessment
    - Compliance assessment
    - Income verification
    - Document and OCR status
    - Decision history
    - Retrieved policy evidence through RAG
    """

    application = (
        db.query(LoanApplication)
        .filter(
            LoanApplication.application_number
            == application_number
        )
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Loan application not found",
        )

    if not question or not question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question is required",
        )

    result = ai_copilot_agent.analyze(
        application=application,
        question=question.strip(),
        underwriting_context=None,
    )

    return result