from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func

from backend.database.database import Base


class UnderwritingDecision(Base):
    """
    Persistent underwriting decision record.

    Stores the deterministic underwriting decision,
    governance metadata, risk outputs and reason codes
    for auditability.
    """

    __tablename__ = "underwriting_decisions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    application_id = Column(
        Integer,
        nullable=False,
        index=True,
    )

    application_number = Column(
        String(50),
        nullable=False,
        index=True,
    )

    decision = Column(
        String(50),
        nullable=False,
    )

    decision_status = Column(
        String(50),
        nullable=False,
    )

    risk_score = Column(
        Float,
        nullable=True,
    )

    risk_category = Column(
        String(50),
        nullable=True,
    )

    default_probability = Column(
        Float,
        nullable=True,
    )

    fraud_score = Column(
        Float,
        nullable=True,
    )

    fraud_category = Column(
        String(50),
        nullable=True,
    )

    compliance_status = Column(
        String(50),
        nullable=True,
    )



    failed_checks = Column(
        Integer,
        nullable=False,
        default=0,
    )

    warning_checks = Column(
        Integer,
        nullable=False,
        default=0,
    )

    income_status = Column(
        String(50),
        nullable=True,
    )

    reason_codes = Column(
        Text,
        nullable=True,
    )

    reasons = Column(
        Text,
        nullable=True,
    )

    policy_version = Column(
        String(50),
        nullable=False,
    )

    next_step = Column(
        String(150),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )