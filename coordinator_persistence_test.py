from backend.database.database import SessionLocal
from backend.models.loan_application import LoanApplication
from backend.ai.agents.underwriting_coordinator_agent import (
    underwriting_coordinator_agent,
)

db = SessionLocal()

try:
    application = (
        db.query(LoanApplication)
        .filter(
            LoanApplication.application_number == "CU-10003"
        )
        .first()
    )

    if not application:
        raise RuntimeError(
            "CU-10003 application was not found."
        )

    documents = []

    result = underwriting_coordinator_agent.analyze(
        application=application,
        documents=documents,
        salary_data=None,
        bank_statement_data=None,
        db=db,
    )

    print("COORDINATOR END-TO-END TEST")
    print("=" * 60)
    print("Application:", result["application_number"])
    print("Workflow:", result["workflow_status"])
    print("Decision:", result["final_decision"])
    print("Status:", result["decision_status"])
    print("Policy Version:", result["policy_version"])
    print("Reason Codes:", result["reason_codes"])
    print("Persistence:", result["persistence"])
    print("Audit:", result["audit_status"])
    print("Executive Report:",
          result["agents"]["executive_report"].get("status"))
    print("Notification:",
          result["notification_status"])
    print("Copilot:",
          result["copilot_status"])

finally:
    db.close()
