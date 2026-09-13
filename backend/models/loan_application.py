from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func

from backend.database.database import Base


class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(Integer, primary_key=True, index=True)

    application_number = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    applicant_name = Column(
        String(150),
        nullable=False,
    )

    loan_type = Column(
        String(100),
        nullable=False,
    )

    loan_amount = Column(
        Float,
        nullable=False,
    )

    annual_income = Column(
        Float,
        nullable=True,
    )

    credit_score = Column(
        Integer,
        nullable=True,
    )

    debt_to_income_ratio = Column(
        Float,
        nullable=True,
    )

    employment_years = Column(
        Float,
        nullable=True,
    )

    risk_score = Column(
        Float,
        nullable=True,
    )

    default_probability = Column(
        Float,
        nullable=True,
    )

    risk_category = Column(
        String(50),
        nullable=True,
    )

    status = Column(
        String(50),
        nullable=False,
        default="Pending",
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )