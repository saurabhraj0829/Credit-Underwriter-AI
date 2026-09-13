from typing import Any


POLICY_VERSION = "1.0"


def make_loan_decision(
    risk_result: dict[str, Any],
    fraud_result: dict[str, Any],
    compliance_result: dict[str, Any],
    income_result: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Deterministic underwriting decision engine.

    The LLM does not make the final lending decision.
    This service applies configured underwriting rules
    and produces an auditable decision trace.
    """

    reasons: list[str] = []
    reason_codes: list[str] = []

    risk_category = risk_result.get(
        "risk_category"
    )

    risk_score = risk_result.get(
        "risk_score"
    )

    fraud_category = fraud_result.get(
        "fraud_category"
    )

    fraud_score = fraud_result.get(
        "fraud_score"
    )

    compliance_status = compliance_result.get(
        "compliance_status"
    )

    failed_checks = compliance_result.get(
        "failed_checks",
        0,
    )

    warning_checks = compliance_result.get(
        "warning_checks",
        0,
    )

    income_status = (
        income_result.get("verification_status")
        if income_result
        else None
    )

    # --------------------------------------------------
    # 1. Hard rejection conditions
    # --------------------------------------------------

    if failed_checks > 0:
        reason_codes.append(
            "MANDATORY_POLICY_FAILURE"
        )

        reasons.append(
            "One or more mandatory policy checks failed."
        )

        return {
            "decision": "Rejected",
            "decision_status": "Final",
            "policy_version": POLICY_VERSION,
            "reason_codes": reason_codes,
            "reasons": reasons,
            "risk_score": risk_score,
            "risk_category": risk_category,
            "fraud_score": fraud_score,
            "fraud_category": fraud_category,
            "compliance_status": compliance_status,
            "failed_checks": failed_checks,
            "warning_checks": warning_checks,
            "income_status": income_status,
            "next_step": "Decision Review",
        }

    if fraud_category == "High":
        reason_codes.append(
            "HIGH_FRAUD_RISK"
        )

        reasons.append(
            "High fraud risk detected."
        )

        return {
            "decision": "Rejected",
            "decision_status": "Final",
            "policy_version": POLICY_VERSION,
            "reason_codes": reason_codes,
            "reasons": reasons,
            "risk_score": risk_score,
            "risk_category": risk_category,
            "fraud_score": fraud_score,
            "fraud_category": fraud_category,
            "compliance_status": compliance_status,
            "failed_checks": failed_checks,
            "warning_checks": warning_checks,
            "income_status": income_status,
            "next_step": "Decision Review",
        }

    # --------------------------------------------------
    # 2. Manual review conditions
    # --------------------------------------------------

    if risk_category == "High":
        reason_codes.append(
            "HIGH_CREDIT_RISK"
        )

        reasons.append(
            "Application is classified as High Risk."
        )

    if fraud_category == "Medium":
        reason_codes.append(
            "MEDIUM_FRAUD_RISK"
        )

        reasons.append(
            "Application has Medium Fraud Risk."
        )

    if compliance_status == "Review Required":
        reason_codes.append(
            "POLICY_WARNING"
        )

        reasons.append(
            "Policy compliance requires manual review."
        )

    if warning_checks > 0:
        reason_codes.append(
            "POLICY_CHECK_WARNING"
        )

        reasons.append(
            "One or more policy checks generated warnings."
        )

    if income_status in {
        "Warning",
        "Failed",
    }:
        reason_codes.append(
            "INCOME_VERIFICATION_REVIEW"
        )

        reasons.append(
            "Income verification requires additional review."
        )

    if (
        risk_category == "High"
        or fraud_category == "Medium"
        or compliance_status == "Review Required"
        or income_status in {
            "Warning",
            "Failed",
        }
    ):
        return {
            "decision": "Manual Review",
            "decision_status": "Pending Review",
            "policy_version": POLICY_VERSION,
            "reason_codes": reason_codes,
            "reasons": reasons,
            "risk_score": risk_score,
            "risk_category": risk_category,
            "fraud_score": fraud_score,
            "fraud_category": fraud_category,
            "compliance_status": compliance_status,
            "failed_checks": failed_checks,
            "warning_checks": warning_checks,
            "income_status": income_status,
            "next_step": "Human Underwriter Review",
        }

    # --------------------------------------------------
    # 3. Approval
    # --------------------------------------------------

    if (
        risk_category == "Low"
        and fraud_category == "Low"
        and compliance_status == "Compliant"
        and income_status in {
            None,
            "Verified",
        }
    ):
        reason_codes.append(
            "APPROVAL_CRITERIA_MET"
        )

        reasons.append(
            "Application passed risk, fraud, compliance, "
            "and income verification."
        )

        return {
            "decision": "Approved",
            "decision_status": "Final",
            "policy_version": POLICY_VERSION,
            "reason_codes": reason_codes,
            "reasons": reasons,
            "risk_score": risk_score,
            "risk_category": risk_category,
            "fraud_score": fraud_score,
            "fraud_category": fraud_category,
            "compliance_status": compliance_status,
            "failed_checks": failed_checks,
            "warning_checks": warning_checks,
            "income_status": income_status,
            "next_step": "Generate Underwriting Record",
        }

    # --------------------------------------------------
    # 4. Conservative fallback
    # --------------------------------------------------

    reason_codes.append(
        "ADDITIONAL_UNDERWRITING_REVIEW"
    )

    reasons.append(
        "Application requires additional underwriting review."
    )

    return {
        "decision": "Manual Review",
        "decision_status": "Pending Review",
        "policy_version": POLICY_VERSION,
        "reason_codes": reason_codes,
        "reasons": reasons,
        "risk_score": risk_score,
        "risk_category": risk_category,
        "fraud_score": fraud_score,
        "fraud_category": fraud_category,
        "compliance_status": compliance_status,
        "failed_checks": failed_checks,
        "warning_checks": warning_checks,
        "income_status": income_status,
        "next_step": "Human Underwriter Review",
    }