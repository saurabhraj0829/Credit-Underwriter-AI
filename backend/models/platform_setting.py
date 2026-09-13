from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String, Text

from backend.database.database import Base


class PlatformSetting(Base):
    __tablename__ = "platform_settings"

    id = Column(Integer, primary_key=True, index=True)

    setting_key = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    setting_value = Column(
        Text,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )