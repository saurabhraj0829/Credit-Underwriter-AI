from __future__ import annotations

import hashlib
import re
from pathlib import Path
from typing import Any


class FraudDetectionAgent:
    """
    Fraud Detection Agent for Credit Underwriter AI.

    Detects:
    - Duplicate documents
    - Duplicate OCR content
    - Suspicious document signals
    - File integrity issues
    - Suspicious transaction patterns
    - Abnormal transaction amounts

    Returns an explainable fraud assessment.
    """

    SUSPICIOUS_KEYWORDS = {
        "fake",
        "forged",
        "fraud",
        "invalid",
        "edited",
        "modified",
        "tampered",
        "sample",
        "demo",
        "duplicate",
    }

    def analyze(
        self,
        documents: list[Any] | None = None,
        bank_statement_data: Any | None = None,
    ) -> dict[str, Any]:
        documents = documents or []

        reasons: list[dict[str, Any]] = []
        signals: list[dict[str, Any]] = []

        fraud_score = 0.0

        # ---------------------------------------------------------
        # 1. Duplicate document detection
        # ---------------------------------------------------------

        filename_map: dict[str, list[int]] = {}
        content_map: dict[str, list[int]] = {}
        hash_map: dict[str, list[int]] = {}

        for document in documents:
            document_id = getattr(document, "id", None)

            filename = (
                getattr(document, "original_filename", None)
                or ""
            ).strip().lower()

            if filename:
                filename_map.setdefault(
                    filename,
                    [],
                ).append(document_id)

            extracted_text = (
                getattr(document, "extracted_text", None)
                or ""
            ).strip()

            if extracted_text:
                content_hash = hashlib.sha256(
                    extracted_text.encode("utf-8")
                ).hexdigest()

                content_map.setdefault(
                    content_hash,
                    [],
                ).append(document_id)

            file_path_value = getattr(
                document,
                "file_path",
                None,
            )

            if file_path_value:
                file_path = Path(file_path_value)

                if file_path.exists() and file_path.is_file():
                    try:
                        file_hash = hashlib.sha256(
                            file_path.read_bytes()
                        ).hexdigest()

                        hash_map.setdefault(
                            file_hash,
                            [],
                        ).append(document_id)

                    except OSError:
                        reasons.append({
                            "document_id": document_id,
                            "reason": "Unable to read document file for integrity analysis",
                        })

                        fraud_score += 5

        for filename, document_ids in filename_map.items():
            if len(document_ids) > 1:
                signals.append({
                    "type": "Duplicate Filename",
                    "document_ids": document_ids,
                    "filename": filename,
                })

                reasons.append({
                    "reason": "Multiple documents use the same filename",
                    "document_ids": document_ids,
                })

                fraud_score += 10

        for content_hash, document_ids in content_map.items():
            if len(document_ids) > 1:
                signals.append({
                    "type": "Duplicate OCR Content",
                    "document_ids": document_ids,
                    "content_hash": content_hash,
                })

                reasons.append({
                    "reason": "Multiple documents contain identical OCR content",
                    "document_ids": document_ids,
                })

                fraud_score += 20

        for file_hash, document_ids in hash_map.items():
            if len(document_ids) > 1:
                signals.append({
                    "type": "Duplicate File",
                    "document_ids": document_ids,
                    "file_hash": file_hash,
                })

                reasons.append({
                    "reason": "Multiple uploaded documents contain the same file",
                    "document_ids": document_ids,
                })

                fraud_score += 25

        # ---------------------------------------------------------
        # 2. Suspicious OCR content detection
        # ---------------------------------------------------------

        for document in documents:
            document_id = getattr(document, "id", None)

            extracted_text = (
                getattr(document, "extracted_text", None)
                or ""
            ).lower()

            if not extracted_text:
                continue

            detected_keywords = sorted({
                keyword
                for keyword in self.SUSPICIOUS_KEYWORDS
                if re.search(
                    rf"\b{re.escape(keyword)}\b",
                    extracted_text,
                )
            })

            if detected_keywords:
                signals.append({
                    "type": "Suspicious OCR Keywords",
                    "document_id": document_id,
                    "keywords": detected_keywords,
                })

                reasons.append({
                    "document_id": document_id,
                    "reason": "Suspicious keywords detected in OCR content",
                    "signals": detected_keywords,
                })

                fraud_score += min(
                    20,
                    len(detected_keywords) * 5,
                )

        # ---------------------------------------------------------
        # 3. Document integrity checks
        # ---------------------------------------------------------

        for document in documents:
            document_id = getattr(document, "id", None)

            upload_status = getattr(
                document,
                "upload_status",
                None,
            )

            ocr_status = getattr(
                document,
                "ocr_status",
                None,
            )

            file_path_value = getattr(
                document,
                "file_path",
                None,
            )

            if upload_status != "Uploaded":
                signals.append({
                    "type": "Upload Integrity Issue",
                    "document_id": document_id,
                    "status": upload_status,
                })

                reasons.append({
                    "document_id": document_id,
                    "reason": "Document upload was not completed",
                })

                fraud_score += 10

            if ocr_status == "Failed":
                signals.append({
                    "type": "OCR Processing Failure",
                    "document_id": document_id,
                })

                reasons.append({
                    "document_id": document_id,
                    "reason": "OCR processing failed",
                })

                fraud_score += 10

            if file_path_value:
                file_path = Path(file_path_value)

                if not file_path.exists():
                    signals.append({
                        "type": "Missing File",
                        "document_id": document_id,
                    })

                    reasons.append({
                        "document_id": document_id,
                        "reason": "Uploaded document file cannot be found",
                    })

                    fraud_score += 15

        # ---------------------------------------------------------
        # 4. Bank transaction anomaly detection
        # ---------------------------------------------------------

        if bank_statement_data is not None:
            emi_transactions = getattr(
                bank_statement_data,
                "emi_transactions",
                None,
            )

            if isinstance(emi_transactions, str):
                emi_transactions = [
                    line.strip()
                    for line in emi_transactions.splitlines()
                    if line.strip()
                ]

            if not isinstance(emi_transactions, list):
                emi_transactions = []

            emi_amounts: list[float] = []

            for transaction in emi_transactions:
                matches = re.findall(
                    r"\d[\d,]*(?:\.\d{1,2})?",
                    str(transaction),
                )

                if matches:
                    try:
                        amount = float(
                            matches[-1].replace(",", "")
                        )

                        if amount > 0:
                            emi_amounts.append(amount)

                    except ValueError:
                        continue

            if len(emi_amounts) >= 3:
                unique_amounts = set(
                    round(amount, 2)
                    for amount in emi_amounts
                )

                if len(unique_amounts) == 1:
                    signals.append({
                        "type": "Repeated EMI Pattern",
                        "emi_count": len(emi_amounts),
                        "emi_amount": emi_amounts[0],
                    })

                else:
                    signals.append({
                        "type": "Variable EMI Pattern",
                        "emi_amounts": emi_amounts,
                    })

            # Extremely large single EMI compared with others
            if len(emi_amounts) >= 2:
                average_emi = sum(emi_amounts) / len(
                    emi_amounts
                )

                for amount in emi_amounts:
                    if amount > average_emi * 3:
                        signals.append({
                            "type": "Abnormal EMI Amount",
                            "amount": amount,
                            "average_emi": round(
                                average_emi,
                                2,
                            ),
                        })

                        reasons.append({
                            "reason": "Bank statement contains an unusually large EMI transaction",
                            "amount": amount,
                        })

                        fraud_score += 10

        # ---------------------------------------------------------
        # 5. Normalize fraud score
        # ---------------------------------------------------------

        fraud_score = min(
            round(fraud_score, 2),
            100.0,
        )

        if fraud_score < 20:
            fraud_category = "Low"

        elif fraud_score < 50:
            fraud_category = "Medium"

        elif fraud_score < 75:
            fraud_category = "High"

        else:
            fraud_category = "Critical"

        # ---------------------------------------------------------
        # 6. Final assessment
        # ---------------------------------------------------------

        if fraud_score >= 75:
            recommendation = "Reject / Fraud Investigation"

        elif fraud_score >= 50:
            recommendation = "Manual Review"

        elif fraud_score >= 20:
            recommendation = "Enhanced Verification"

        else:
            recommendation = "No Immediate Fraud Concern"

        return {
            "fraud_score": fraud_score,
            "fraud_category": fraud_category,
            "recommendation": recommendation,
            "signals": signals,
            "reasons": reasons,
            "documents_analyzed": len(documents),
            "model_status": "Rule-Based Fraud Engine",
        }


fraud_detection_agent = FraudDetectionAgent()