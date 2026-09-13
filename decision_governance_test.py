from backend.services.loan_decision import make_loan_decision

cases = [
    (
        "APPROVED",
        {
            "risk_category": "Low",
            "risk_score": 15,
            "fraud_category": "Low",
            "fraud_score": 5,
            "compliance_status": "Compliant",
            "failed_checks": 0,
            "warning_checks": 0,
            "income_status": "Verified",
        },
    ),
    (
        "MANUAL REVIEW",
        {
            "risk_category": "Medium",
            "risk_score": 36,
            "fraud_category": "Low",
            "fraud_score": 5,
            "compliance_status": "Review Required",
            "failed_checks": 0,
            "warning_checks": 1,
            "income_status": "Verified",
        },
    ),
    (
        "REJECTED POLICY",
        {
            "risk_category": "Low",
            "risk_score": 10,
            "fraud_category": "Low",
            "fraud_score": 3,
            "compliance_status": "Non-Compliant",
            "failed_checks": 1,
            "warning_checks": 0,
            "income_status": "Verified",
        },
    ),
    (
        "HIGH CREDIT RISK",
        {
            "risk_category": "High",
            "risk_score": 75,
            "fraud_category": "Low",
            "fraud_score": 5,
            "compliance_status": "Compliant",
            "failed_checks": 0,
            "warning_checks": 0,
            "income_status": "Verified",
        },
    ),
    (
        "MEDIUM FRAUD",
        {
            "risk_category": "Low",
            "risk_score": 15,
            "fraud_category": "Medium",
            "fraud_score": 45,
            "compliance_status": "Compliant",
            "failed_checks": 0,
            "warning_checks": 0,
            "income_status": "Verified",
        },
    ),
    (
        "HIGH FRAUD",
        {
            "risk_category": "Low",
            "risk_score": 15,
            "fraud_category": "High",
            "fraud_score": 85,
            "compliance_status": "Compliant",
            "failed_checks": 0,
            "warning_checks": 0,
            "income_status": "Verified",
        },
    ),
    (
        "INCOME WARNING",
        {
            "risk_category": "Low",
            "risk_score": 15,
            "fraud_category": "Low",
            "fraud_score": 5,
            "compliance_status": "Compliant",
            "failed_checks": 0,
            "warning_checks": 0,
            "income_status": "Warning",
        },
    ),
    (
        "INCOME FAILED",
        {
            "risk_category": "Low",
            "risk_score": 15,
            "fraud_category": "Low",
            "fraud_score": 5,
            "compliance_status": "Compliant",
            "failed_checks": 0,
            "warning_checks": 0,
            "income_status": "Failed",
        },
    ),
]

print("DECISION GOVERNANCE REGRESSION TEST")
print("=" * 70)

for name, data in cases:
    result = make_loan_decision(
        risk_result={
            "risk_category": data["risk_category"],
            "risk_score": data["risk_score"],
        },
        fraud_result={
            "fraud_category": data["fraud_category"],
            "fraud_score": data["fraud_score"],
        },
        compliance_result={
            "compliance_status": data["compliance_status"],
            "failed_checks": data["failed_checks"],
            "warning_checks": data["warning_checks"],
        },
        income_result={
            "verification_status": data["income_status"],
        },
    )

    print(f"\nCASE: {name}")
    print(f"Decision: {result['decision']}")
    print(f"Status: {result['decision_status']}")
    print(f"Policy Version: {result['policy_version']}")
    print(f"Reason Codes: {result['reason_codes']}")
