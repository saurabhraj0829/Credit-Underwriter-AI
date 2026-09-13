from dataclasses import dataclass
from typing import Any


REQUIRED_DOCUMENT_TYPES = {
    "PAN",
    "Aadhaar",
    "Salary Slip",
    "Bank Statement",
}


@dataclass
class DocumentIntakeResult:
    application_id: int
    application_number: str
    applicant_name: str
    loan_type: str
    loan_amount: float
    status: str
    required_documents: list[str]
    uploaded_documents: list[str]
    missing_documents: list[str]
    document_count: int
    next_step: str
    reasons: list[str]


class DocumentIntakeAgent:
    """
    Document Intake Agent.

    Entry point of the AI underwriting workflow.

    Responsibilities:
    - Receive loan application information
    - Inspect uploaded documents
    - Identify required documents
    - Detect missing documents
    - Produce structured intake result
    - Decide whether the application can move
      to the OCR stage
    """

    name = "Document Intake Agent"
    version = "1.0"

    def analyze(
        self,
        application: Any,
        documents: list[Any],
    ) -> dict[str, Any]:
        """
        Analyze a loan application's document intake state.
        """

        uploaded_documents = {
            document.document_type
            for document in documents
            if getattr(document, "document_type", None)
        }

        uploaded_documents = sorted(uploaded_documents)

        missing_documents = sorted(
            REQUIRED_DOCUMENT_TYPES - set(uploaded_documents)
        )

        reasons: list[str] = []

        if missing_documents:
            status = "Incomplete"

            reasons.append(
                "Required documents are missing."
            )

            next_step = "Collect Missing Documents"

        else:
            status = "Ready for OCR"

            reasons.append(
                "All required document types are available."
            )

            next_step = "OCR Extraction Agent"

        if not documents:
            status = "Incomplete"

            reasons = [
                "No documents have been uploaded."
            ]

            next_step = "Collect Documents"

        result = DocumentIntakeResult(
            application_id=int(application.id),
            application_number=str(
                application.application_number
            ),
            applicant_name=str(
                application.applicant_name
            ),
            loan_type=str(
                application.loan_type
            ),
            loan_amount=float(
                application.loan_amount
            ),
            status=status,
            required_documents=sorted(
                REQUIRED_DOCUMENT_TYPES
            ),
            uploaded_documents=uploaded_documents,
            missing_documents=missing_documents,
            document_count=len(documents),
            next_step=next_step,
            reasons=reasons,
        )

        return {
            "agent": self.name,
            "agent_version": self.version,
            "application_id": result.application_id,
            "application_number": result.application_number,
            "applicant_name": result.applicant_name,
            "loan_type": result.loan_type,
            "loan_amount": result.loan_amount,
            "intake_status": result.status,
            "required_documents": result.required_documents,
            "uploaded_documents": result.uploaded_documents,
            "missing_documents": result.missing_documents,
            "document_count": result.document_count,
            "next_step": result.next_step,
            "reasons": result.reasons,
        }


document_intake_agent = DocumentIntakeAgent()