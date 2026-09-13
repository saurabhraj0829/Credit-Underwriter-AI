from typing import Any

from backend.services.underwriting_audit import (
    build_underwriting_audit,
)


class UnderwritingAuditAgent:
    """
    Underwriting Audit & Explanation Agent.

    Responsibilities:
    - Collect outputs from underwriting agents
    - Build an explainable audit trail
    - Identify positive factors and concerns
    - Explain the final underwriting decision
    - Preserve evidence from upstream agents
    """

    name = "Underwriting Audit Agent"
    version = "1.0"

    def analyze(
        self,
        application: Any,
        income_result: dict[str, Any],
        risk_result: dict[str, Any],
        fraud_result: dict[str, Any],
        compliance_result: dict[str, Any],
        decision_result: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Generate the underwriting audit and explanation.
        """

        audit_result = build_underwriting_audit(
            application=application,
            income_result=income_result,
            risk_result=risk_result,
            fraud_result=fraud_result,
            compliance_result=compliance_result,
            decision_result=decision_result,
        )

        return {
            "agent": self.name,
            "agent_version": self.version,
            **audit_result,
            "next_step": "Notification Agent",
        }


underwriting_audit_agent = UnderwritingAuditAgent()