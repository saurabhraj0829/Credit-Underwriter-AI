from dataclasses import dataclass
from typing import Any

from backend.ai.ml.credit_risk_model import CreditRiskModel
from backend.ai.ml.feature_engineering import build_credit_risk_features


@dataclass
class RiskAssessment:
    risk_score: float
    default_probability: float
    risk_category: str


def assess_credit_risk(
    credit_score: int | None,
    annual_income: float | None,
    loan_amount: float,
    debt_to_income_ratio: float | None,
    employment_years: float | None,
) -> RiskAssessment:

    score = 0.0

    # Credit score
    if credit_score is not None:
        if credit_score < 580:
            score += 40
        elif credit_score < 670:
            score += 25
        elif credit_score < 740:
            score += 10
        else:
            score += 0
    else:
        score += 20

    # Debt-to-income ratio
    if debt_to_income_ratio is not None:
        if debt_to_income_ratio > 0.50:
            score += 30
        elif debt_to_income_ratio > 0.40:
            score += 20
        elif debt_to_income_ratio > 0.30:
            score += 10

    # Loan-to-income relationship
    if annual_income is not None and annual_income > 0:
        loan_to_income = loan_amount / annual_income

        if loan_to_income > 5:
            score += 20
        elif loan_to_income > 3:
            score += 12
        elif loan_to_income > 2:
            score += 6

    # Employment stability
    if employment_years is not None:
        if employment_years < 1:
            score += 10
        elif employment_years < 3:
            score += 5

    risk_score = min(round(score, 2), 100.0)

    default_probability = min(
        round(risk_score / 100, 4),
        0.99,
    )

    if risk_score >= 60:
        risk_category = "High"
    elif risk_score >= 30:
        risk_category = "Medium"
    else:
        risk_category = "Low"

    return RiskAssessment(
        risk_score=risk_score,
        default_probability=default_probability,
        risk_category=risk_category,
    )

credit_risk_model = CreditRiskModel()


def calculate_ml_credit_risk(
    application: Any,
    bank_statement_data: Any | None = None,
) -> dict[str, Any]:
    """
    Calculate credit risk using application-level
    financial and credit information.

    Used as a reliable baseline when the current
    development ML model lacks application features.
    """

    assessment = assess_credit_risk(
        credit_score=application.credit_score,
        annual_income=application.annual_income,
        loan_amount=application.loan_amount,
        debt_to_income_ratio=application.debt_to_income_ratio,
        employment_years=application.employment_years,
    )

    return {
        "risk_score": assessment.risk_score,
        "default_probability": assessment.default_probability,
        "risk_category": assessment.risk_category,
        "model_status": "Rule-Based Baseline",
        "features": {
            "credit_score": float(
                application.credit_score or 0
            ),
            "annual_income": float(
                application.annual_income or 0
            ),
            "loan_amount": float(
                application.loan_amount or 0
            ),
            "debt_to_income_ratio": float(
                application.debt_to_income_ratio or 0
            ),
            "employment_years": float(
                application.employment_years or 0
            ),
        },
    }

    return credit_risk_model.predict(features)