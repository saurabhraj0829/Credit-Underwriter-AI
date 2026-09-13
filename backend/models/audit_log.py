from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String, Text

from backend.database.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    application_id = Column(Integer, nullable=True, index=True)
    application_number = Column(String(50), nullable=True, index=True)

    event_type = Column(String(100), nullable=False, index=True)
    event_status = Column(String(50), nullable=False)

    agent_name = Column(String(100), nullable=True)

    message = Column(Text, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )