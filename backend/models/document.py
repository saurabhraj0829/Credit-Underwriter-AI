from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship


from backend.database.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    loan_application_id = Column(
        Integer,
        ForeignKey("loan_applications.id"),
        nullable=False,
        index=True,
    )

    document_type = Column(
        String(50),
        nullable=False,
    )

    original_filename = Column(
        String(255),
        nullable=False,
    )

    file_path = Column(
        String(500),
        nullable=False,
    )

    upload_status = Column(
        String(50),
        nullable=False,
        default="Uploaded",
    )

    ocr_status = Column(
        String(50),
        nullable=False,
        default="Pending",
    )

    verification_status = Column(
        String(50),
        nullable=False,
        default="Pending",
    )

    extracted_text = Column(
        String,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    salary_slip_data = relationship(
        "SalarySlipData",
        back_populates="document",
        uselist=False,
        cascade="all, delete-orphan",
    )

    bank_statement_data = relationship(
    "BankStatementData",
    back_populates="document",
    uselist=False,
    cascade="all, delete-orphan",
)

    income_verification = relationship(
    "IncomeVerification",
    back_populates="document",
    uselist=False,
    cascade="all, delete-orphan",
)