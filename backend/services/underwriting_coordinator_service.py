from typing import Any


def build_underwriting_workflow_result(
    application: Any,
    income_result: dict[str, Any],
    risk_result: dict[str, Any],
    fraud_result: dict[str, Any],
    compliance_result: dict[str, Any],
    decision_result: dict[str, Any],
    audit_result: dict[str, Any],
    notification_result: dict[str, Any],
) -> dict[str, Any]:
    """
    Aggregate the results produced by the underwriting agents.

    This service does not independently calculate risk,
    fraud, compliance, or loan decisions.
    It coordinates and preserves the outputs of
    downstream underwriting agents.
    """

    workflow_status = "Completed"

    critical_failures = []

    if income_result.get("verification_status") == "Failed":
        critical_failures.append(
            "Income verification failed."
        )

    if compliance_result.get("compliance_status") == "Non-Compliant":
        critical_failures.append(
            "Policy compliance failed."
        )

    if decision_result.get("decision") == "Rejected":
        workflow_status = "Completed"

    if critical_failures:
        workflow_status = "Manual Review"

    return {
        "application_id": int(application.id),
        "application_number": str(
            application.application_number
        ),
        "workflow_status": workflow_status,
        "final_decision": decision_result.get(
            "decision"
        ),
        "decision_status": decision_result.get(
            "decision_status"
        ),
        "risk_category": risk_result.get(
            "risk_category"
        ),
        "risk_score": risk_result.get(
            "risk_score"
        ),
        "fraud_category": fraud_result.get(
            "fraud_category"
        ),
        "fraud_score": fraud_result.get(
            "fraud_score"
        ),
        "compliance_status": compliance_result.get(
            "compliance_status"
        ),
        "income_status": income_result.get(
            "verification_status"
        ),
        "audit_status": audit_result.get(
            "audit_status"
        ),
        "notification_status": notification_result.get(
            "notification_status"
        ),
        "critical_failures": critical_failures,
        "agent_results": {
            "income_verification": income_result,
            "credit_risk": risk_result,
            "fraud_detection": fraud_result,
            "policy_compliance": compliance_result,
            "loan_decision": decision_result,
            "underwriting_audit": audit_result,
            "notification": notification_result,
        },
        "next_step": notification_result.get(
            "next_step",
            "Workflow Completed",
        ),
    }