import { useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

type SettingsData = {
  organization_name: string;
  default_currency: string;
  auto_refresh_dashboard: boolean;
  ai_recommendations: boolean;
};

type AIConfiguration = {
  provider: string;
  model: string;
  temperature: number;
  api_key_configured: boolean;
  api_key_exposed: boolean;
  recommendations_controlled_by: string;
};

type NotificationSettings = {
  underwriting_decision_alerts: boolean;
  high_risk_alerts: boolean;
  fraud_alerts: boolean;
  compliance_alerts: boolean;
  document_verification_alerts: boolean;
};

type SecuritySettings = {
  decision_traceability: boolean;
  user_activity_logging: boolean;
  ai_decision_logging: boolean;
  document_access_logging: boolean;
  security_event_monitoring: boolean;
};

type SettingsSection =
  | "General"
  | "Underwriting"
  | "AI Configuration"
  | "Notifications"
  | "Security";

const DEFAULT_SETTINGS: SettingsData = {
  organization_name: "Credit Underwriter AI",
  default_currency: "INR",
  auto_refresh_dashboard: true,
  ai_recommendations: true,
};

function Settings() {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("General");

  const [settings, setSettings] =
    useState<SettingsData>(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(true);

  const [aiConfiguration, setAIConfiguration] =
    useState<AIConfiguration | null>(null);

  const [aiConfigurationLoading, setAIConfigurationLoading] =
    useState(false);

  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      underwriting_decision_alerts: true,
      high_risk_alerts: true,
      fraud_alerts: true,
      compliance_alerts: true,
      document_verification_alerts: true,
    });

  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationSaving, setNotificationSaving] = useState("");

  const [securitySettings, setSecuritySettings] =
    useState<SecuritySettings>({
      decision_traceability: true,
      user_activity_logging: true,
      ai_decision_logging: true,
      document_access_logging: true,
      security_event_monitoring: true,
    });

  const [securityLoading, setSecurityLoading] = useState(false);
  const [securitySaving, setSecuritySaving] = useState("");

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError("");
        setAIConfigurationLoading(true);

        const response = await fetch(
          `${API_BASE_URL}/api/settings/`
        );

        if (!response.ok) {
          throw new Error("Failed to load platform settings.");
        }

        const data: SettingsData = await response.json();

        setSettings({
          organization_name:
            data.organization_name ??
            DEFAULT_SETTINGS.organization_name,

          default_currency:
            data.default_currency ??
            DEFAULT_SETTINGS.default_currency,

          auto_refresh_dashboard:
            data.auto_refresh_dashboard ??
            DEFAULT_SETTINGS.auto_refresh_dashboard,

          ai_recommendations:
            data.ai_recommendations ??
            DEFAULT_SETTINGS.ai_recommendations,
        });

        const aiResponse = await fetch(
          `${API_BASE_URL}/api/settings/ai-configuration`
        );

        if (!aiResponse.ok) {
          throw new Error("Failed to load AI configuration.");
        }

        const aiData: AIConfiguration =
          await aiResponse.json();

        setAIConfiguration(aiData);

        setNotificationLoading(true);

        const notificationResponse = await fetch(
          `${API_BASE_URL}/api/notifications/`
        );

        if (!notificationResponse.ok) {
          throw new Error("Failed to load notification settings.");
        }

        const notificationData = await notificationResponse.json();

        setNotificationSettings({
          underwriting_decision_alerts:
            notificationData.settings?.underwriting_decision_alerts ?? true,
          high_risk_alerts:
            notificationData.settings?.high_risk_alerts ?? true,
          fraud_alerts:
            notificationData.settings?.fraud_alerts ?? true,
          compliance_alerts:
            notificationData.settings?.compliance_alerts ?? true,
          document_verification_alerts:
            notificationData.settings?.document_verification_alerts ?? true,
        });

        setSecurityLoading(true);

        const securityResponse = await fetch(
          `${API_BASE_URL}/api/security/`
        );

        if (!securityResponse.ok) {
          throw new Error("Failed to load security settings.");
        }

        const securityData = await securityResponse.json();

        setSecuritySettings({
          decision_traceability:
            securityData.settings?.decision_traceability ?? true,
          user_activity_logging:
            securityData.settings?.user_activity_logging ?? true,
          ai_decision_logging:
            securityData.settings?.ai_decision_logging ?? true,
          document_access_logging:
            securityData.settings?.document_access_logging ?? true,
          security_event_monitoring:
            securityData.settings?.security_event_monitoring ?? true,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load platform settings."
        );
      } finally {
        setLoading(false);
        setAIConfigurationLoading(false);
        setNotificationLoading(false);
        setSecurityLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSetting = <K extends keyof SettingsData>(
    key: K,
    value: SettingsData[K]
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSuccess("");
    setError("");
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_BASE_URL}/api/settings/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.detail ||
            "Failed to save platform settings."
        );
      }

      const data = await response.json();

      if (data.settings) {
        setSettings(data.settings);
      }

      setSuccess("Settings saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save platform settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateNotificationSetting = async (
    key: keyof NotificationSettings,
    value: boolean
  ) => {
    const previousValue = notificationSettings[key];

    setNotificationSettings((current) => ({
      ...current,
      [key]: value,
    }));
    setNotificationSaving(key);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            setting_key: key,
            enabled: value,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.detail ||
            "Failed to update notification setting."
        );
      }

      setSuccess("Notification setting updated successfully.");
    } catch (err) {
      setNotificationSettings((current) => ({
        ...current,
        [key]: previousValue,
      }));

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update notification setting."
      );
    } finally {
      setNotificationSaving("");
    }
  };

  const renderNotifications = () => {
    const notificationItems: {
      key: keyof NotificationSettings;
      title: string;
      description: string;
    }[] = [
      {
        key: "underwriting_decision_alerts",
        title: "Underwriting Decision Alerts",
        description:
          "Receive alerts when an underwriting decision is generated.",
      },
      {
        key: "high_risk_alerts",
        title: "High Risk Alerts",
        description:
          "Receive alerts when an application is classified as high risk.",
      },
      {
        key: "fraud_alerts",
        title: "Fraud Alerts",
        description:
          "Receive alerts when fraud detection identifies a significant risk.",
      },
      {
        key: "compliance_alerts",
        title: "Compliance Alerts",
        description:
          "Receive alerts when policy compliance requires attention.",
      },
      {
        key: "document_verification_alerts",
        title: "Document Verification Alerts",
        description:
          "Receive alerts when submitted documents require verification.",
      },
    ];

    return (
      <>
        <div>
          <h2 className="text-sm font-bold text-white">
            Notifications
          </h2>

          <p className="mt-1 text-[11px] text-[#756D65]">
            Control operational alerts generated by the underwriting platform
          </p>
        </div>

        {notificationLoading ? (
          <div className="mt-6 flex min-h-[260px] items-center justify-center text-xs text-[#756D65]">
            Loading notification settings...
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {notificationItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 rounded-xl border border-[#28221C] bg-[#171512] px-4 py-4"
              >
                <div>
                  <p className="text-xs font-semibold text-white">
                    {item.title}
                  </p>

                  <p className="mt-1 max-w-xl text-[10px] leading-4 text-[#756D65]">
                    {item.description}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {notificationSaving === item.key && (
                    <span className="text-[9px] font-semibold text-[#756D65]">
                      Saving...
                    </span>
                  )}

                  <Toggle
                    enabled={notificationSettings[item.key]}
                    onClick={() =>
                      updateNotificationSetting(
                        item.key,
                        !notificationSettings[item.key]
                      )
                    }
                  />
                </div>
              </div>
            ))}

            {error && (
              <div className="rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-xs font-semibold text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 px-4 py-3 text-xs font-semibold text-emerald-400">
                {success}
              </div>
            )}

            <div className="rounded-xl border border-[#30271F] bg-[#12100E] px-4 py-3">
              <p className="text-[10px] leading-5 text-[#756D65]">
                Notification preferences are stored in the backend and remain
                unchanged after refreshing the application.
              </p>
            </div>
          </div>
        )}
      </>
    );
  };

  const Toggle = ({
    enabled,
    onClick,
  }: {
    enabled: boolean;
    onClick: () => void;
  }) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={enabled ? "Enabled" : "Disabled"}
        onClick={onClick}
        className={`relative flex h-7 w-12 shrink-0 items-center rounded-full border p-1 transition-all duration-200 ${
          enabled
            ? "border-[#806331] bg-[#806331]"
            : "border-[#3A3027] bg-[#211C18]"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
            enabled
              ? "translate-x-5"
              : "translate-x-0"
          }`}
        />

        <span
          className={`absolute text-[7px] font-bold uppercase ${
            enabled
              ? "left-1.5 text-white/80"
              : "right-1.5 text-[#756D65]"
          }`}
        >
          {enabled ? "ON" : "OFF"}
        </span>
      </button>
    );
  };

  const renderGeneralSettings = () => {
    return (
      <>
        <div>
          <h2 className="text-sm font-bold text-white">
            General Settings
          </h2>

          <p className="mt-1 text-[11px] text-[#756D65]">
            Basic platform configuration
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center text-xs text-[#756D65]">
            Loading settings...
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {/* Organization */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#777068]">
                Organization Name
              </label>

              <input
                type="text"
                value={settings.organization_name}
                onChange={(event) =>
                  updateSetting(
                    "organization_name",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-[#342A22] bg-[#171512] px-4 py-3 text-xs text-white outline-none transition-all focus:border-[#806331] focus:shadow-[0_0_18px_rgba(200,155,60,0.06)]"
              />
            </div>

            {/* Default Currency */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#777068]">
                Default Currency
              </label>

              <select
                value={settings.default_currency}
                onChange={(event) =>
                  updateSetting(
                    "default_currency",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-[#342A22] bg-[#171512] px-4 py-3 text-xs text-[#CFC6BC] outline-none transition-all focus:border-[#806331]"
              >
                <option value="INR">
                  INR - Indian Rupee
                </option>

                <option value="USD">
                  USD - US Dollar
                </option>

                <option value="EUR">
                  EUR - Euro
                </option>

                <option value="GBP">
                  GBP - British Pound
                </option>
              </select>
            </div>

            {/* Auto Refresh */}
            <div className="flex items-center justify-between rounded-xl border border-[#28221C] bg-[#171512] px-4 py-4">
              <div>
                <p className="text-xs font-semibold text-white">
                  Auto Refresh Dashboard
                </p>

                <p className="mt-1 text-[10px] text-[#756D65]">
                  Automatically refresh operational metrics
                </p>
              </div>

              <Toggle
                enabled={settings.auto_refresh_dashboard}
                onClick={() =>
                  updateSetting(
                    "auto_refresh_dashboard",
                    !settings.auto_refresh_dashboard
                  )
                }
              />
            </div>

            {/* AI Recommendations */}
            <div className="flex items-center justify-between rounded-xl border border-[#28221C] bg-[#171512] px-4 py-4">
              <div>
                <p className="text-xs font-semibold text-white">
                  AI Recommendations
                </p>

                <p className="mt-1 text-[10px] text-[#756D65]">
                  Allow AI agents to provide underwriting recommendations
                </p>
              </div>

              <Toggle
                enabled={settings.ai_recommendations}
                onClick={() =>
                  updateSetting(
                    "ai_recommendations",
                    !settings.ai_recommendations
                  )
                }
              />
            </div>

            {/* Status Messages */}
            {error && (
              <div className="rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-xs font-semibold text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 px-4 py-3 text-xs font-semibold text-emerald-400">
                {success}
              </div>
            )}

            {/* Save */}
            <div className="flex justify-end border-t border-[#28221C] pt-5">
              <button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                className="rounded-xl border border-[#806331] bg-[#241B11] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#D6A94D] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D6A94D] hover:bg-[#2B2013] hover:shadow-[0_0_24px_rgba(214,169,77,0.14)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderUnderwritingSettings = () => {
    return (
      <>
        <div>
          <h2 className="text-sm font-bold text-white">
            Underwriting Settings
          </h2>

          <p className="mt-1 text-[11px] text-[#756D65]">
            Review the current underwriting workflow configuration
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {/* Decision Engine */}
          <div className="rounded-xl border border-[#28221C] bg-[#171512] px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#777068]">
              Decision Engine
            </p>

            <div className="mt-2 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-white">
                  Deterministic Underwriting Engine
                </p>

                <p className="mt-1 text-[10px] leading-4 text-[#756D65]">
                  Final lending decisions remain governed by the underwriting workflow.
                </p>
              </div>

              <span className="shrink-0 rounded-full border border-emerald-900/50 bg-emerald-950/20 px-3 py-1 text-[9px] font-bold uppercase text-emerald-400">
                Active
              </span>
            </div>
          </div>

          {/* Policy Version */}
          <div className="rounded-xl border border-[#28221C] bg-[#171512] px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#777068]">
              Policy Version
            </p>

            <div className="mt-2 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-white">
                  Current Policy
                </p>

                <p className="mt-1 text-[10px] text-[#756D65]">
                  Policy version used by the underwriting decision workflow.
                </p>
              </div>

              <span className="shrink-0 rounded-full border border-[#5A4527] bg-[#1B150F] px-3 py-1 text-[9px] font-bold text-[#D6A94D]">
                Version 1.0
              </span>
            </div>
          </div>

          {/* Human Review */}
          <div className="rounded-xl border border-[#28221C] bg-[#171512] px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#777068]">
              Human Review
            </p>

            <div className="mt-2 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-white">
                  Manual Review for Warnings
                </p>

                <p className="mt-1 text-[10px] leading-4 text-[#756D65]">
                  Applications requiring additional review can be routed to a human underwriter.
                </p>
              </div>

              <span className="shrink-0 rounded-full border border-[#5A4527] bg-[#1B150F] px-3 py-1 text-[9px] font-bold uppercase text-[#D6A94D]">
                Enabled
              </span>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="rounded-xl border border-[#28221C] bg-[#171512] px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#777068]">
              Risk Assessment
            </p>

            <div className="mt-2 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-white">
                  ML Credit Risk Assessment
                </p>

                <p className="mt-1 text-[10px] leading-4 text-[#756D65]">
                  Current workflow includes automated credit risk scoring and default probability estimation.
                </p>
              </div>

              <span className="shrink-0 rounded-full border border-emerald-900/50 bg-emerald-950/20 px-3 py-1 text-[9px] font-bold uppercase text-emerald-400">
                Active
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-[#30271F] bg-[#12100E] px-4 py-3">
            <p className="text-[10px] leading-5 text-[#756D65]">
              These controls currently reflect the configured underwriting workflow.
              Editable policy thresholds will be added only when they are supported by the backend configuration layer.
            </p>
          </div>
        </div>
      </>
    );
  };

  const renderAIConfiguration = () => {
    return (
      <>
        <div>
          <h2 className="text-sm font-bold text-white">
            AI Configuration
          </h2>

          <p className="mt-1 text-[11px] text-[#756D65]">
            Review the active AI provider and model configuration
          </p>
        </div>

        {aiConfigurationLoading ? (
          <div className="mt-6 flex min-h-[260px] items-center justify-center text-xs text-[#756D65]">
            Loading AI configuration...
          </div>
        ) : aiConfiguration ? (
          <div className="mt-6 space-y-4">
            {/* AI Provider */}
            <div className="rounded-xl border border-[#28221C] bg-[#171512] px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#777068]">
                AI Provider
              </p>

              <div className="mt-2 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-white">
                    Provider
                  </p>

                  <p className="mt-1 text-[10px] text-[#756D65]">
                    Active large language model provider
                  </p>
                </div>

                <span className="shrink-0 rounded-full border border-emerald-900/50 bg-emerald-950/20 px-3 py-1 text-[9px] font-bold uppercase text-emerald-400">
                  {aiConfiguration.provider}
                </span>
              </div>
            </div>

            {/* Model */}
            <div className="rounded-xl border border-[#28221C] bg-[#171512] px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#777068]">
                Model
              </p>

              <div className="mt-2">
                <p className="text-xs font-semibold text-white">
                  {aiConfiguration.model}
                </p>

                <p className="mt-1 text-[10px] text-[#756D65]">
                  Model currently used by the AI underwriting components
                </p>
              </div>
            </div>

            {/* Temperature + API Key */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#28221C] bg-[#171512] px-4 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#777068]">
                  Temperature
                </p>

                <p className="mt-2 text-sm font-bold text-white">
                  {aiConfiguration.temperature}
                </p>

                <p className="mt-1 text-[10px] text-[#756D65]">
                  Deterministic response setting
                </p>
              </div>

              <div className="rounded-xl border border-[#28221C] bg-[#171512] px-4 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#777068]">
                  API Key Status
                </p>

                <span
                  className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[9px] font-bold uppercase ${
                    aiConfiguration.api_key_configured
                      ? "border-emerald-900/50 bg-emerald-950/20 text-emerald-400"
                      : "border-red-900/50 bg-red-950/20 text-red-400"
                  }`}
                >
                  {aiConfiguration.api_key_configured
                    ? "Configured"
                    : "Not Configured"}
                </span>

                <p className="mt-2 text-[10px] text-[#756D65]">
                  Secret credentials are never displayed
                </p>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="rounded-xl border border-[#28221C] bg-[#171512] px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#777068]">
                AI Recommendations
              </p>

              <div className="mt-2 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-white">
                    Recommendation Control
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-[#756D65]">
                    AI recommendation behavior is controlled through General Settings.
                  </p>
                </div>

                <span className="shrink-0 rounded-full border border-[#5A4527] bg-[#1B150F] px-3 py-1 text-[9px] font-bold text-[#D6A94D]">
                  General Settings
                </span>
              </div>
            </div>

            {/* Security Note */}
            <div className="rounded-xl border border-[#30271F] bg-[#12100E] px-4 py-3">
              <p className="text-[10px] leading-5 text-[#756D65]">
                AI configuration is currently read-only. Provider credentials
                and model settings are managed through the backend environment
                configuration.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-4 text-xs text-red-400">
            AI configuration is unavailable.
          </div>
        )}
      </>
    );
  };

  const updateSecuritySetting = async (
    key: keyof SecuritySettings,
    value: boolean
  ) => {
    const previousValue = securitySettings[key];

    setSecuritySettings((current) => ({
      ...current,
      [key]: value,
    }));
    setSecuritySaving(key);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/security/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            setting_key: key,
            enabled: value,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.detail ||
            "Failed to update security setting."
        );
      }

      setSuccess("Security setting updated successfully.");
    } catch (err) {
      setSecuritySettings((current) => ({
        ...current,
        [key]: previousValue,
      }));

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update security setting."
      );
    } finally {
      setSecuritySaving("");
    }
  };

  const renderSecurity = () => {
    const securityItems: {
      key: keyof SecuritySettings;
      title: string;
      description: string;
    }[] = [
      {
        key: "decision_traceability",
        title: "Decision Traceability",
        description:
          "Maintain an auditable trail of underwriting decisions and workflow events.",
      },
      {
        key: "user_activity_logging",
        title: "User Activity Logging",
        description:
          "Record platform user activity for operational accountability and review.",
      },
      {
        key: "ai_decision_logging",
        title: "AI Decision Logging",
        description:
          "Record AI-assisted underwriting activity and supporting workflow events.",
      },
      {
        key: "document_access_logging",
        title: "Document Access Logging",
        description:
          "Record document-related access and verification activity.",
      },
      {
        key: "security_event_monitoring",
        title: "Security Event Monitoring",
        description:
          "Monitor security-related platform events and operational activity.",
      },
    ];

    return (
      <>
        <div>
          <h2 className="text-sm font-bold text-white">
            Security
          </h2>

          <p className="mt-1 text-[11px] text-[#756D65]">
            Control platform security and audit configuration
          </p>
        </div>

        {securityLoading ? (
          <div className="mt-6 flex min-h-[260px] items-center justify-center text-xs text-[#756D65]">
            Loading security settings...
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {securityItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 rounded-xl border border-[#28221C] bg-[#171512] px-4 py-4"
              >
                <div>
                  <p className="text-xs font-semibold text-white">
                    {item.title}
                  </p>

                  <p className="mt-1 max-w-xl text-[10px] leading-4 text-[#756D65]">
                    {item.description}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {securitySaving === item.key && (
                    <span className="text-[9px] font-semibold text-[#756D65]">
                      Saving...
                    </span>
                  )}

                  <Toggle
                    enabled={securitySettings[item.key]}
                    onClick={() =>
                      updateSecuritySetting(
                        item.key,
                        !securitySettings[item.key]
                      )
                    }
                  />
                </div>
              </div>
            ))}

            {error && (
              <div className="rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-xs font-semibold text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 px-4 py-3 text-xs font-semibold text-emerald-400">
                {success}
              </div>
            )}

            <div className="rounded-xl border border-[#30271F] bg-[#12100E] px-4 py-3">
              <p className="text-[10px] leading-5 text-[#756D65]">
                Security preferences are stored in the backend and remain
                unchanged after refreshing the application.
              </p>
            </div>
          </div>
        )}
      </>
    );
  };

  

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C89B3C]">
          Platform Configuration
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
          Settings
        </h1>

        <p className="mt-2 text-sm text-[#8F877D]">
          Configure platform preferences, underwriting controls and AI behavior.
        </p>
      </div>

      {/* Settings Layout */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        {/* Settings Navigation */}
        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-4">
          <p className="px-3 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#625B54]">
            Configuration
          </p>

          <div className="space-y-1">
            {[
              "General",
              "Underwriting",
              "AI Configuration",
              "Notifications",
              "Security",
            ].map((item) => {
              const section = item as SettingsSection;

              const isActive =
                activeSection === section;

              return (
                <button
                  key={section}
                  type="button"
                  onClick={() => {
                    setActiveSection(section);
                    setSuccess("");
                    setError("");
                  }}
                  className={`
                    flex
                    w-full
                    items-center
                    justify-between
                    rounded-xl
                    px-3
                    py-3
                    text-left
                    text-xs
                    font-semibold
                    transition-all
                    duration-200

                    ${
                      isActive
                        ? "border border-[#59451F] bg-[#211810] text-[#D6A94D]"
                        : "border border-transparent text-[#9A9188] hover:border-[#3A2C20] hover:bg-[#1A1511] hover:text-white"
                    }
                  `}
                >
                  <span>{section}</span>

                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D6A94D] shadow-[0_0_8px_rgba(214,169,77,0.7)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Settings Panel */}
        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5">
          {activeSection === "General" &&
            renderGeneralSettings()}

          {activeSection === "Underwriting" &&
            renderUnderwritingSettings()}

          {activeSection === "AI Configuration" &&
            renderAIConfiguration()}

          {activeSection === "Notifications" &&
            renderNotifications()}

          {activeSection === "Security" &&
            renderSecurity()}
        </div>
      </section>
    </div>
  );
}

export default Settings;