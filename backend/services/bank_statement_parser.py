import re

from typing import Any


def parse_bank_statement(extracted_text: str) -> dict[str, Any]:
    """
    Extract structured financial information from OCR text
    of a bank statement.
    """

    text = extracted_text or ""

    result = {
        "account_number": None,
        "account_holder_name": None,
        "bank_name": None,
        "statement_period": None,
        "opening_balance": None,
        "closing_balance": None,
        "total_credits": None,
        "total_debits": None,
        "salary_credits": [],
        "emi_transactions": [],
    }

    # Account Number
    account_number_match = re.search(
        r"(?:account\s*(?:no|number)|a/c\s*(?:no|number))"
        r"\s*[:\-]?\s*([0-9Xx*]{6,20})",
        text,
        re.IGNORECASE,
    )

    if account_number_match:
        result["account_number"] = (
            account_number_match.group(1)
        )

    # Account Holder Name
    account_holder_match = re.search(
        r"account\s*holder\s*name\s*[:\-]?\s*(.+)",
        text,
        re.IGNORECASE,
    )

    if account_holder_match:
        result["account_holder_name"] = (
            account_holder_match.group(1).strip()
        )

    # Bank Name
    bank_name_match = re.search(
        r"bank\s*name\s*[:\-]?\s*(.+)",
        text,
        re.IGNORECASE,
    )

    if bank_name_match:
        result["bank_name"] = (
            bank_name_match.group(1).strip()
        )

    # Statement Period
    statement_period_match = re.search(
        r"statement\s*period\s*[:\-]?\s*(.+)",
        text,
        re.IGNORECASE,
    )

    if statement_period_match:
        result["statement_period"] = (
            statement_period_match.group(1).strip()
        )

    # OCR may read the Indian Rupee symbol ₹ as I.
    currency_prefix = r"[₹RsI.\s]*"

    # Opening Balance
    opening_balance_match = re.search(
        rf"opening\s*balance\s*[:\-]?\s*{currency_prefix}"
        r"([\d,]+(?:\.\d{1,2})?)",
        text,
        re.IGNORECASE,
    )

    if opening_balance_match:
        result["opening_balance"] = float(
            opening_balance_match.group(1).replace(",", "")
        )

    # Closing Balance
    closing_balance_match = re.search(
        rf"closing\s*balance\s*[:\-]?\s*{currency_prefix}"
        r"([\d,]+(?:\.\d{1,2})?)",
        text,
        re.IGNORECASE,
    )

    if closing_balance_match:
        result["closing_balance"] = float(
            closing_balance_match.group(1).replace(",", "")
        )

    # Total Credits
    total_credits_match = re.search(
        rf"total\s*credits?\s*[:\-]?\s*{currency_prefix}"
        r"([\d,]+(?:\.\d{1,2})?)",
        text,
        re.IGNORECASE,
    )

    if total_credits_match:
        result["total_credits"] = float(
            total_credits_match.group(1).replace(",", "")
        )

    # Total Debits
    total_debits_match = re.search(
        rf"total\s*debits?\s*[:\-]?\s*{currency_prefix}"
        r"([\d,]+(?:\.\d{1,2})?)",
        text,
        re.IGNORECASE,
    )

    if total_debits_match:
        result["total_debits"] = float(
            total_debits_match.group(1).replace(",", "")
        )

    # Prepare clean OCR lines
    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    # Salary transactions
    #
    # OCR table can look like:
    #
    # 03-Jun-2024
    # SALARY CREDIT - ACME INDUSTRIES
    # -
    # 45,000.00
    # 1,27,500.00
    #
    # We look ahead for the first valid amount after
    # the salary description.

    salary_lines = []

    for index, line in enumerate(lines):

        if "salary credit" not in line.lower():
            continue

        transaction_description = line
        credit_amount = None

        for next_index in range(
            index + 1,
            min(index + 5, len(lines)),
        ):
            next_line = lines[next_index].strip()

            # Ignore debit placeholder
            if next_line == "-":
                continue

            amount_match = re.fullmatch(
                r"[\d,]+(?:\.\d{1,2})?",
                next_line,
            )

            if amount_match:
                credit_amount = float(
                    amount_match.group(0).replace(",", "")
                )
                break

        salary_lines.append(
            {
                "description": transaction_description,
                "amount": credit_amount,
            }
        )

    result["salary_credits"] = salary_lines

    # EMI transactions
    emi_lines = []

    for index, line in enumerate(lines):

        line_lower = line.lower()

        if (
            "emi -" in line_lower
            or "emi " in line_lower
            or "loan repayment" in line_lower
            or "loan instalment" in line_lower
            or "loan installment" in line_lower
        ):
            transaction = line

            # Look at following lines for the debit amount.
            for next_index in range(
                index + 1,
                min(index + 4, len(lines)),
            ):
                next_line = lines[next_index]

                amount_match = re.fullmatch(
                    r"[\d,]+(?:\.\d{1,2})?",
                    next_line,
                )

                if amount_match:
                    transaction = (
                        f"{transaction} | "
                        f"Debit: {next_line}"
                    )
                    break

            emi_lines.append(transaction)

    result["emi_transactions"] = emi_lines

    return result