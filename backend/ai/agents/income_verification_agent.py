from typing import Any

from backend.services.income_verification import (
    verify_salary_income,
    verify_income_against_bank_statement,
)


class IncomeVerificationAgent:
    """
    Income Verification Agent.

    Responsibilities:
    - Verify structured salary-slip information
    - Compare salary income with bank salary credits
    - Combine income verification results
    - Produce a structured underwriting-ready result
    - Route the application to the next workflow stage
    """

    name = "Income Verification Agent"
    version = "1.0"

    def analyze(
        self,
        application: Any,
        salary_data: Any = None,
        bank_statement_data: Any = None,
    ) -> dict[str, Any]:
        """
        Run salary verification and bank-statement
        income consistency checks.
        """

        salary_result = None
        bank_income_result = None

        reasons: list[str] = []

        # 1. Salary-slip verification
        if salary_data is not None:
            salary_result = verify_salary_income(
                salary_data
            )
        else:
            salary_result = {
                "status": "Warning",
                "gross_income": None,
                "total_deduction": None,
                "net_income": None,
                "checks": [
                    {
                        "check": "Salary slip availability",
                        "status": "Warning",
                        "details": (
                            "Salary-slip data is not available."
                        ),
                    }
                ],
            }

        # 2. Salary vs bank statement verification
        if (
            salary_data is not None
            and bank_statement_data is not None
        ):
            bank_income_result = (
                verify_income_against_bank_statement(
                    salary_data=salary_data,
                    bank_statement_data=bank_statement_data,
                )
            )
        else:
            bank_income_result = {
                "status": "Warning",
                "salary_net_income": (
                    salary_result.get("net_income")
                ),
                "bank_salary_credit_count": 0,
                "total_bank_salary_credits": 0.0,
                "income_difference": None,
                "checks": [
                    {
                        "check": (
                            "Salary vs bank statement"
                        ),
                        "status": "Warning",
                        "details": (
                            "Salary-slip and bank-statement "
                            "data are both required for "
                            "income consistency verification."
                        ),
                    }
                ],
            }

        # 3. Collect reasons
        if salary_result["status"] == "Failed":
            reasons.append(
                "Salary-slip verification failed."
            )
        elif salary_result["status"] == "Warning":
            reasons.append(
                "Salary-slip verification requires attention."
            )

        if bank_income_result["status"] == "Warning":
            reasons.append(
                "Salary income could not be fully "
                "validated against bank salary credits."
            )
        elif bank_income_result["status"] == "Failed":
            reasons.append(
                "Income verification against bank "
                "statement failed."
            )

        # 4. Determine overall status
        if (
            salary_result["status"] == "Failed"
            or bank_income_result["status"] == "Failed"
        ):
            overall_status = "Failed"

        elif (
            salary_result["status"] == "Warning"
            or bank_income_result["status"] == "Warning"
        ):
            overall_status = "Warning"

        else:
            overall_status = "Verified"

        # 5. Determine next workflow step
        if overall_status == "Verified":
            next_step = "Credit Risk Agent"
        elif overall_status == "Warning":
            next_step = "Manual Review"
        else:
            next_step = "Manual Review"

        if not reasons:
            reasons.append(
                "Income information passed verification."
            )

        return {
            "agent": self.name,
            "agent_version": self.version,
            "application_id": int(application.id),
            "application_number": str(
                application.application_number
            ),
            "verification_status": overall_status,
            "salary_verification": salary_result,
            "bank_income_verification": bank_income_result,
            "gross_income": salary_result.get(
                "gross_income"
            ),
            "net_income": salary_result.get(
                "net_income"
            ),
            "total_bank_salary_credits": (
                bank_income_result.get(
                    "total_bank_salary_credits"
                )
            ),
            "income_difference": (
                bank_income_result.get(
                    "income_difference"
                )
            ),
            "next_step": next_step,
            "reasons": reasons,
        }


income_verification_agent = IncomeVerificationAgent()