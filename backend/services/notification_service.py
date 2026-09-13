from typing import Any


def build_underwriting_notification(
    application: Any,
    decision_result: dict[str, Any],
    audit_result: dict[str, Any],
) -> dict[str, Any]:
    """
    Convert the final underwriting decision and audit
    result into notification-ready information.

    This service does not make or modify the decision.
    """

    decision = decision_result.get(
        "decision"
    )

    decision_status = decision_result.get(
        "decision_status"
    )

    applicant_name = str(
        application.applicant_name
    )

    application_number = str(
        application.application_number
    )

    loan_amount = float(
        application.loan_amount
    )

    if decision == "Approved":
        notification_type = "Approval"

        subject = (
            f"Loan Application {application_number} "
            "Approved"
        )

        message = (
            f"Dear {applicant_name}, your loan application "
            f"{application_number} has been approved. "
            f"The requested loan amount is "
            f"₹{loan_amount:,.2f}."
        )

    elif decision == "Rejected":
        notification_type = "Rejection"

        subject = (
            f"Loan Application {application_number} "
            "Decision"
        )

        message = (
            f"Dear {applicant_name}, a final decision has "
            f"been made on your loan application "
            f"{application_number}. "
            "The application has not been approved."
        )

    else:
        notification_type = "Manual Review"

        subject = (
            f"Loan Application {application_number} "
            "Requires Review"
        )

        message = (
            f"Dear {applicant_name}, your loan application "
            f"{application_number} requires additional "
            "underwriting review before a final decision "
            "can be made."
        )

    concerns = audit_result.get(
        "concerns",
        []
    )

    positive_factors = audit_result.get(
        "positive_factors",
        []
    )

    return {
        "application_number": application_number,
        "applicant_name": applicant_name,
        "loan_amount": loan_amount,
        "notification_type": notification_type,
        "subject": subject,
        "message": message,
        "decision": decision,
        "decision_status": decision_status,
        "positive_factors": positive_factors,
        "concerns": concerns,
        "notification_status": "Ready",
        "delivery_status": "Not Sent",
        "delivery_channels": [
            "Email",
            "In-App",
        ],
        "next_step": "Send Notification",
    }