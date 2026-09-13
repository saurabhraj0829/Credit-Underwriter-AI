from typing import Any

from backend.services.notification_service import (
    build_underwriting_notification,
)


class NotificationAgent:
    """
    Notification Agent.

    Responsibilities:
    - Convert final underwriting results into
      notification-ready information
    - Prepare applicant-facing notification
    - Preserve the final underwriting decision
    - Define notification channels and delivery status

    This agent does not make or modify underwriting decisions.
    """

    name = "Notification Agent"
    version = "1.0"

    def analyze(
        self,
        application: Any,
        decision_result: dict[str, Any],
        audit_result: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Generate notification-ready output.
        """

        notification_result = (
            build_underwriting_notification(
                application=application,
                decision_result=decision_result,
                audit_result=audit_result,
            )
        )

        return {
            "agent": self.name,
            "agent_version": self.version,
            "application_id": int(
                application.id
            ),
            **notification_result,
        }


notification_agent = NotificationAgent()