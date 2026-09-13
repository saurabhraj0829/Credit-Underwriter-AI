import os

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.platform_setting import PlatformSetting


router = APIRouter(
    prefix="/api/settings",
    tags=["Settings"],
)


class SettingsPayload(BaseModel):
    organization_name: str
    default_currency: str
    auto_refresh_dashboard: bool
    ai_recommendations: bool


DEFAULT_SETTINGS = {
    "organization_name": "Credit Underwriter AI",
    "default_currency": "INR",
    "auto_refresh_dashboard": True,
    "ai_recommendations": True,
}


@router.get("/")
def get_settings(
    db: Session = Depends(get_db),
):
    settings = {}

    rows = db.query(PlatformSetting).all()

    for row in rows:
        value = row.setting_value

        if row.setting_key in {
            "auto_refresh_dashboard",
            "ai_recommendations",
        }:
            value = value.lower() == "true"

        settings[row.setting_key] = value

    for key, default_value in DEFAULT_SETTINGS.items():
        settings.setdefault(key, default_value)

    return settings

@router.get("/ai-configuration")
def get_ai_configuration():
    groq_api_key = os.getenv("GROQ_API_KEY")

    return {
        "provider": "Groq",
        "model": "openai/gpt-oss-120b",
        "temperature": 0,
        "api_key_configured": bool(groq_api_key),
        "api_key_exposed": False,
        "recommendations_controlled_by": "General Settings",
    }


@router.put("/")
def update_settings(
    payload: SettingsPayload,
    db: Session = Depends(get_db),
):
    values = {
        "organization_name": payload.organization_name,
        "default_currency": payload.default_currency,
        "auto_refresh_dashboard": str(
            payload.auto_refresh_dashboard
        ).lower(),
        "ai_recommendations": str(
            payload.ai_recommendations
        ).lower(),
    }

    for key, value in values.items():
        setting = (
            db.query(PlatformSetting)
            .filter(PlatformSetting.setting_key == key)
            .first()
        )

        if setting:
            setting.setting_value = value
        else:
            setting = PlatformSetting(
                setting_key=key,
                setting_value=value,
            )
            db.add(setting)

    db.commit()

    return {
        "message": "Settings updated successfully.",
        "settings": payload.model_dump(),
    }