import json
import re

from typing import Any


def build_credit_risk_features(
    application: Any,
    bank_statement_data: Any | None = None,
) -> dict[str, float]:
    """
    Build ML features from loan application and
    bank statement data.
    """

    annual_income = application.annual_income or 0.0

    monthly_income = annual_income / 12

    monthly_emi = 0.0
    existing_liabilities = 0.0
    bank_balance = 0.0
    salary_credit_count = 0.0

    if bank_statement_data is not None:
        bank_balance = (
            bank_statement_data.closing_balance or 0.0
        )

        salary_credits = (
            bank_statement_data.salary_credits
            or ""
        )

        emi_transactions = (
            bank_statement_data.emi_transactions
            or ""
        )

        # Parse salary credits stored as JSON text
        if salary_credits:
            try:
                salary_lines = json.loads(salary_credits)

                if isinstance(salary_lines, list):
                    salary_credit_count = float(
                        len(salary_lines)
                    )
                else:
                    salary_credit_count = 1.0

            except (json.JSONDecodeError, TypeError):
                salary_credit_count = float(
                    len(salary_credits.splitlines())
                )

        # Parse EMI transactions stored as JSON text
        if emi_transactions:
            try:
                emi_lines = json.loads(emi_transactions)

                if not isinstance(emi_lines, list):
                    emi_lines = [
                        str(emi_lines)
                    ]

            except (json.JSONDecodeError, TypeError):
                emi_lines = emi_transactions.splitlines()

            existing_liabilities = float(
                len(emi_lines)
            )

            emi_amounts = []

            for line in emi_lines:
                amounts = re.findall(
                    r"[\d,]+(?:\.\d{1,2})?",
                    str(line),
                )

                if amounts:
                    amount = float(
                        amounts[-1].replace(",", "")
                    )

                    emi_amounts.append(amount)

            if emi_amounts:
                monthly_emi = float(
                    sum(emi_amounts)
                )

    return {
        "monthly_income": float(monthly_income),
        "monthly_emi": float(monthly_emi),
        "existing_liabilities": float(
            existing_liabilities
        ),
        "credit_utilization": 0.0,
        "employment_stability": float(
            application.employment_years or 0.0
        ),
        "bank_balance": float(bank_balance),
        "salary_credit_count": float(
            salary_credit_count
        ),
    }