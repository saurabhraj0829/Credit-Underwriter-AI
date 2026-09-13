from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship

from backend.database.database import Base


class IncomeVerification(Base):
    __tablename__ = "income_verifications"

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
    )

    status = Column(
        String(50),
        nullable=False,
    )

    gross_income = Column(
        Float,
        nullable=True,
    )

    total_deduction = Column(
        Float,
        nullable=True,
    )

    net_income = Column(
        Float,
        nullable=True,
    )

    verification_details = Column(
        Text,
        nullable=True,
    )

    cross_document_verification = Column(
        Text,
        nullable=True,
    )

    document = relationship(
        "Document",
        back_populates="income_verification",
    )