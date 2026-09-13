from typing import Any


class ExecutiveReportAgent:
    """
    Executive Report Agent.

    Responsibilities:
    - Convert underwriting audit results into an
      executive-level underwriting report.
    - Summarize decision, risk, concerns and
      positive factors.
    - Preserve upstream agent evidence.
    - Avoid changing the underwriting decision.
    """

    name = "Executive Report Agent"
    version = "1.0"

    def analyze(
        self,
        application: Any,
        audit_result: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Generate an executive underwriting report
        from the completed audit result.
        """

        decision = audit_result.get(
            "final_decision"
        )

        decision_status = audit_result.get(
            "decision_status"
        )

        positive_factors = audit_result.get(
            "positive_factors",
            [],
        )

        concerns = audit_result.get(
            "concerns",
            [],
        )

        evidence = audit_result.get(
            "evidence",
            [],
        )

        # ---------------------------------------------------------
        # Executive Summary
        # ---------------------------------------------------------

        if decision == "Approved":
            executive_summary = (
                "The application received an approval "
                "recommendation after the available "
                "underwriting checks were completed."
            )

        elif decision == "Rejected":
            executive_summary = (
                "The application was rejected because "
                "one or more mandatory underwriting "
                "conditions were not satisfied."
            )

        else:
            executive_summary = (
                "The application requires manual "
                "underwriter review because one or "
                "more underwriting signals require "
                "additional assessment."
            )

        # ---------------------------------------------------------
        # Key Risk Indicators
        # ---------------------------------------------------------

        risk_indicators: list[dict[str, Any]] = []

        for item in evidence:
            agent = item.get("agent")

            if agent == "Credit Risk Agent":
                risk_indicators.append(
                    {
                        "area": "Credit Risk",
                        "risk_score": item.get(
                            "risk_score"
                        ),
                        "risk_category": item.get(
                            "risk_category"
                        ),
                        "default_probability": item.get(
                            "default_probability"
                        ),
                    }
                )

            elif agent == "Fraud Detection Agent":
                risk_indicators.append(
                    {
                        "area": "Fraud",
                        "fraud_score": item.get(
                            "fraud_score"
                        ),
                        "fraud_category": item.get(
                            "status"
                        ),
                        "signals": item.get(
                            "signals",
                            [],
                        ),
                    }
                )

            elif agent == "Policy Compliance Agent":
                risk_indicators.append(
                    {
                        "area": "Policy Compliance",
                        "status": item.get(
                            "status"
                        ),
                        "failed_checks": item.get(
                            "failed_checks",
                            0,
                        ),
                        "warning_checks": item.get(
                            "warning_checks",
                            0,
                        ),
                        "violations": item.get(
                            "violations",
                            [],
                        ),
                    }
                )

            elif agent == "Income Verification Agent":
                risk_indicators.append(
                    {
                        "area": "Income Verification",
                        "status": item.get(
                            "status"
                        ),
                        "gross_income": item.get(
                            "gross_income"
                        ),
                        "net_income": item.get(
                            "net_income"
                        ),
                        "income_difference": item.get(
                            "income_difference"
                        ),
                    }
                )

        # ---------------------------------------------------------
        # Recommended Action
        # ---------------------------------------------------------

        if decision == "Approved":
            recommended_action = (
                "Proceed with the configured "
                "post-approval underwriting workflow."
            )

        elif decision == "Rejected":
            recommended_action = (
                "Record the rejection reason and "
                "complete the underwriting audit trail."
            )

        else:
            recommended_action = (
                "Route the application to a human "
                "underwriter for review of the "
                "identified concerns."
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
            "applicant_name": str(
                application.applicant_name
            ),
            "loan_type": str(
                application.loan_type
            ),
            "loan_amount": float(
                application.loan_amount
            ),
            "executive_summary": executive_summary,
            "final_decision": decision,
            "decision_status": decision_status,
            "positive_factors": positive_factors,
            "key_concerns": concerns,
            "risk_indicators": risk_indicators,
            "recommended_action": recommended_action,
            "evidence_count": len(evidence),
            "audit_status": audit_result.get(
                "audit_status"
            ),
            "report_status": "Completed",
        }


executive_report_agent = ExecutiveReportAgent()