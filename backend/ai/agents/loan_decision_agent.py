from typing import Any

from backend.services.loan_decision import make_loan_decision


class LoanDecisionAgent:
    """
    Loan Decision Agent.

    Combines Credit Risk, Fraud Detection, Policy Compliance
    and Income Verification outputs into the final deterministic
    underwriting decision.
    """

    name = "Loan Decision Agent"
    version = "1.0"

    def analyze(
        self,
        application: Any,
        risk_result: dict[str, Any],
        fraud_result: dict[str, Any],
        compliance_result: dict[str, Any],
        income_result: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Generate the final underwriting decision.
        """

        decision_result = make_loan_decision(
            risk_result=risk_result,
            fraud_result=fraud_result,
            compliance_result=compliance_result,
            income_result=income_result,
        )

        return {
            "agent": self.name,
            "agent_version": self.version,

            "application_id": int(
                application.id
            ),

            "application_number": str(
                application.application_number
            ),

            "decision": decision_result.get(
                "decision"
            ),

            "decision_status": decision_result.get(
                "decision_status"
            ),

            "policy_version": decision_result.get(
                "policy_version"
            ),

            "reason_codes": decision_result.get(
                "reason_codes",
                [],
            ),

            "reasons": decision_result.get(
                "reasons",
                [],
            ),

            "risk_score": decision_result.get(
                "risk_score"
            ),

            "risk_category": decision_result.get(
                "risk_category"
            ),

            "default_probability": decision_result.get(
                "default_probability"
            ),

            "fraud_score": decision_result.get(
                "fraud_score"
            ),

            "fraud_category": decision_result.get(
                "fraud_category"
            ),

            "compliance_status": decision_result.get(
                "compliance_status"
            ),

            "income_status": decision_result.get(
                "income_status"
            ),

            "failed_checks": decision_result.get(
    "failed_checks",
    0,
),

"warning_checks": decision_result.get(
    "warning_checks",
    0,
),

            "next_step": decision_result.get(
                "next_step"
            ),
        }


loan_decision_agent = LoanDecisionAgent()