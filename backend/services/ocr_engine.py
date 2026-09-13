from pathlib import Path

import pymupdf
import pytesseract


TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract selectable text from a PDF using PyMuPDF.
    """

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Document file not found: {file_path}"
        )

    document = pymupdf.open(path)

    extracted_text = []

    for page in document:
        text = page.get_text()

        if text.strip():
            extracted_text.append(text.strip())

    document.close()

    return "\n".join(extracted_text).strip()


def extract_text_from_scanned_pdf(file_path: str) -> str:
    """
    Extract text from scanned/image-based PDF pages
    using PyMuPDF rendering and Tesseract OCR.
    """

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Document file not found: {file_path}"
        )

    document = pymupdf.open(path)

    extracted_text = []

    for page in document:
        text_page = page.get_textpage_ocr(
            language="eng",
    dpi=300,
    full=True,
    tessdata=r"C:\Program Files\Tesseract-OCR\tessdata",
        )

        text = page.get_text(
            "text",
            textpage=text_page,
        )

        if text.strip():
            extracted_text.append(text.strip())

    document.close()

    return "\n".join(extracted_text).strip()


def extract_text_from_document(file_path: str) -> str:
    """
    Extract text from a PDF document.

    Uses normal PyMuPDF extraction first.
    If no selectable text exists, falls back
    to OCR for scanned PDF pages.
    """

    path = Path(file_path)

    if path.suffix.lower() != ".pdf":
        raise ValueError(
            "Only PDF documents are supported."
        )

    extracted_text = extract_text_from_pdf(file_path)

    if extracted_text:
        return extracted_text

    return extract_text_from_scanned_pdf(file_path)