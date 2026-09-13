from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database.database import init_db
from backend.models.loan_application import LoanApplication
from backend.models.underwriting_decision import UnderwritingDecision
from backend.models.document import Document
from backend.models.salary_slip_data import SalarySlipData
from backend.models.income_verification import IncomeVerification
from backend.models.bank_statement_verification import BankStatementVerification
from backend.models.bank_statement_data import BankStatementData
from backend.api.loan_applications import router as loan_applications_router
from backend.api.documents import router as documents_router
from backend.api.reports import router as reports_router
from backend.models.audit_log import AuditLog
from backend.api.audit_logs import router as audit_logs_router
from backend.models.platform_setting import PlatformSetting
from backend.api.settings import router as settings_router
from backend.models.notification_setting import NotificationSetting
from backend.api.notifications import router as notifications_router
from backend.models.security_setting import SecuritySetting
from backend.api.security import router as security_router

app = FastAPI(
    title="Credit Underwriter AI",
    description="Enterprise AI Loan Underwriting Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_router)
app.include_router(loan_applications_router)
app.include_router(reports_router)
app.include_router(audit_logs_router)
app.include_router(settings_router)
app.include_router(notifications_router)
app.include_router(security_router)

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/")
async def root():
    return {
        "message": "Credit Underwriter AI API is running",
        "status": "online",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "credit-underwriter-ai",
    }