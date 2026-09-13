from pathlib import Path

import pymupdf

from backend.ai.rag.knowledge_base import (
    KnowledgeDocument,
    knowledge_base,
)


KNOWLEDGE_BASE_DIR = (
    Path(__file__).resolve().parents[3]
    / "docs"
    / "rag_knowledge_base"
)


POLICY_METADATA = {
    "loan_policy.pdf": {
        "document_id": "POL-LOAN-001",
        "title": "Loan Underwriting Policy",
        "category": "Loan Policy",
    },
    "credit_policy.pdf": {
        "document_id": "POL-CREDIT-001",
        "title": "Credit Risk & Credit Policy",
        "category": "Credit Policy",
    },
    "kyc_policy.pdf": {
        "document_id": "POL-KYC-001",
        "title": "Know Your Customer & Customer Due Diligence Policy",
        "category": "KYC Policy",
    },
    "aml_policy.pdf": {
        "document_id": "POL-AML-001",
        "title": "Anti-Money Laundering & Fraud Risk Policy",
        "category": "AML / Fraud Policy",
    },
    "rbi_guidelines.pdf": {
        "document_id": "POL-RBI-001",
        "title": "RBI Regulatory Guidelines Reference",
        "category": "Regulatory Guidance",
    },
    "approval_matrix.pdf": {
        "document_id": "POL-APPROVAL-001",
        "title": "Underwriting Approval & Delegation Matrix",
        "category": "Approval Matrix",
    },
    "internal_sop.pdf": {
        "document_id": "POL-SOP-001",
        "title": "Underwriting Operations Standard Operating Procedure",
        "category": "Internal SOP",
    },
    "risk_rules.pdf": {
        "document_id": "POL-RISK-001",
        "title": "Credit Risk Rules & Decision Rulebook",
        "category": "Risk Rules",
    },
}


def extract_pdf_text(pdf_path: Path) -> str:
    """
    Extract text from all pages of a PDF.
    """

    pages: list[str] = []

    with pymupdf.open(pdf_path) as pdf:
        for page in pdf:
            text = page.get_text("text")

            if text and text.strip():
                pages.append(text.strip())

    return "\n\n".join(pages)


def load_policy_documents() -> int:
    """
    Load all approved PDF policy documents
    into the RAG knowledge base.
    """

    if not KNOWLEDGE_BASE_DIR.exists():
        raise FileNotFoundError(
            f"Knowledge base directory not found: "
            f"{KNOWLEDGE_BASE_DIR}"
        )

    loaded_count = 0

    for filename, metadata in POLICY_METADATA.items():

        pdf_path = KNOWLEDGE_BASE_DIR / filename

        if not pdf_path.exists():
            print(
                f"Warning: Policy document missing: "
                f"{filename}"
            )
            continue

        content = extract_pdf_text(pdf_path)

        if not content.strip():
            print(
                f"Warning: No text extracted from: "
                f"{filename}"
            )
            continue

        register_policy_document(
            document_id=metadata["document_id"],
            title=metadata["title"],
            category=metadata["category"],
            content=content,
            source=str(pdf_path),
        )

        loaded_count += 1

        print(
            f"Loaded: {filename} "
            f"({len(content)} characters)"
        )

    return loaded_count


def register_policy_document(
    document_id: str,
    title: str,
    category: str,
    content: str,
    source: str,
) -> None:
    """
    Register one approved policy document
    in the knowledge base.
    """

    document = KnowledgeDocument(
        document_id=document_id,
        title=title,
        category=category,
        content=content,
        source=source,
    )

    knowledge_base.add_document(document)