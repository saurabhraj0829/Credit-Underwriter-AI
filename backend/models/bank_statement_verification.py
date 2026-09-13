from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey

from backend.database.database import Base


class BankStatementVerification(Base):
    __tablename__ = "bank_statement_verifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    document_id = Column(
        Integer,
        ForeignKey("documents.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    status = Column(
        String(50),
        nullable=False,
    )

    salary_credit_count = Column(
        Integer,
        nullable=False,
        default=0,
    )

    emi_transaction_count = Column(
        Integer,
        nullable=False,
        default=0,
    )

    closing_balance = Column(
        Float,
        nullable=True,
    )

    verification_details = Column(
        Text,
        nullable=True,
    )