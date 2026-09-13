from pathlib import Path
from typing import Any


REQUIRED_DOCUMENT_TYPES = {
    "PAN",
    "Aadhaar",
    "Salary Slip",
    "Bank Statement",
}


def verify_documents(documents: list[Any]) -> dict:
    """
    Verify required documents and detect basic
    document integrity and processing issues.
    """

    uploaded_types = {
        document.document_type
        for document in documents
        if document.document_type
    }

    missing_documents = sorted(
        REQUIRED_DOCUMENT_TYPES - uploaded_types
    )

    suspicious_documents = []

    for document in documents:

        # 1. Filename check
        if not document.original_filename:
            suspicious_documents.append({
                "document_id": document.id,
                "reason": "Missing original filename",
            })

        # 2. File path check
        if not document.file_path:
            suspicious_documents.append({
                "document_id": document.id,
                "reason": "Missing file path",
            })
        else:
            file_path = Path(document.file_path)

            if not file_path.exists():
                suspicious_documents.append({
                    "document_id": document.id,
                    "reason": "Document file does not exist",
                })

        # 3. Upload status check
        if document.upload_status != "Uploaded":
            suspicious_documents.append({
                "document_id": document.id,
                "reason": "Document upload is not completed",
            })

        # 4. OCR status check
        if document.ocr_status == "Failed":
            suspicious_documents.append({
                "document_id": document.id,
                "reason": "OCR processing failed",
            })

        # 5. OCR text check
        if (
            document.ocr_status == "Completed"
            and not document.extracted_text
        ):
            suspicious_documents.append({
                "document_id": document.id,
                "reason": "OCR completed but no text was extracted",
            })

        # 6. Unsupported document type check
        if document.document_type not in REQUIRED_DOCUMENT_TYPES:
            suspicious_documents.append({
                "document_id": document.id,
                "reason": "Unsupported document type",
            })

        # 7. Suspicious OCR content signals
        if document.extracted_text:
            extracted_text = document.extracted_text.lower()

            suspicious_keywords = [
    "edited",
    "modified",
    "duplicate",
    "fake",
]

            detected_keywords = [
                keyword
                for keyword in suspicious_keywords
                if keyword in extracted_text
            ]

            if detected_keywords:
                suspicious_documents.append({
                    "document_id": document.id,
                    "reason": "Suspicious keywords detected in extracted text",
                    "signals": detected_keywords,
                })

                # 8. Document type and OCR content consistency check
        if document.extracted_text:
            extracted_text = document.extracted_text.lower()

            if document.document_type == "Salary Slip":
                salary_keywords = [
                    "salary",
                    "payslip",
                    "gross earning",
                    "net amount",
                    "basic",
                    "deduction",
                    "employee id",
                ]

                matched_keywords = [
                    keyword
                    for keyword in salary_keywords
                    if keyword in extracted_text
                ]

                if len(matched_keywords) < 2:
                    suspicious_documents.append({
                        "document_id": document.id,
                        "reason": "Document type is Salary Slip but OCR content does not appear to match a salary slip",
                        "signals": matched_keywords,
                    })

            elif document.document_type == "Bank Statement":
                bank_keywords = [
                    "bank",
                    "account",
                    "transaction",
                    "balance",
                    "credit",
                    "debit",
                ]

                matched_keywords = [
                    keyword
                    for keyword in bank_keywords
                    if keyword in extracted_text
                ]

                if len(matched_keywords) < 2:
                    suspicious_documents.append({
                        "document_id": document.id,
                        "reason": "Document type is Bank Statement but OCR content does not appear to match a bank statement",
                        "signals": matched_keywords,
                    })

            elif document.document_type == "PAN":
                pan_keywords = [
                    "income tax department",
                    "permanent account number",
                    "pan",
                    "signature",
                ]

                matched_keywords = [
                    keyword
                    for keyword in pan_keywords
                    if keyword in extracted_text
                ]

                if len(matched_keywords) < 1:
                    suspicious_documents.append({
                        "document_id": document.id,
                        "reason": "Document type is PAN but OCR content does not appear to match a PAN document",
                        "signals": matched_keywords,
                    })

            elif document.document_type == "Aadhaar":
                aadhaar_keywords = [
                    "aadhaar",
                    "government of india",
                    "uidai",
                    "unique identification",
                ]

                matched_keywords = [
                    keyword
                    for keyword in aadhaar_keywords
                    if keyword in extracted_text
                ]

                if len(matched_keywords) < 1:
                    suspicious_documents.append({
                        "document_id": document.id,
                        "reason": "Document type is Aadhaar but OCR content does not appear to match an Aadhaar document",
                        "signals": matched_keywords,
                    })

    if missing_documents:
        status = "Incomplete"
    elif suspicious_documents:
        status = "Warning"
    else:
        status = "Verified"

    return {
        "status": status,
        "required_documents": sorted(
            REQUIRED_DOCUMENT_TYPES
        ),
        "uploaded_documents": sorted(
            uploaded_types
        ),
        "missing_documents": missing_documents,
        "suspicious_documents": suspicious_documents,
    }