from typing import Any
import json
import re


def verify_salary_income(salary_data: Any) -> dict:
    """
    Verify structured salary-slip data before it is used
    for underwriting risk assessment.
    """

    checks = []

    required_fields = {
        "employee_id": salary_data.employee_id,
        "employee_name": salary_data.employee_name,
        "designation": salary_data.designation,
        "bank_name": salary_data.bank_name,
        "payslip_month": salary_data.payslip_month,
        "gross_earning": salary_data.gross_earning,
        "total_deduction": salary_data.total_deduction,
        "net_amount": salary_data.net_amount,
    }

    missing_fields = [
        field
        for field, value in required_fields.items()
        if value is None or str(value).strip() == ""
    ]

    if missing_fields:
        checks.append({
            "check": "Required salary fields",
            "status": "Failed",
            "details": (
                f"Missing fields: {', '.join(missing_fields)}"
            ),
        })
    else:
        checks.append({
            "check": "Required salary fields",
            "status": "Passed",
            "details": (
                "All required salary fields are available."
            ),
        })

    gross = _to_number(
        salary_data.gross_earning
    )

    deduction = _to_number(
        salary_data.total_deduction
    )

    net = _to_number(
        salary_data.net_amount
    )

    if gross is None or deduction is None or net is None:
        checks.append({
            "check": "Income calculation",
            "status": "Failed",
            "details": (
                "Salary amounts could not be interpreted."
            ),
        })
    else:
        calculated_net = gross - deduction

        if calculated_net == net:
            checks.append({
                "check": "Income calculation",
                "status": "Passed",
                "details": (
                    "Gross income minus deductions "
                    "matches net income."
                ),
            })
        else:
            checks.append({
                "check": "Income calculation",
                "status": "Warning",
                "details": (
                    f"Expected net income {calculated_net}, "
                    f"but extracted net income is {net}."
                ),
            })

    if gross is not None and gross > 0:
        checks.append({
            "check": "Gross income",
            "status": "Passed",
            "details": (
                f"Gross income recorded as {gross}."
            ),
        })
    else:
        checks.append({
            "check": "Gross income",
            "status": "Failed",
            "details": (
                "Gross income is missing or invalid."
            ),
        })

    if net is not None and net > 0:
        checks.append({
            "check": "Net income",
            "status": "Passed",
            "details": (
                f"Net income recorded as {net}."
            ),
        })
    else:
        checks.append({
            "check": "Net income",
            "status": "Failed",
            "details": (
                "Net income is missing or invalid."
            ),
        })

    failed_checks = sum(
        1
        for check in checks
        if check["status"] == "Failed"
    )

    warning_checks = sum(
        1
        for check in checks
        if check["status"] == "Warning"
    )

    if failed_checks > 0:
        overall_status = "Failed"
    elif warning_checks > 0:
        overall_status = "Warning"
    else:
        overall_status = "Verified"

    return {
        "status": overall_status,
        "gross_income": gross,
        "total_deduction": deduction,
        "net_income": net,
        "checks": checks,
    }


def _to_number(value: Any):
    if value is None:
        return None

    try:
        return float(
            str(value)
            .replace(",", "")
            .strip()
        )
    except (TypeError, ValueError):
        return None


def verify_income_against_bank_statement(
    salary_data: Any,
    bank_statement_data: Any,
) -> dict:
    """
    Compare salary-slip net income with salary credits
    detected in the bank statement.

    Supports both:
    1. Structured salary-credit dictionaries
    2. Legacy string-based salary-credit records
    """

    checks = []

    salary_net_income = _to_number(
        salary_data.net_amount
    )

    bank_salary_credits = getattr(
        bank_statement_data,
        "salary_credits",
        [],
    )

    # Bank salary credits are stored as JSON text
    # in the database, so convert them into Python objects.
    if isinstance(bank_salary_credits, str):
        try:
            bank_salary_credits = json.loads(
                bank_salary_credits
            )
        except json.JSONDecodeError:
            bank_salary_credits = [
                bank_salary_credits
            ]

    if not isinstance(bank_salary_credits, list):
        bank_salary_credits = []

    salary_credit_amounts = []

    for transaction in bank_salary_credits:

        if not transaction:
            continue

        # New structured format:
        # {
        #     "description": "SALARY CREDIT - ACME INDUSTRIES",
        #     "amount": 45000.0
        # }
        if isinstance(transaction, dict):

            amount = _to_number(
                transaction.get("amount")
            )

            if amount is not None:
                salary_credit_amounts.append(
                    amount
                )

            continue

        # Legacy string format:
        # "SALARY CREDIT - ACME INDUSTRIES | Credit: 45000.00"
        if isinstance(transaction, str):

            match = re.search(
                r"credit\s*[:\-]?\s*"
                r"([\d,]+(?:\.\d{1,2})?)",
                transaction,
                re.IGNORECASE,
            )

            if match:
                amount = _to_number(
                    match.group(1)
                )

                if amount is not None:
                    salary_credit_amounts.append(
                        amount
                    )

    total_bank_salary_credits = sum(
        salary_credit_amounts
    )

    bank_salary_credit_count = len(
        salary_credit_amounts
    )

    # 1. Salary slip income availability

    if salary_net_income is None:

        checks.append({
            "check": "Salary slip net income",
            "status": "Failed",
            "details": (
                "Salary slip net income could not "
                "be determined."
            ),
        })

    else:

        checks.append({
            "check": "Salary slip net income",
            "status": "Passed",
            "details": (
                f"Salary slip net income recorded as "
                f"{salary_net_income:.2f}."
            ),
        })

    # 2. Bank salary credits availability

    if bank_salary_credit_count == 0:

        checks.append({
            "check": "Bank salary credits",
            "status": "Warning",
            "details": (
                "No salary credit amounts could be "
                "identified in the bank statement."
            ),
        })

    else:

        checks.append({
            "check": "Bank salary credits",
            "status": "Passed",
            "details": (
                f"{bank_salary_credit_count} salary "
                f"credit transaction(s) detected, "
                f"totaling "
                f"{total_bank_salary_credits:.2f}."
            ),
        })

    # 3. Income consistency

    income_difference = None

    if (
        salary_net_income is not None
        and bank_salary_credit_count > 0
    ):

        income_difference = abs(
            salary_net_income
            - total_bank_salary_credits
        )

        tolerance = max(
            100,
            salary_net_income * 0.05,
        )

        if income_difference <= tolerance:

            checks.append({
                "check": "Salary income consistency",
                "status": "Passed",
                "details": (
                    "Salary-slip net income is "
                    "consistent with bank salary credits."
                ),
            })

        else:

            checks.append({
                "check": "Salary income consistency",
                "status": "Warning",
                "details": (
                    f"Salary-slip net income is "
                    f"{salary_net_income:.2f}, while "
                    f"detected bank salary credits total "
                    f"{total_bank_salary_credits:.2f}. "
                    f"Difference: "
                    f"{income_difference:.2f}."
                ),
            })

    # 4. Overall status

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
        overall_status = "Failed"

    elif warning_checks:
        overall_status = "Warning"

    else:
        overall_status = "Verified"

    return {
        "status": overall_status,
        "salary_net_income": salary_net_income,
        "bank_salary_credit_count": (
            bank_salary_credit_count
        ),
        "total_bank_salary_credits": (
            total_bank_salary_credits
        ),
        "income_difference": income_difference,
        "checks": checks,
    }

    