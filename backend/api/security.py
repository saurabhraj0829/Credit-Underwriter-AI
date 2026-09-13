from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.security_setting import SecuritySetting


router = APIRouter(
    prefix="/api/security",
    tags=["Security"],
)


DEFAULT_SECURITY_SETTINGS = {
    "decision_traceability": True,
    "user_activity_logging": True,
    "ai_decision_logging": True,
    "document_access_logging": True,
    "security_event_monitoring": True,
}


class SecuritySettingPayload(BaseModel):
    setting_key: str
    enabled: bool


@router.get("/")
def get_security_settings(
    db: Session = Depends(get_db),
):
    rows = db.query(SecuritySetting).all()

    settings = {
        key: value
        for key, value in DEFAULT_SECURITY_SETTINGS.items()
    }

    for row in rows:
        settings[row.setting_key] = row.enabled

    return {
        "settings": settings,
    }


@router.put("/")
def update_security_setting(
    payload: SecuritySettingPayload,
    db: Session = Depends(get_db),
):
    if payload.setting_key not in DEFAULT_SECURITY_SETTINGS:
        return {
            "message": "Unknown security setting.",
            "updated": False,
        }

    setting = (
        db.query(SecuritySetting)
        .filter(
            SecuritySetting.setting_key
            == payload.setting_key
        )
        .first()
    )

    if setting:
        setting.enabled = payload.enabled
    else:
        setting = SecuritySetting(
            setting_key=payload.setting_key,
            enabled=payload.enabled,
        )
        db.add(setting)

    db.commit()

    return {
        "message": "Security setting updated successfully.",
        "updated": True,
        "setting_key": payload.setting_key,
        "enabled": payload.enabled,
    }