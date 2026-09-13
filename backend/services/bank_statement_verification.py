import ast
from typing import Any


def _normalize_transactions(value: Any) -> list:
    """
    Convert transaction data into a proper Python list.

    Database may store list values as a string, for example:
    "['SALARY CREDIT - ACME INDUSTRIES', 'SALARY CREDIT - ACME INDUSTRIES']"
    """

    if value is None:
        return []

    if isinstance(value, list):
        return value

    if isinstance(value, tuple):
        return list(value)

    if isinstance(value, str):
        value = value.strip()

        if not value:
            return []

        try:
            parsed = ast.literal_eval(value)

            if isinstance(parsed, (list, tuple)):
                return list(parsed)

        except (ValueError, SyntaxError):
            pass

        return [value]

    return []


def verify_bank_statement(
    bank_statement_data: Any,
) -> dict:
    """
    Verify extracted bank statement data for
    basic income, liability, and financial consistency.
    """

    checks = []

    # Normalize transaction fields before verification.
    salary_credits = _normalize_transactions(
        bank_statement_data.salary_credits
    )

    emi_transactions = _normalize_transactions(
        bank_statement_data.emi_transactions
    )

    # 1. Required account information
    required_fields = {
        "account_number": bank_statement_data.account_number,
        "bank_name": bank_statement_data.bank_name,
    }

    missing_fields = [
        field
        for field, value in required_fields.items()
        if not value
    ]

    if missing_fields:
        checks.append({
            "check": "Required account fields",
            "status": "Failed",
            "details": (
                f"Missing fields: {', '.join(missing_fields)}"
            ),
        })
    else:
        checks.append({
            "check": "Required account fields",
            "status": "Passed",
            "details": "Account information is available.",
        })

    # 2. Balance consistency
    opening_balance = bank_statement_data.opening_balance
    closing_balance = bank_statement_data.closing_balance
    total_credits = bank_statement_data.total_credits
    total_debits = bank_statement_data.total_debits

    if (
        opening_balance is not None
        and closing_balance is not None
        and total_credits is not None
        and total_debits is not None
    ):
        calculated_closing = (
            opening_balance
            + total_credits
            - total_debits
        )

        difference = abs(
            calculated_closing - closing_balance
        )

        if difference <= 1:
            checks.append({
                "check": "Balance consistency",
                "status": "Passed",
                "details": (
                    "Opening balance + credits - debits "
                    "matches closing balance."
                ),
            })
        else:
            checks.append({
                "check": "Balance consistency",
                "status": "Failed",
                "details": (
                    f"Calculated closing balance "
                    f"{calculated_closing:.2f} does not match "
                    f"reported closing balance "
                    f"{closing_balance:.2f}."
                ),
            })
    else:
        checks.append({
            "check": "Balance consistency",
            "status": "Warning",
            "details": (
                "Insufficient balance data for calculation."
            ),
        })

    # 3. Salary credit detection
    if salary_credits:
        checks.append({
            "check": "Salary credits",
            "status": "Passed",
            "details": (
                f"{len(salary_credits)} salary-related "
                "credit transaction(s) detected."
            ),
        })
    else:
        checks.append({
            "check": "Salary credits",
            "status": "Warning",
            "details": (
                "No salary-related credits detected."
            ),
        })

    # 4. EMI / liability detection
    if emi_transactions:
        checks.append({
            "check": "Existing liabilities",
            "status": "Warning",
            "details": (
                f"{len(emi_transactions)} EMI/loan "
                "transaction(s) detected."
            ),
        })
    else:
        checks.append({
            "check": "Existing liabilities",
            "status": "Passed",
            "details": (
                "No EMI-related transactions detected."
            ),
        })

    failed_checks = [
        check
        for check in checks
        if check["status"] == "Failed"
    ]

    warning_checks = [
        check
        for check in checks
        if check["status"] == "Warning"
    ]

    if failed_checks:
        status = "Failed"
    elif warning_checks:
        status = "Warning"
    else:
        status = "Verified"

    return {
        "status": status,
        "checks": checks,
        "salary_credit_count": len(salary_credits),
        "emi_transaction_count": len(emi_transactions),
        "closing_balance": closing_balance,
    }