from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.notification_setting import NotificationSetting


router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"],
)


DEFAULT_NOTIFICATION_SETTINGS = {
    "underwriting_decision_alerts": True,
    "high_risk_alerts": True,
    "fraud_alerts": True,
    "compliance_alerts": True,
    "document_verification_alerts": True,
}


class NotificationSettingPayload(BaseModel):
    setting_key: str
    enabled: bool


@router.get("/")
def get_notification_settings(
    db: Session = Depends(get_db),
):
    rows = db.query(NotificationSetting).all()

    settings = {
        key: value
        for key, value in DEFAULT_NOTIFICATION_SETTINGS.items()
    }

    for row in rows:
        settings[row.setting_key] = row.enabled

    return {
        "settings": settings,
    }


@router.put("/")
def update_notification_setting(
    payload: NotificationSettingPayload,
    db: Session = Depends(get_db),
):
    if payload.setting_key not in DEFAULT_NOTIFICATION_SETTINGS:
        return {
            "message": "Unknown notification setting.",
            "updated": False,
        }

    setting = (
        db.query(NotificationSetting)
        .filter(
            NotificationSetting.setting_key
            == payload.setting_key
        )
        .first()
    )

    if setting:
        setting.enabled = payload.enabled
    else:
        setting = NotificationSetting(
            setting_key=payload.setting_key,
            enabled=payload.enabled,
        )
        db.add(setting)

    db.commit()

    return {
        "message": "Notification setting updated successfully.",
        "updated": True,
        "setting_key": payload.setting_key,
        "enabled": payload.enabled,
    }