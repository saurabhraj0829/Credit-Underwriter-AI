import json
from typing import Any

from sqlalchemy.orm import Session

from backend.models.underwriting_decision import (
    UnderwritingDecision,
)


def persist_underwriting_decision(
    db: Session,
    application: Any,
    decision_result: dict[str, Any],
) -> UnderwritingDecision:
    """
    Create or update the underwriting decision for an application.

    One application will have only one current underwriting decision.
    """

    application_id = int(application.id)

    record = (
        db.query(UnderwritingDecision)
        .filter(
            UnderwritingDecision.application_id == application_id
        )
        .order_by(
            UnderwritingDecision.id.desc()
        )
        .first()
    )

    if record is None:
        record = UnderwritingDecision(
            application_id=application_id,
            application_number=str(
                application.application_number
            ),
        )
        db.add(record)

    record.application_number = str(
        application.application_number
    )
    record.decision = str(
        decision_result.get("decision")
    )
    record.decision_status = str(
        decision_result.get("decision_status")
    )
    record.risk_score = decision_result.get(
        "risk_score"
    )
    record.risk_category = decision_result.get(
        "risk_category"
    )
    record.default_probability = decision_result.get(
        "default_probability"
    )
    record.fraud_score = decision_result.get(
        "fraud_score"
    )
    record.fraud_category = decision_result.get(
        "fraud_category"
    )
    record.compliance_status = decision_result.get(
        "compliance_status"
    )
    record.failed_checks = int(
        decision_result.get(
            "failed_checks",
            0,
        )
    )
    record.warning_checks = int(
        decision_result.get(
            "warning_checks",
            0,
        )
    )
    record.income_status = decision_result.get(
        "income_status"
    )
    record.reason_codes = json.dumps(
        decision_result.get(
            "reason_codes",
            [],
        )
    )
    record.reasons = json.dumps(
        decision_result.get(
            "reasons",
            [],
        )
    )
    record.policy_version = str(
        decision_result.get(
            "policy_version",
            "1.0",
        )
    )
    record.next_step = decision_result.get(
        "next_step"
    )

    # Update the main loan application record
    application.risk_score = decision_result.get(
        "risk_score"
    )
    application.risk_category = decision_result.get(
        "risk_category"
    )
    application.default_probability = decision_result.get(
        "default_probability"
    )
    application.status = decision_result.get(
        "decision_status",
        decision_result.get("decision", "Pending")
    )

    db.add(application)
    

    db.commit()
    db.refresh(record)

    return record