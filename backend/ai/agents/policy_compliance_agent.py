from typing import Any

from backend.services.policy_compliance import (
    check_policy_compliance,
)


class PolicyComplianceAgent:
    """
    Policy Compliance Agent.

    Responsibilities:
    - Evaluate underwriting policy rules
    - Review credit risk
    - Review fraud risk
    - Review income verification
    - Identify policy violations
    - Route the application to the next stage
    """

    name = "Policy Compliance Agent"
    version = "1.0"

    def analyze(
        self,
        application: Any,
        risk_result: dict | None = None,
        fraud_result: dict | None = None,
        income_result: dict | None = None,
    ) -> dict[str, Any]:

        compliance_result = check_policy_compliance(
            application=application,
            risk_result=risk_result,
            fraud_result=fraud_result,
            income_result=income_result,
        )

        return {
            "agent": self.name,
            "agent_version": self.version,
            "application_id": int(application.id),
            "application_number": str(
                application.application_number
            ),
            "compliance_status": compliance_result["status"],
            "checks": compliance_result["checks"],
            "violations": compliance_result["violations"],
            "failed_checks": compliance_result["failed_checks"],
            "warning_checks": compliance_result["warning_checks"],
            "next_step": compliance_result["next_step"],
            "reasons": (
                compliance_result["violations"]
                if compliance_result["violations"]
                else [
                    "Application passed all configured "
                    "policy compliance checks."
                ]
            ),
        }


policy_compliance_agent = PolicyComplianceAgent()