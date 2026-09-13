import re
from typing import Optional


def extract_value(pattern: str, text: str) -> Optional[str]:
    match = re.search(pattern, text, re.IGNORECASE)

    if match:
        return match.group(1).strip()

    return None


def parse_salary_slip(text: str) -> dict:
    """
    Convert OCR salary-slip text into structured financial data.
    """

    return {
        "employee_id": extract_value(
            r"Employee ID:\s*([A-Z0-9]+)",
            text,
        ),
        "employee_name": extract_value(
            r"Name:\s*(.+)",
            text,
        ),
        "joining_date": extract_value(
            r"DOJ:\s*(.+)",
            text,
        ),
        "department": extract_value(
            r"Department:\s*(.+)",
            text,
        ),
        "designation": extract_value(
            r"Designation:\s*(.+)",
            text,
        ),
        "uan_number": extract_value(
            r"UAN NO:\s*(\d+)",
            text,
        ),
        "esic_number": extract_value(
            r"ESIC NO:\s*(\d+)",
            text,
        ),
        "bank_name": extract_value(
            r"Bank Name:\s*(.+)",
            text,
        ),
        "bank_account_number": extract_value(
            r"Bank Acc\. No:\s*(\d+)",
            text,
        ),
        "payslip_month": extract_value(
            r"Payslip for Month:\s*(.+)",
            text,
        ),
        "basic": extract_value(
            r"Basic:\s*([\d,]+)",
            text,
        ),
        "hra": extract_value(
            r"HRA:\s*([\d,]+)",
            text,
        ),
        "conveyance": extract_value(
            r"Conveyance:\s*([\d,]+)",
            text,
        ),
        "special_allowance": extract_value(
            r"Special Allowance:\s*([\d,]+)",
            text,
        ),
        "gross_earning": extract_value(
            r"Gross Earning:\s*([\d,]+)",
            text,
        ),
        "total_deduction": extract_value(
            r"Total Deduction:\s*([\d,]+)",
            text,
        ),
        "net_amount": extract_value(
            r"Net Amount:\s*([\d,]+)",
            text,
        ),
    }