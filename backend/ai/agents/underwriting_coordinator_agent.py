from typing import Any

from sqlalchemy.orm import Session

from backend.ai.agents.ai_copilot_agent import (
    ai_copilot_agent,
)

from backend.ai.agents.document_intake_agent import (
    document_intake_agent,
)

from backend.ai.agents.ocr_extraction_agent import (
    ocr_extraction_agent,
)

from backend.ai.agents.document_verification_agent import (
    document_verification_agent,
)

from backend.ai.agents.income_verification_agent import (
    income_verification_agent,
)

from backend.ai.agents.credit_risk_agent import (
    credit_risk_agent,
)

from backend.ai.agents.fraud_detection_agent import (
    fraud_detection_agent,
)

from backend.ai.agents.policy_compliance_agent import (
    policy_compliance_agent,
)

from backend.ai.agents.loan_decision_agent import (
    loan_decision_agent,
)

from backend.ai.agents.underwriting_audit_agent import (
    underwriting_audit_agent,
)

from backend.ai.agents.executive_report_agent import (
    executive_report_agent,
)

from backend.ai.agents.notification_agent import (
    notification_agent,
)

from backend.services.underwriting_decision_persistence import (
    persist_underwriting_decision,
)

from backend.models.audit_log import AuditLog


class UnderwritingCoordinatorAgent:
    """
    Underwriting Coordinator Agent.

    Responsibilities:
    - Orchestrate the complete underwriting workflow
    - Execute all underwriting agents in sequence
    - Pass outputs between dependent agents
    - Persist the final underwriting decision when a DB session is provided
    - Collect audit, executive report, notification and copilot results
    - Produce one structured underwriting workflow result
    """

    name = "Underwriting Coordinator Agent"
    version = "1.0"

    def _save_audit_log(
        self,
        db: Session,
        application: Any,
        event_type: str,
        event_status: str,
        agent_name: str | None,
        message: str,
    ) -> None:
        """Persist one underwriting audit event."""

        audit_log = AuditLog(
            application_id=int(application.id),
            application_number=str(
                application.application_number
            ),
            event_type=event_type,
            event_status=event_status,
            agent_name=agent_name,
            message=message,
        )

        db.add(audit_log)
        db.commit()

    def analyze(
        self,
        application: Any,
        documents: list[Any],
        salary_data: Any = None,
        bank_statement_data: Any = None,
        db: Session | None = None,
    ) -> dict[str, Any]:
        """
        Execute the complete underwriting workflow.

        Database persistence is optional so existing standalone
        agent tests can continue to run without a DB session.
        """

        # ---------------------------------------------------------
        # Agent 1: Document Intake
        # ---------------------------------------------------------

        if db is not None:
            self._save_audit_log(
                db=db,
                application=application,
                event_type="Underwriting Workflow",
                event_status="Started",
                agent_name=self.name,
                message="Underwriting workflow started.",
            )

        intake_result = document_intake_agent.analyze(
            application=application,
            documents=documents,
        )

        if db is not None:
            self._save_audit_log(
                db=db,
                application=application,
                event_type="Document Intake",
                event_status="Completed",
                agent_name="Document Intake Agent",
                message="Document intake completed successfully.",
            )

        # ---------------------------------------------------------
        # Agent 2: OCR Extraction
        # ---------------------------------------------------------

        ocr_results = []

        for document in documents:
            ocr_result = ocr_extraction_agent.analyze(
                document=document,
            )

            ocr_results.append(ocr_result)

        if db is not None:
            self._save_audit_log(
                db=db,
                application=application,
                event_type="OCR Extraction",
                event_status="Completed",
                agent_name="OCR Extraction Agent",
                message=(
                    "OCR extraction completed for all submitted documents."
                ),
            )

        # ---------------------------------------------------------
        # Agent 3: Document Verification
        # ---------------------------------------------------------

        document_verification_result = (
            document_verification_agent.analyze(
                application=application,
                documents=documents,
            )
        )

        if db is not None:
            self._save_audit_log(
                db=db,
                application=application,
                event_type="Document Verification",
                event_status="Completed",
                agent_name="Document Verification Agent",
                message=(
                    "Document verification completed successfully."
                ),
            )

        # ---------------------------------------------------------
        # Agent 4: Income Verification
        # ---------------------------------------------------------

        income_result = income_verification_agent.analyze(
            application=application,
            salary_data=salary_data,
            bank_statement_data=bank_statement_data,
        )

        if db is not None:
            self._save_audit_log(
                db=db,
                application=application,
                event_type="Income Verification",
                event_status="Completed",
                agent_name="Income Verification Agent",
                message=(
                    "Income verification completed successfully."
                ),
            )

        # ---------------------------------------------------------
        # Agent 5: Credit Risk
        # ---------------------------------------------------------

        risk_result = credit_risk_agent.analyze(
            application=application,
            bank_statement_data=bank_statement_data,
        )

        if db is not None:
            self._save_audit_log(
                db=db,
                application=application,
                event_type="Credit Risk",
                event_status="Completed",
                agent_name="Credit Risk Agent",
                message=(
                    "Credit risk assessment completed successfully."
                ),
            )

        # ---------------------------------------------------------
        # Agent 6: Fraud Detection
        # ---------------------------------------------------------

        fraud_result = fraud_detection_agent.analyze(
            documents=documents,
            bank_statement_data=bank_statement_data,
        )

        if db is not None:
            self._save_audit_log(
                db=db,
                application=application,
                event_type="Fraud Detection",
                event_status="Completed",
                agent_name="Fraud Detection Agent",
                message=(
                    "Fraud detection assessment completed successfully."
                ),
            )

        # ---------------------------------------------------------
        # Agent 7: Policy Compliance
        # ---------------------------------------------------------

        compliance_result = policy_compliance_agent.analyze(
            application=application,
            risk_result=risk_result,
            fraud_result=fraud_result,
            income_result=income_result,
        )

        if db is not None:
            self._save_audit_log(
                db=db,
                application=application,
                event_type="Policy Compliance",
                event_status="Completed",
                agent_name="Policy Compliance Agent",
                message=(
                    "Policy compliance assessment completed successfully."
                ),
            )

        # ---------------------------------------------------------
        # Agent 8: Loan Decision
        # ---------------------------------------------------------

        decision_result = loan_decision_agent.analyze(
            application=application,
            risk_result=risk_result,
            fraud_result=fraud_result,
            compliance_result=compliance_result,
            income_result=income_result,
        )

        if db is not None:
            self._save_audit_log(
                db=db,
                application=application,
                event_type="Loan Decision",
                event_status="Completed",
                agent_name="Loan Decision Agent",
                message=(
                    "Loan underwriting decision generated successfully."
                ),
            )

        # ---------------------------------------------------------
        # Agent 9: Underwriting Audit
        # ---------------------------------------------------------

        audit_result = underwriting_audit_agent.analyze(
            application=application,
            income_result=income_result,
            risk_result=risk_result,
            fraud_result=fraud_result,
            compliance_result=compliance_result,
            decision_result=decision_result,
        )

        if db is not None:
            self._save_audit_log(
                db=db,
                application=application,
                event_type="Underwriting Audit",
                event_status="Completed",
                agent_name="Underwriting Audit Agent",
                message=(
                    "Underwriting audit and explanation completed successfully."
                ),
            )

        # ---------------------------------------------------------
        # Agent 10: Executive Report
        # ---------------------------------------------------------

        executive_report_result = (
            executive_report_agent.analyze(
                application=application,
                audit_result=audit_result,
            )
        )

        if db is not None:
            self._save_audit_log(
                db=db,
                application=application,
                event_type="Executive Report",
                event_status="Completed",
                agent_name="Executive Report Agent",
                message=(
                    "Executive underwriting report generated successfully."
                ),
            )

        # ---------------------------------------------------------
        # Persistence Layer
        # ---------------------------------------------------------

        persistence_result: dict[str, Any] = {
            "status": "Skipped",
            "record_id": None,
        }

        if db is not None:
            persisted_record = (
                persist_underwriting_decision(
                    db=db,
                    application=application,
                    decision_result={
                        **decision_result,
                        "default_probability": risk_result.get(
                            "default_probability"
                        ),
                        "compliance_status": compliance_result.get(
                            "compliance_status"
                        ),
                        "failed_checks": compliance_result.get(
                            "failed_checks",
                            0,
                        ),
                        "warning_checks": compliance_result.get(
                            "warning_checks",
                            0,
                        ),
                    },
                )
            )

            persistence_result = {
                "status": "Persisted",
                "record_id": int(
                    persisted_record.id
                ),
            }

        # ---------------------------------------------------------
        # Agent 11: Notification
        # ---------------------------------------------------------

        notification_result = notification_agent.analyze(
    application=application,
    decision_result=decision_result,
    audit_result=audit_result,
        )

        if db is not None:
            self._save_audit_log(
                db=db,
                application=application,
                event_type="Notification",
                event_status="Ready",
                agent_name="Notification Agent",
                message=(
                    "Underwriting notification prepared successfully."
                ),
            )
        


        
        # ---------------------------------------------------------
        # Agent 12: AI Copilot
        # ---------------------------------------------------------

        copilot_result = ai_copilot_agent.analyze(
        application=application,
        question=(
        "Provide an underwriting summary and explain "
        "the current loan application status."
                ),
    underwriting_context=None,
    )
    

        if db is not None:
            self._save_audit_log(
                db=db,
                application=application,
                event_type="AI Copilot",
                event_status=(
                    "Completed"
                    if copilot_result.get("status") == "Completed"
                    else "Error"
                ),
                agent_name="AI Copilot Agent",
                message=(
                    "AI Copilot underwriting analysis completed successfully."
                    if copilot_result.get("status") == "Completed"
                    else "AI Copilot underwriting analysis failed."
                ),
            )

        if db is not None:
            self._save_audit_log(
                db=db,
                application=application,
                event_type="Underwriting Workflow",
                event_status="Completed",
                agent_name=self.name,
                message="Underwriting workflow completed successfully.",
            )
        # ---------------------------------------------------------
        # Final Workflow Result
        # ---------------------------------------------------------

        return {
            "agent": self.name,
            "agent_version": self.version,

            "application_id": int(
                application.id
            ),

            "application_number": str(
                application.application_number
            ),

            "workflow_status": "Completed",

            # -----------------------------------------------------
            # Complete agent outputs
            # -----------------------------------------------------

            "agents": {
                "document_intake": intake_result,
                "ocr_extraction": ocr_results,
                "document_verification": (
                    document_verification_result
                ),
                "income_verification": income_result,
                "credit_risk": risk_result,
                "fraud_detection": fraud_result,
                "policy_compliance": compliance_result,
                "loan_decision": decision_result,
                "underwriting_audit": audit_result,
                "executive_report": (
                    executive_report_result
                ),
                "notification": notification_result,
                "ai_copilot": copilot_result,
            },

            # -----------------------------------------------------
            # Persistence
            # -----------------------------------------------------

            "persistence": persistence_result,

            # -----------------------------------------------------
            # Final decision
            # -----------------------------------------------------

            "final_decision": decision_result.get(
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

            # -----------------------------------------------------
            # Executive Report
            # -----------------------------------------------------

            "executive_report": (
                executive_report_result
            ),

            # -----------------------------------------------------
            # Risk
            # -----------------------------------------------------

            "risk_category": risk_result.get(
                "risk_category"
            ),

            "risk_score": risk_result.get(
                "risk_score"
            ),

            "default_probability": risk_result.get(
                "default_probability"
            ),

            # -----------------------------------------------------
            # Fraud
            # -----------------------------------------------------

            "fraud_category": fraud_result.get(
                "fraud_category"
            ),

            "fraud_score": fraud_result.get(
                "fraud_score"
            ),

            # -----------------------------------------------------
            # Compliance
            # -----------------------------------------------------

            "compliance_status": (
                compliance_result.get(
                    "compliance_status"
                )
            ),

            # -----------------------------------------------------
            # Income
            # -----------------------------------------------------

            "income_status": income_result.get(
                "verification_status"
            ),

            # -----------------------------------------------------
            # Audit
            # -----------------------------------------------------

            "audit_status": audit_result.get(
                "audit_status"
            ),

            # -----------------------------------------------------
            # Notification
            # -----------------------------------------------------

            "notification_status": (
                notification_result.get(
                    "notification_status"
                )
            ),

            "next_step": notification_result.get(
                "next_step"
            ),

            # -----------------------------------------------------
            # AI Copilot
            # -----------------------------------------------------

            "copilot_status": copilot_result.get(
                "status"
            ),

            "copilot_result": copilot_result,
        }


underwriting_coordinator_agent = (
    UnderwritingCoordinatorAgent()
)