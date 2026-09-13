from typing import Any

from langchain.tools import tool
from sqlalchemy.orm import Session

from backend.database.database import SessionLocal
from backend.models.loan_application import LoanApplication
from backend.models.underwriting_decision import (
    UnderwritingDecision,
)
from backend.models.document import Document
from backend.ai.rag.rag_service import rag_service
from backend.ai.agents.fraud_detection_agent import fraud_detection_agent


def get_application_details(
    db: Session,
    application_number: str,
) -> dict[str, Any]:
    """
    Retrieve basic details for a loan application.

    This function is read-only.
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
        return {
            "status": "Not Found",
            "application_number": application_number,
            "message": "Loan application not found.",
        }

    return {
        "status": "Found",
        "application_number": str(
            application.application_number
        ),
        "applicant_name": getattr(
            application,
            "applicant_name",
            None,
        ),
        "loan_type": getattr(
            application,
            "loan_type",
            None,
        ),
        "loan_amount": getattr(
            application,
            "loan_amount",
            None,
        ),
        "annual_income": getattr(
            application,
            "annual_income",
            None,
        ),
        "credit_score": getattr(
            application,
            "credit_score",
            None,
        ),
        "debt_to_income_ratio": getattr(
            application,
            "debt_to_income_ratio",
            None,
        ),
        "employment_years": getattr(
            application,
            "employment_years",
            None,
        ),
        "risk_score": getattr(
            application,
            "risk_score",
            None,
        ),
        "default_probability": getattr(
            application,
            "default_probability",
            None,
        ),
        "risk_category": getattr(
            application,
            "risk_category",
            None,
        ),
        "status": getattr(
            application,
            "status",
            None,
        ),
    }


def get_latest_underwriting_decision(
    db: Session,
    application_number: str,
) -> dict[str, Any]:
    """
    Retrieve the latest persisted underwriting decision
    for a loan application.

    This function is read-only.
    """

    decision = (
        db.query(UnderwritingDecision)
        .filter(
            UnderwritingDecision.application_number
            == application_number
        )
        .order_by(
            UnderwritingDecision.created_at.desc()
        )
        .first()
    )

    if decision is None:
        return {
            "status": "Not Found",
            "application_number": application_number,
            "message": (
                "No persisted underwriting decision "
                "was found for this application."
            ),
        }

    return {
        "status": "Found",
        "application_number": str(
            decision.application_number
        ),
        "decision": decision.decision,
        "decision_status": decision.decision_status,
        "risk_score": decision.risk_score,
        "risk_category": decision.risk_category,
        "default_probability": (
            decision.default_probability
        ),
        "fraud_score": decision.fraud_score,
        "fraud_category": decision.fraud_category,
        "compliance_status": (
            decision.compliance_status
        ),
        "failed_checks": decision.failed_checks,
        "warning_checks": decision.warning_checks,
        "income_status": decision.income_status,
        "reason_codes": decision.reason_codes,
        "reasons": decision.reasons,
        "policy_version": decision.policy_version,
        "next_step": decision.next_step,
        "created_at": (
            decision.created_at.isoformat()
            if decision.created_at
            else None
        ),
    }


@tool
def application_details_tool(
    application_number: str,
) -> dict[str, Any]:
    """
    Retrieve the basic details of a loan application.

    Use this tool when the user asks about:
    applicant information, loan amount, loan type,
    income, credit score, employment, DTI, or
    current application status.

    This tool is read-only and does not modify
    the application.
    """

    db = SessionLocal()

    try:
        return get_application_details(
            db=db,
            application_number=application_number,
        )
    finally:
        db.close()


@tool
def latest_underwriting_decision_tool(
    application_number: str,
) -> dict[str, Any]:
    """
    Retrieve the latest persisted underwriting
    decision for a loan application.

    Use this tool when the user asks about:
    loan decision, decision status, risk,
    fraud, compliance, income verification,
    reason codes, policy version, or next step.

    This tool is read-only and does not modify
    the underwriting decision.
    """

    db = SessionLocal()

    try:
        return get_latest_underwriting_decision(
            db=db,
            application_number=application_number,
        )
    finally:
        db.close()

@tool
def latest_underwriting_decision_tool(
    application_number: str,
) -> dict[str, Any]:
    """
    Retrieve the latest persisted underwriting
    decision for a loan application.

    Use this tool when the user asks about:
    loan decision, decision status, risk,
    fraud, compliance, income verification,
    reason codes, policy version, or next step.

    This tool is read-only and does not modify
    the underwriting decision.
    """

    db = SessionLocal()

    try:
        return get_latest_underwriting_decision(
            db=db,
            application_number=application_number,
        )
    finally:
        db.close()


@tool
def risk_assessment_tool(
    application_number: str,
) -> dict[str, Any]:
    """
    Retrieve the current credit risk assessment
    for a loan application.

    Use this tool when the user asks about:
    credit risk, risk score, risk category,
    default probability, or why an application
    has a particular risk level.

    This tool is read-only.
    It does not modify the application or
    underwriting decision.
    """

    db = SessionLocal()

    try:
        application = (
            db.query(LoanApplication)
            .filter(
                LoanApplication.application_number
                == application_number
            )
            .first()
        )

        if application is None:
            return {
                "status": "Not Found",
                "application_number": application_number,
                "message": "Loan application not found.",
            }

        return {
            "status": "Found",
            "application_number": application_number,
            "risk_score": application.risk_score,
            "risk_category": application.risk_category,
            "default_probability": application.default_probability,
            "credit_score": application.credit_score,
            "debt_to_income_ratio": application.debt_to_income_ratio,
        }

    finally:
        db.close()


@tool
def fraud_assessment_tool(application_number: str) -> dict[str, Any]:
    """
    Run the existing fraud detection engine for a loan application.

    Returns the fraud score, category, recommendation, detailed fraud
    signals, explainable reasons, and document coverage.
    """
    db = SessionLocal()

    try:
        application = (
            db.query(LoanApplication)
            .filter(
                LoanApplication.application_number == application_number
            )
            .first()
        )

        if application is None:
            return {
                "status": "Not Found",
                "application_number": application_number,
                "message": "Loan application not found.",
            }

        documents = (
    db.query(Document)
    .filter(
        Document.loan_application_id == application.id
    )
    .order_by(Document.id.asc())
    .all()
)

        fraud_result = fraud_detection_agent.analyze(
            documents=documents,
            bank_statement_data=None,
        )

        latest_decision = (
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

        return {
            "status": "Found",
            "application_number": application_number,
            "fraud_score": fraud_result.get("fraud_score"),
            "fraud_category": fraud_result.get("fraud_category"),
            "recommendation": fraud_result.get("recommendation"),
            "signals": fraud_result.get("signals", []),
            "reasons": fraud_result.get("reasons", []),
            "documents_analyzed": fraud_result.get(
                "documents_analyzed",
                len(documents),
            ),
            "model_status": fraud_result.get(
                "model_status",
                "Rule-Based Fraud Engine",
            ),
            "decision": (
                latest_decision.decision
                if latest_decision
                else None
            ),
            "decision_status": (
                latest_decision.decision_status
                if latest_decision
                else None
            ),
            "next_step": (
                latest_decision.next_step
                if latest_decision
                else None
            ),
        }

    finally:
        db.close()

@tool
def compliance_assessment_tool(
    application_number: str,
) -> dict[str, Any]:
    """
    Retrieve the latest compliance assessment
    for a loan application.

    Use this tool when the user asks about:
    policy compliance, compliance status,
    failed checks, warning checks, policy warnings,
    or compliance-related underwriting findings.

    This tool is read-only.
    It does not modify the application
    or underwriting decision.
    """

    db = SessionLocal()

    try:
        decision = (
            db.query(UnderwritingDecision)
            .filter(
                UnderwritingDecision.application_number
                == application_number
            )
            .order_by(
                UnderwritingDecision.created_at.desc()
            )
            .first()
        )

        if decision is None:
            return {
                "status": "Not Found",
                "application_number": application_number,
                "message": (
                    "No persisted underwriting decision "
                    "was found for this application."
                ),
            }

        return {
            "status": "Found",
            "application_number": application_number,
            "compliance_status": (
                decision.compliance_status
            ),
            "failed_checks": decision.failed_checks,
            "warning_checks": decision.warning_checks,
            "reason_codes": decision.reason_codes,
            "reasons": decision.reasons,
            "policy_version": decision.policy_version,
            "decision": decision.decision,
            "decision_status": decision.decision_status,
            "next_step": decision.next_step,
        }

    finally:
        db.close()

@tool
def income_verification_tool(
    application_number: str,
) -> dict[str, Any]:
    """
    Retrieve the latest income verification assessment
    for a loan application.

    Use this tool when the user asks about:
    income verification, income status, salary verification,
    income review, or whether reported income was verified.

    This tool is read-only.
    It does not modify the application
    or underwriting decision.
    """

    db = SessionLocal()

    try:
        decision = (
            db.query(UnderwritingDecision)
            .filter(
                UnderwritingDecision.application_number
                == application_number
            )
            .order_by(
                UnderwritingDecision.created_at.desc()
            )
            .first()
        )

        if decision is None:
            return {
                "status": "Not Found",
                "application_number": application_number,
                "message": (
                    "No persisted underwriting decision "
                    "was found for this application."
                ),
            }

        return {
            "status": "Found",
            "application_number": application_number,
            "income_status": decision.income_status,
            "reason_codes": decision.reason_codes,
            "reasons": decision.reasons,
            "decision": decision.decision,
            "decision_status": decision.decision_status,
            "next_step": decision.next_step,
        }

    finally:
        db.close()

@tool
def document_ocr_tool(
    application_number: str,
) -> dict[str, Any]:
    """
    Retrieve document and OCR information
    for a loan application.

    Use this tool when the user asks about:
    uploaded documents, document count,
    document names, OCR status, extracted text,
    or document verification information.

    This tool is read-only.
    It does not modify documents or
    underwriting data.
    """

    db = SessionLocal()

    try:
        application = (
            db.query(LoanApplication)
            .filter(
                LoanApplication.application_number
                == application_number
            )
            .first()
        )

        if application is None:
            return {
                "status": "Not Found",
                "application_number": application_number,
                "message": "Loan application not found.",
            }

        documents = (
            db.query(Document)
            .filter(
                Document.loan_application_id
                == application.id
            )
            .all()
        )

        if not documents:
            return {
                "status": "No Documents",
                "application_number": application_number,
                "document_count": 0,
                "documents": [],
                "message": (
                    "No documents were found "
                    "for this application."
                ),
            }

        document_results = []

        for document in documents:
            document_results.append(
                {
                    "document_id": document.id,
                    "document_type": document.document_type,
                    "original_filename": (
                        document.original_filename
                    ),
                    "upload_status": (
                        document.upload_status
                    ),
                    "ocr_status": document.ocr_status,
                    "verification_status": (
                        document.verification_status
                    ),
                    "extracted_text_available": (
                        bool(document.extracted_text)
                    ),
                }
            )

        return {
            "status": "Found",
            "application_number": application_number,
            "document_count": len(document_results),
            "documents": document_results,
        }

    finally:
        db.close()

@tool
def decision_history_tool(application_number: str) -> dict[str, Any]:
    """
    Retrieve historical underwriting decisions for a loan application.

    This is a read-only tool. It does not modify any underwriting data.
    """

    db = SessionLocal()

    try:
        application = (
            db.query(LoanApplication)
            .filter(
                LoanApplication.application_number
                == application_number
            )
            .first()
        )

        if not application:
            return {
                "status": "Not Found",
                "application_number": application_number,
                "message": "Loan application was not found.",
            }

        decisions = (
            db.query(UnderwritingDecision)
            .filter(
                UnderwritingDecision.application_id
                == application.id
            )
            .order_by(
                UnderwritingDecision.created_at.desc()
            )
            .all()
        )

        if not decisions:
            return {
                "status": "No History",
                "application_number": application_number,
                "decision_count": 0,
                "decisions": [],
            }

        history = []

        for decision in decisions:
            history.append(
                {
                    "decision_id": decision.id,
                    "decision": decision.decision,
                    "decision_status": decision.decision_status,
                    "risk_score": decision.risk_score,
                    "risk_category": decision.risk_category,
                    "default_probability": decision.default_probability,
                    "fraud_score": decision.fraud_score,
                    "fraud_category": decision.fraud_category,
                    "compliance_status": decision.compliance_status,
                    "income_status": decision.income_status,
                    "failed_checks": decision.failed_checks,
                    "warning_checks": decision.warning_checks,
                    "reason_codes": decision.reason_codes,
                    "reasons": decision.reasons,
                    "policy_version": decision.policy_version,
                    "next_step": decision.next_step,
                    "created_at": (
                        decision.created_at.isoformat()
                        if decision.created_at
                        else None
                    ),
                }
            )

        return {
            "status": "Found",
            "application_number": application_number,
            "decision_count": len(history),
            "decisions": history,
        }

    except Exception as exc:
        return {
            "status": "Error",
            "application_number": application_number,
            "message": str(exc),
        }

    finally:
        db.close()

@tool
def policy_rag_tool(query: str) -> dict[str, Any]:
    """
    Retrieve relevant credit underwriting policy evidence
    from the RAG knowledge base.

    This is a read-only tool. It does not modify any
    application or underwriting decision.
    """

    try:
        rag_result = rag_service.retrieve(
            query=query,
            top_k=5,
        )

        results = rag_result.get("results", [])

        evidence = []

        for result in results:
            evidence.append(
                {
                    "document_id": result.get("document_id"),
                    "category": result.get("category"),
                    "source": result.get("source"),
                    "chunk_index": result.get("chunk_index"),
                    "relevance_score": result.get(
                        "relevance_score"
                    ),
                    "content": result.get("content"),
                }
            )

        return {
            "status": rag_result.get("status"),
            "query": query,
            "evidence_available": rag_result.get(
                "evidence_available",
                False,
            ),
            "evidence_count": len(evidence),
            "relevance_threshold": rag_result.get(
                "relevance_threshold"
            ),
            "evidence": evidence,
        }

    except Exception as exc:
        return {
            "status": "Error",
            "query": query,
            "evidence_available": False,
            "evidence_count": 0,
            "evidence": [],
            "message": str(exc),
        }
