import json

import re
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.loan_application import LoanApplication
from backend.models.document import Document
from backend.models.salary_slip_data import SalarySlipData
from backend.models.bank_statement_data import BankStatementData

from backend.ai.agents.ocr_extraction_agent import (
    ocr_extraction_agent,
)

from backend.ai.agents.document_verification_agent import (
    document_verification_agent,
)


router = APIRouter(
    prefix="/api/loan-applications",
    tags=["Documents"],
)


UPLOAD_DIR = Path("uploads")


ALLOWED_DOCUMENT_TYPES = {
    "PAN",
    "Aadhaar",
    "Salary Slip",
    "Bank Statement",
    "GST",
    "Other",
}


@router.get("/documents")
def get_all_documents(
    db: Session = Depends(get_db),
):
    """
    Return all uploaded documents across
    the underwriting system.
    """

    documents = (
        db.query(
            Document,
            LoanApplication.application_number,
            LoanApplication.applicant_name,
        )
        .join(
            LoanApplication,
            LoanApplication.id == Document.loan_application_id,
        )
        .order_by(
            Document.created_at.desc()
        )
        .all()
    )

    return [
        {
            "id": document.id,
            "loan_application_id": document.loan_application_id,
            "application_number": application_number,
            "applicant_name": applicant_name,
            "document_type": document.document_type,
            "original_filename": document.original_filename,
            "upload_status": document.upload_status,
            "ocr_status": document.ocr_status,
            "verification_status": document.verification_status,
            "created_at": (
                document.created_at.isoformat()
                if document.created_at
                else None
            ),
        }
        for (
            document,
            application_number,
            applicant_name,
        ) in documents
    ]


@router.post(
    "/{application_number}/documents"
)
async def upload_document(
    application_number: str,
    document_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload a PDF underwriting document
    for an existing loan application.
    """

    application = (
        db.query(LoanApplication)
        .filter(
            LoanApplication.application_number
            == application_number
        )
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Loan application not found",
        )

    if document_type not in ALLOWED_DOCUMENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid document type",
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="File name is required",
        )

    file_extension = Path(
        file.filename
    ).suffix.lower()

    if file_extension != ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed",
        )

    application_directory = (
        UPLOAD_DIR
        / application.application_number
    )

    application_directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    file_path = (
        application_directory
        / file.filename
    )

    file_contents = await file.read()

    with open(
        file_path,
        "wb",
    ) as output_file:
        output_file.write(file_contents)

    document = Document(
        loan_application_id=application.id,
        document_type=document_type,
        original_filename=file.filename,
        file_path=str(file_path),
        upload_status="Uploaded",
        ocr_status="Pending",
        verification_status="Pending",
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return {
        "id": document.id,
        "loan_application_id": document.loan_application_id,
        "application_number": application.application_number,
        "document_type": document.document_type,
        "original_filename": document.original_filename,
        "upload_status": document.upload_status,
        "ocr_status": document.ocr_status,
        "verification_status": document.verification_status,
        "created_at": (
            document.created_at.isoformat()
            if document.created_at
            else None
        ),
    }


@router.post(
    "/{application_number}/documents/{document_id}/ocr"
)
def process_document_ocr(
    application_number: str,
    document_id: int,
    db: Session = Depends(get_db),
):
    """
    Process one uploaded document through
    the existing OCR Extraction Agent.
    """

    application = (
        db.query(LoanApplication)
        .filter(
            LoanApplication.application_number
            == application_number
        )
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Loan application not found",
        )

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.loan_application_id
            == application.id,
        )
        .first()
    )

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    if not document.file_path:
        raise HTTPException(
            status_code=400,
            detail="Document file path is missing",
        )

    result = ocr_extraction_agent.analyze(
        document=document
    )

    document.ocr_status = result.get(
        "ocr_status",
        "Failed",
    )

    extracted_text = result.get(
        "extracted_text"
    )

    if extracted_text:
        document.extracted_text = extracted_text

        if document.document_type == "Salary Slip":
            lines = [
                line.strip()
                for line in extracted_text.splitlines()
                if line.strip()
            ]

            def extract_value(label_pattern: str):
                """
                Supports both formats:

                Label: Value

                and:

                Label
                Value
                """

                for index, line in enumerate(lines):
                    if re.search(
                        label_pattern,
                        line,
                        re.IGNORECASE,
                    ):
                        # Format: Label: Value
                        if ":" in line:
                            value = line.split(
                                ":",
                                1,
                            )[1].strip()

                            if value:
                                return value

                        # Format:
                        # Label
                        # Value
                        if index + 1 < len(lines):
                            return lines[index + 1]

                return None

            salary_data = (
                db.query(SalarySlipData)
                .filter(
                    SalarySlipData.document_id
                    == document.id
                )
                .first()
            )

            if salary_data is None:
                salary_data = SalarySlipData(
                    document_id=document.id
                )
                db.add(salary_data)

            salary_data.employee_id = extract_value(
                r"^Employee\s*ID$"
            )

            salary_data.employee_name = extract_value(
                r"^Employee\s*Name$"
            )

            salary_data.designation = extract_value(
                r"^Designation$"
            )

            salary_data.bank_name = extract_value(
                r"^Bank\s*Name$"
            )

            salary_data.payslip_month = extract_value(
                r"^Payslip\s*Month$|^Month$"
            )

            salary_data.gross_earning = extract_value(
                r"^Gross\s*(?:Earning|Salary|Income)$"
            )

            salary_data.total_deduction = extract_value(
                r"^Total\s*Deduction[s]?$"
            )

            salary_data.net_amount = extract_value(
                r"^Net\s*(?:Amount|Salary|Pay)$"
            )

                    # ---------------------------------------------------------
        # BANK STATEMENT STRUCTURED DATA EXTRACTION
        # ---------------------------------------------------------
        if document.document_type == "Bank Statement":
            lines = [
                line.strip()
                for line in extracted_text.splitlines()
                if line.strip()
            ]

            def get_next_value(label: str):
                """
                Supports OCR format:

                Account Holder
                Amit Verma

                and:

                Account Holder: Amit Verma
                """

                for index, line in enumerate(lines):
                    if line.lower() == label.lower():
                        if index + 1 < len(lines):
                            return lines[index + 1]

                    if line.lower().startswith(
                        f"{label.lower()}:"
                    ):
                        return line.split(":", 1)[1].strip()

                return None

            def extract_amount(value) -> float:
                """
                Extracts the last numeric amount from OCR text.

                Examples:
                I250,000.00       -> 250000.0
                Credit - Salary - I120,000.00 -> 120000.0
                Closing Balance - I340,000.00 -> 340000.0
                """

                if not value:
                    return 0.0

                matches = re.findall(
                    r"\d[\d,]*(?:\.\d+)?",
                    str(value),
                )

                if not matches:
                    return 0.0

                try:
                    return float(
                        matches[-1].replace(",", "")
                    )
                except ValueError:
                    return 0.0

            account_holder_name = get_next_value(
                "Account Holder"
            )

            account_number = get_next_value(
                "Account Number"
            )

            bank_name = get_next_value(
                "Bank"
            )

            statement_period = get_next_value(
                "Statement Period"
            )

            opening_balance = 0.0
            closing_balance = 0.0
            total_credits = 0.0
            total_debits = 0.0

            salary_credits = []
            emi_transactions = []

            for index, line in enumerate(lines):
                lower_line = line.lower()

                # Opening Balance
                if lower_line == "opening balance":
                    if index + 1 < len(lines):
                        opening_balance = extract_amount(
                            lines[index + 1]
                        )

                # Closing Balance
                elif "closing balance" in lower_line:
                    closing_balance = extract_amount(line)

                # Salary Credit
                elif (
                    "credit" in lower_line
                    and "salary" in lower_line
                ):
                    amount = extract_amount(line)

                    salary_credits.append(
                        {
                            "description": line,
                            "amount": amount,
                        }
                    )

                    total_credits += amount

                # Debit Transactions
                elif "debit" in lower_line:
                    amount = extract_amount(line)

                    if "emi" in lower_line:
                        emi_transactions.append(
                            {
                                "description": line,
                                "amount": amount,
                            }
                        )

                    total_debits += amount

            bank_statement_data = (
                db.query(BankStatementData)
                .filter(
                    BankStatementData.document_id
                    == document.id
                )
                .first()
            )

            if bank_statement_data is None:
                bank_statement_data = BankStatementData(
                    document_id=document.id
                )

                db.add(bank_statement_data)

            bank_statement_data.account_holder_name = (
                account_holder_name
            )

            bank_statement_data.account_number = (
                account_number
            )

            bank_statement_data.bank_name = (
                bank_name
            )

            bank_statement_data.statement_period = (
                statement_period
            )

            bank_statement_data.opening_balance = (
                opening_balance
            )

            bank_statement_data.closing_balance = (
                closing_balance
            )

            bank_statement_data.total_credits = (
                total_credits
            )

            bank_statement_data.total_debits = (
                total_debits
            )

            bank_statement_data.salary_credits = json.dumps(
                salary_credits
            )

            bank_statement_data.emi_transactions = json.dumps(
                emi_transactions
            )

    db.commit()
    db.refresh(document)

    return {
        "application_number": application.application_number,
        "document_id": document.id,
        "document_type": document.document_type,
        "original_filename": document.original_filename,
        "ocr_status": document.ocr_status,
        "extracted_text": document.extracted_text,
        "text_length": result.get(
            "text_length",
            0,
        ),
        "next_step": result.get(
            "next_step"
        ),
        "reasons": result.get(
            "reasons",
            [],
        ),
        "agent": result.get(
            "agent"
        ),
        "agent_version": result.get(
            "agent_version"
        ),
    }


@router.post(
    "/{application_number}/documents/verify"
)
def verify_application_documents(
    application_number: str,
    db: Session = Depends(get_db),
):
    """
    Verify all uploaded documents for an
    existing loan application through the
    existing Document Verification Agent.
    """

    application = (
        db.query(LoanApplication)
        .filter(
            LoanApplication.application_number
            == application_number
        )
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Loan application not found",
        )

    documents = (
        db.query(Document)
        .filter(
            Document.loan_application_id
            == application.id
        )
        .order_by(
            Document.created_at.asc()
        )
        .all()
    )

    if not documents:
        raise HTTPException(
            status_code=400,
            detail="No documents found for this application",
        )

    result = document_verification_agent.analyze(
        application=application,
        documents=documents,
    )

    verification_status = result.get(
        "verification_status",
        "Pending",
    )

    for document in documents:
        document.verification_status = (
            verification_status
        )

    db.commit()

    return {
        "application_id": application.id,
        "application_number": application.application_number,
        "verification_status": verification_status,
        "required_documents": result.get(
            "required_documents",
            [],
        ),
        "uploaded_documents": result.get(
            "uploaded_documents",
            [],
        ),
        "missing_documents": result.get(
            "missing_documents",
            [],
        ),
        "suspicious_documents": result.get(
            "suspicious_documents",
            [],
        ),
        "document_count": result.get(
            "document_count",
            len(documents),
        ),
        "next_step": result.get(
            "next_step"
        ),
        "reasons": result.get(
            "reasons",
            [],
        ),
        "agent": result.get(
            "agent"
        ),
        "agent_version": result.get(
            "agent_version"
        ),
    }