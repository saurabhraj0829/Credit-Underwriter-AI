from typing import Any


def build_underwriting_audit(
    application: Any,
    income_result: dict[str, Any],
    risk_result: dict[str, Any],
    fraud_result: dict[str, Any],
    compliance_result: dict[str, Any],
    decision_result: dict[str, Any],
) -> dict[str, Any]:
    """
    Build an explainable underwriting audit trail from
    all major agent results.
    """

    evidence: list[dict[str, Any]] = []
    concerns: list[str] = []
    positive_factors: list[str] = []

    # --------------------------------------------------
    # 1. Income Verification
    # --------------------------------------------------

    income_status = income_result.get(
        "verification_status"
    )

    gross_income = income_result.get(
        "gross_income"
    )

    net_income = income_result.get(
        "net_income"
    )

    income_difference = income_result.get(
        "income_difference"
    )

    evidence.append({
        "agent": "Income Verification Agent",
        "status": income_status,
        "gross_income": gross_income,
        "net_income": net_income,
        "bank_salary_credits": income_result.get(
            "total_bank_salary_credits"
        ),
        "income_difference": income_difference,
    })

    if income_status == "Verified":
        positive_factors.append(
            "Income information passed verification."
        )
    elif income_status == "Warning":
        concerns.append(
            "Income verification requires additional review."
        )
    elif income_status == "Failed":
        concerns.append(
            "Income verification failed."
        )

    # --------------------------------------------------
    # 2. Credit Risk
    # --------------------------------------------------

    risk_category = risk_result.get(
        "risk_category"
    )

    risk_score = risk_result.get(
        "risk_score"
    )

    default_probability = risk_result.get(
        "default_probability"
    )

    evidence.append({
        "agent": "Credit Risk Agent",
        "status": risk_result.get(
            "risk_assessment_status"
        ),
        "risk_score": risk_score,
        "risk_category": risk_category,
        "default_probability": default_probability,
    })

    if risk_category == "Low":
        positive_factors.append(
            "Application is classified as Low Credit Risk."
        )
    elif risk_category == "Medium":
        concerns.append(
            "Application is classified as Medium Credit Risk."
        )
    elif risk_category == "High":
        concerns.append(
            "Application is classified as High Credit Risk."
        )

    # --------------------------------------------------
    # 3. Fraud Detection
    # --------------------------------------------------

    fraud_category = fraud_result.get(
        "fraud_category"
    )

    fraud_score = fraud_result.get(
        "fraud_score"
    )

    evidence.append({
        "agent": "Fraud Detection Agent",
        "status": fraud_category,
        "fraud_score": fraud_score,
        "signals": fraud_result.get(
            "signals",
            []
        ),
    })

    if fraud_category == "Low":
        positive_factors.append(
            "No significant fraud risk was detected."
        )
    elif fraud_category == "Medium":
        concerns.append(
            "Medium fraud risk requires review."
        )
    elif fraud_category == "High":
        concerns.append(
            "High fraud risk was detected."
        )

    # --------------------------------------------------
    # 4. Policy Compliance
    # --------------------------------------------------

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

    evidence.append({
        "agent": "Policy Compliance Agent",
        "status": compliance_status,
        "failed_checks": failed_checks,
        "warning_checks": warning_checks,
        "violations": compliance_result.get(
            "violations",
            []
        ),
    })

    if compliance_status == "Compliant":
        positive_factors.append(
            "Application passed policy compliance checks."
        )
    elif compliance_status == "Review Required":
        concerns.append(
            "Policy compliance requires manual review."
        )
    elif compliance_status == "Non-Compliant":
        concerns.append(
            "Application has policy compliance violations."
        )

    # --------------------------------------------------
    # 5. Final Decision
    # --------------------------------------------------

    decision = decision_result.get(
        "decision"
    )

    decision_status = decision_result.get(
        "decision_status"
    )

    evidence.append({
        "agent": "Loan Decision Agent",
        "decision": decision,
        "decision_status": decision_status,
        "next_step": decision_result.get(
            "next_step"
        ),
    })

    # --------------------------------------------------
    # 6. Build explanation
    # --------------------------------------------------

    if decision == "Approved":
        summary = (
            "The application was approved because "
            "the available income, risk, fraud, and "
            "policy checks satisfied the configured "
            "underwriting criteria."
        )

    elif decision == "Rejected":
        summary = (
            "The application was rejected because "
            "one or more mandatory underwriting "
            "conditions were not satisfied."
        )

    else:
        summary = (
            "The application was routed to manual "
            "review because one or more underwriting "
            "signals require additional assessment."
        )

    return {
        "application_id": int(
            application.id
        ),
        "application_number": str(
            application.application_number
        ),
        "applicant_name": str(
            application.applicant_name
        ),
        "loan_type": str(
            application.loan_type
        ),
        "loan_amount": float(
            application.loan_amount
        ),
        "final_decision": decision,
        "decision_status": decision_status,
        "summary": summary,
        "positive_factors": positive_factors,
        "concerns": concerns,
        "evidence": evidence,
        "audit_status": "Completed",
    }