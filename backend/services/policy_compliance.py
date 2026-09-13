from typing import Any


def check_policy_compliance(
    application: Any,
    risk_result: dict | None = None,
    fraud_result: dict | None = None,
    income_result: dict | None = None,
) -> dict:
    """
    Evaluate loan application against basic underwriting
    policy rules.
    """

    checks = []
    violations = []

    loan_amount = float(application.loan_amount or 0)
    annual_income = float(application.annual_income or 0)

    credit_score = application.credit_score
    employment_years = application.employment_years
    dti = application.debt_to_income_ratio

    # --------------------------------------------------
    # 1. Loan amount validity
    # --------------------------------------------------

    if loan_amount <= 0:
        checks.append({
            "check": "Loan amount validity",
            "status": "Failed",
            "details": "Loan amount must be greater than zero.",
        })

        violations.append(
            "Invalid loan amount."
        )

    else:
        checks.append({
            "check": "Loan amount validity",
            "status": "Passed",
            "details": (
                f"Loan amount recorded as {loan_amount:.2f}."
            ),
        })

    # --------------------------------------------------
    # 2. Annual income validity
    # --------------------------------------------------

    if annual_income <= 0:
        checks.append({
            "check": "Annual income availability",
            "status": "Failed",
            "details": "Annual income is missing or invalid.",
        })

        violations.append(
            "Annual income is missing or invalid."
        )

    else:
        checks.append({
            "check": "Annual income availability",
            "status": "Passed",
            "details": (
                f"Annual income recorded as "
                f"{annual_income:.2f}."
            ),
        })

    # --------------------------------------------------
    # 3. Credit score policy
    # --------------------------------------------------

    if credit_score is None:
        checks.append({
            "check": "Credit score policy",
            "status": "Warning",
            "details": "Credit score is not available.",
        })

    elif credit_score < 580:
        checks.append({
            "check": "Credit score policy",
            "status": "Failed",
            "details": (
                f"Credit score {credit_score} is below "
                f"the minimum policy threshold of 580."
            ),
        })

        violations.append(
            "Credit score is below the minimum threshold."
        )

    else:
        checks.append({
            "check": "Credit score policy",
            "status": "Passed",
            "details": (
                f"Credit score {credit_score} satisfies "
                f"the minimum threshold."
            ),
        })

    # --------------------------------------------------
    # 4. Debt-to-income policy
    # --------------------------------------------------

    if dti is None:
        checks.append({
            "check": "Debt-to-income policy",
            "status": "Warning",
            "details": "Debt-to-income ratio is not available.",
        })

    elif dti > 0.50:
        checks.append({
            "check": "Debt-to-income policy",
            "status": "Failed",
            "details": (
                f"Debt-to-income ratio {dti:.2f} exceeds "
                f"the maximum policy threshold of 0.50."
            ),
        })

        violations.append(
            "Debt-to-income ratio exceeds policy threshold."
        )

    else:
        checks.append({
            "check": "Debt-to-income policy",
            "status": "Passed",
            "details": (
                f"Debt-to-income ratio {dti:.2f} "
                f"is within policy limits."
            ),
        })

    # --------------------------------------------------
    # 5. Employment stability
    # --------------------------------------------------

    if employment_years is None:
        checks.append({
            "check": "Employment stability",
            "status": "Warning",
            "details": "Employment history is not available.",
        })

    elif employment_years < 1:
        checks.append({
            "check": "Employment stability",
            "status": "Warning",
            "details": (
                f"Employment duration is only "
                f"{employment_years:.2f} years."
            ),
        })

    else:
        checks.append({
            "check": "Employment stability",
            "status": "Passed",
            "details": (
                f"Employment duration is "
                f"{employment_years:.2f} years."
            ),
        })

    # --------------------------------------------------
    # 6. Risk policy
    # --------------------------------------------------

    if risk_result:
        risk_category = risk_result.get(
            "risk_category"
        )

        if risk_category == "High":
            checks.append({
                "check": "Credit risk policy",
                "status": "Failed",
                "details": (
                    "Application has been classified "
                    "as High Risk."
                ),
            })

            violations.append(
                "Application is classified as High Risk."
            )

        elif risk_category == "Medium":
            checks.append({
                "check": "Credit risk policy",
                "status": "Warning",
                "details": (
                    "Application is classified "
                    "as Medium Risk."
                ),
            })

        else:
            checks.append({
                "check": "Credit risk policy",
                "status": "Passed",
                "details": (
                    "Application is classified "
                    "as Low Risk."
                ),
            })

    # --------------------------------------------------
    # 7. Fraud policy
    # --------------------------------------------------

    if fraud_result:
        fraud_category = fraud_result.get(
            "fraud_category"
        )

        if fraud_category == "High":
            checks.append({
                "check": "Fraud policy",
                "status": "Failed",
                "details": (
                    "Application has been classified "
                    "as High Fraud Risk."
                ),
            })

            violations.append(
                "High fraud risk detected."
            )

        elif fraud_category == "Medium":
            checks.append({
                "check": "Fraud policy",
                "status": "Warning",
                "details": (
                    "Application has been classified "
                    "as Medium Fraud Risk."
                ),
            })

        else:
            checks.append({
                "check": "Fraud policy",
                "status": "Passed",
                "details": (
                    "No significant fraud risk detected."
                ),
            })

    # --------------------------------------------------
    # 8. Income verification policy
    # --------------------------------------------------

    if income_result:
        income_status = income_result.get(
            "verification_status"
        )

        if income_status == "Failed":
            checks.append({
                "check": "Income verification policy",
                "status": "Failed",
                "details": (
                    "Income verification failed."
                ),
            })

            violations.append(
                "Income verification failed."
            )

        elif income_status == "Warning":
            checks.append({
                "check": "Income verification policy",
                "status": "Warning",
                "details": (
                    "Income verification requires "
                    "additional review."
                ),
            })

        else:
            checks.append({
                "check": "Income verification policy",
                "status": "Passed",
                "details": (
                    "Income verification passed."
                ),
            })

    # --------------------------------------------------
    # Overall compliance status
    # --------------------------------------------------

    failed_checks = sum(
        1
        for check in checks
        if check["status"] == "Failed"
    )

    warning_checks = sum(
        1
        for check in checks
        if check["status"] == "Warning"
    )

    if failed_checks > 0:
        overall_status = "Non-Compliant"
        next_step = "Manual Review"

    elif warning_checks > 0:
        overall_status = "Review Required"
        next_step = "Manual Review"

    else:
        overall_status = "Compliant"
        next_step = "Loan Decision Agent"

    return {
        "status": overall_status,
        "compliance_status": overall_status,
        "checks": checks,
        "violations": violations,
        "failed_checks": failed_checks,
        "warning_checks": warning_checks,
        "next_step": next_step,
    }