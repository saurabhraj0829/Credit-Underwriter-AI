from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from backend.database.database import Base


class SalarySlipData(Base):
    __tablename__ = "salary_slip_data"

    id = Column(Integer, primary_key=True, index=True)

    document_id = Column(
        Integer,
        ForeignKey("documents.id"),
        nullable=False,
        unique=True,
    )

    employee_id = Column(String, nullable=True)
    employee_name = Column(String, nullable=True)
    joining_date = Column(String, nullable=True)
    department = Column(String, nullable=True)
    designation = Column(String, nullable=True)

    uan_number = Column(String, nullable=True)
    esic_number = Column(String, nullable=True)

    bank_name = Column(String, nullable=True)
    bank_account_number = Column(String, nullable=True)

    payslip_month = Column(String, nullable=True)

    basic = Column(String, nullable=True)
    hra = Column(String, nullable=True)
    conveyance = Column(String, nullable=True)
    special_allowance = Column(String, nullable=True)

    gross_earning = Column(String, nullable=True)
    total_deduction = Column(String, nullable=True)
    net_amount = Column(String, nullable=True)

    document = relationship(
        "Document",
        back_populates="salary_slip_data",
    )