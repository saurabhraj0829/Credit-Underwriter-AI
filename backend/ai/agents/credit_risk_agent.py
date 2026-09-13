from typing import Any

from backend.ai.ml.risk_engine import calculate_ml_credit_risk


class CreditRiskAgent:
    """
    Credit Risk Agent.

    Responsibilities:
    - Run the existing ML credit risk engine
    - Generate risk score
    - Generate default probability
    - Classify risk category
    - Produce underwriting-ready structured output
    - Route the application to the next workflow stage
    """

    name = "Credit Risk Agent"
    version = "1.0"

    def analyze(
        self,
        application: Any,
        bank_statement_data: Any | None = None,
    ) -> dict[str, Any]:
        """
        Run ML-based credit risk assessment.
        """

        risk_result = calculate_ml_credit_risk(
            application=application,
            bank_statement_data=bank_statement_data,
        )

        risk_score = risk_result.get("risk_score")
        default_probability = risk_result.get(
            "default_probability"
        )
        risk_category = risk_result.get(
            "risk_category"
        )

        reasons: list[str] = []

        if risk_category == "High":
            next_step = "Fraud Detection Agent"
            reasons.append(
                "Application has been classified as High Risk."
            )

        elif risk_category == "Medium":
            next_step = "Fraud Detection Agent"
            reasons.append(
                "Application has been classified as Medium Risk."
            )

        elif risk_category == "Low":
            next_step = "Fraud Detection Agent"
            reasons.append(
                "Application has been classified as Low Risk."
            )

        else:
            next_step = "Manual Review"
            reasons.append(
                "Risk category could not be determined."
            )

        return {
            "agent": self.name,
            "agent_version": self.version,
            "application_id": int(application.id),
            "application_number": str(
                application.application_number
            ),
            "risk_assessment_status": "Completed",
            "risk_score": risk_score,
            "default_probability": default_probability,
            "risk_category": risk_category,
            "model_status": "ML Credit Risk Model",
            "next_step": next_step,
            "reasons": reasons,
        }


credit_risk_agent = CreditRiskAgent()