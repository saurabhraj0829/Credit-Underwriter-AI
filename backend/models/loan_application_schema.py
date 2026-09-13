from pydantic import BaseModel, ConfigDict, Field


class LoanApplicationCreate(BaseModel):
    application_number: str = Field(min_length=3, max_length=50)
    applicant_name: str = Field(min_length=2, max_length=150)
    loan_type: str = Field(min_length=2, max_length=100)
    loan_amount: float = Field(gt=0)

    annual_income: float | None = Field(default=None, gt=0)
    credit_score: int | None = Field(default=None, ge=300, le=850)
    debt_to_income_ratio: float | None = Field(default=None, ge=0, le=1)
    employment_years: float | None = Field(default=None, ge=0)


class LoanApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    application_number: str
    applicant_name: str
    loan_type: str
    loan_amount: float
    risk_score: float | None = None
    default_probability: float | None = None
    risk_category: str | None = None
    status: str
    created_at: str | None = None

class UnderwritingDecisionCreate(BaseModel):
    decision: str = Field(
        min_length=3,
        max_length=50,
    )

    decision_reason: str | None = Field(
        default=None,
        max_length=1000,
    )

    decided_by: str = Field(
        default="Underwriter",
        min_length=2,
        max_length=100,
    )


class UnderwritingDecisionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    loan_application_id: int
    decision: str
    decision_reason: str | None = None
    risk_score: float | None = None
    decided_by: str
    created_at: str | None = None

class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    loan_application_id: int
    document_type: str
    original_filename: str
    file_path: str
    upload_status: str
    ocr_status: str
    verification_status: str
    created_at: str | None = None