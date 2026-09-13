from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey
from sqlalchemy.orm import relationship

from backend.database.database import Base


class BankStatementData(Base):
    __tablename__ = "bank_statement_data"

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

    account_number = Column(
        String(50),
        nullable=True,
    )

    account_holder_name = Column(
        String(255),
        nullable=True,
    )

    bank_name = Column(
        String(255),
        nullable=True,
    )

    statement_period = Column(
        String(100),
        nullable=True,
    )

    opening_balance = Column(
        Float,
        nullable=True,
    )

    closing_balance = Column(
        Float,
        nullable=True,
    )

    total_credits = Column(
        Float,
        nullable=True,
    )

    total_debits = Column(
        Float,
        nullable=True,
    )

    salary_credits = Column(
        Text,
        nullable=True,
    )

    emi_transactions = Column(
        Text,
        nullable=True,
    )

    document = relationship(
        "Document",
        back_populates="bank_statement_data",
    )