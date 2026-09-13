import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

interface LoanApplication {
  id: number;
  application_number: string;
  applicant_name: string;
  loan_type: string;
  loan_amount: number;
  annual_income: number;
  credit_score: number;
  debt_to_income_ratio: number;
  employment_years: number;
  risk_score: number | null;
  default_probability: number | null;
  risk_category: string | null;
  status: string;
  created_at: string;
}

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return "₹0";
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${Math.round(value)}`;
}

function normalizeStatus(status: string | null | undefined) {
  return (status || "Pending").trim().toLowerCase();
}

function isManualReview(status: string | null | undefined) {
  const normalized = normalizeStatus(status);
  return (
    normalized === "manual review" ||
    normalized === "pending" ||
    normalized === "pending review"
  );
}

function isRejected(status: string | null | undefined) {
  return normalizeStatus(status) === "rejected";
}

function isApproved(status: string | null | undefined) {
  return normalizeStatus(status) === "approved";
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`cu-panel min-w-0 overflow-hidden !border-[#C89B3C] !shadow-[0_0_0_1px_rgba(200,155,60,0.22),0_0_18px_rgba(200,155,60,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

function PanelHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="cu-panel-header">
      <div className="min-w-0">
        <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-[#F7F4EF]">
          {title}
        </h2>

        <p className="mt-1 text-[11px] font-medium leading-4 text-[#746C63]">
          {subtitle}
        </p>
      </div>

      {action}
    </div>
  );
}

function LoadingPanel({ className = "" }: { className?: string }) {
  return (
    <div className={`cu-panel animate-pulse ${className}`}>
      <div className="space-y-4 p-5">
        <div className="h-3 w-36 rounded bg-[#211B16]" />
        <div className="h-2 w-56 rounded bg-[#1B1713]" />
        <div className="h-32 rounded-xl bg-[#15120F]" />
      </div>
    </div>
  );
}

function Dashboard() {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const loadDashboard = useCallback(async (manual = false) => {
    try {
      manual ? setRefreshing(true) : setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/loan-applications/`,
      );

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected application data from backend");
      }

      setApplications(data);
      
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();

    const interval = window.setInterval(
      () => void loadDashboard(),
      30000,
    );

    return () => window.clearInterval(interval);
  }, [loadDashboard]);

  const metrics = useMemo(() => {
    const total = applications.length;

    const approved = applications.filter((app) =>
      isApproved(app.status),
    ).length;

    const pending = applications.filter((app) =>
      isManualReview(app.status),
    ).length;

    const rejected = applications.filter((app) =>
      isRejected(app.status),
    ).length;

    const highRisk = applications.filter(
      (app) => normalizeStatus(app.risk_category) === "high",
    ).length;

    const decided = approved + rejected;

    const decisionCoverage = total
      ? Math.round((decided / total) * 100)
      : 0;

    return {
      total,
      approved,
      pending,
      rejected,
      highRisk,
      decisionCoverage,
    };
  }, [applications]);

  const recentApplications = useMemo(
    () =>
      [...applications]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        )
        .slice(0, 5),
    [applications],
  );

  const volumeData = useMemo(() => {
    const today = new Date();

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);

      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - (6 - index));

      return date;
    });

    return days.map((date) => {
      const next = new Date(date);

      next.setDate(date.getDate() + 1);

      const value = applications.filter((application) => {
        const created = new Date(application.created_at);

        return created >= date && created < next;
      }).length;

      return {
        day: date.toLocaleDateString("en-IN", {
          weekday: "short",
        }),
        date: date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
        value,
      };
    });
  }, [applications]);

  const maxVolume = Math.max(
    ...volumeData.map((item) => item.value),
    1,
  );

  const decisionData = [
    {
      label: "Approved",
      value: metrics.approved,
      width: metrics.total
        ? `${(metrics.approved / metrics.total) * 100}%`
        : "0%",
      color: "bg-emerald-400",
      text: "text-emerald-400",
    },
    {
      label: "Manual Review",
      value: metrics.pending,
      width: metrics.total
        ? `${(metrics.pending / metrics.total) * 100}%`
        : "0%",
      color: "bg-amber-400",
      text: "text-amber-400",
    },
    {
      label: "Rejected",
      value: metrics.rejected,
      width: metrics.total
        ? `${(metrics.rejected / metrics.total) * 100}%`
        : "0%",
      color: "bg-rose-400",
      text: "text-rose-400",
    },
  ];

  const riskCounts = [
    {
      label: "Low Risk",
      key: "low",
      color: "bg-emerald-400",
      text: "text-emerald-400",
    },
    {
      label: "Medium Risk",
      key: "medium",
      color: "bg-amber-400",
      text: "text-amber-400",
    },
    {
      label: "High Risk",
      key: "high",
      color: "bg-rose-400",
      text: "text-rose-400",
    },
  ].map((item) => {
    const count = applications.filter(
      (application) =>
        normalizeStatus(application.risk_category) === item.key,
    ).length;

    return {
      ...item,
      count,
      percentage: applications.length
        ? Math.round((count / applications.length) * 100)
        : 0,
    };
  });

  return (
    <div className="cu-dashboard">
      {/* Clean Hero */}
      <section className="cu-dashboard-hero">
        <div className="cu-hero-glow" />

        <div className="relative">
          <div className="cu-eyebrow">
            Welcome back
          </div>
        </div>
      </section>

      {error && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-rose-900/60 bg-rose-950/20 px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold text-rose-300">
              Dashboard data unavailable
            </p>

            <p className="mt-1 text-[10px] text-rose-400/80">
              {error}. Make sure the FastAPI server is running.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/loan-applications")}
          
            className="cu-text-button"
          >
            Retry
            <RefreshCw size={13} />
          </button>
        </div>
      )}

      {loading ? (
        <>
          <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <LoadingPanel
                key={item}
                className="h-[142px]"
              />
            ))}
          </section>

          <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
            <LoadingPanel className="min-h-[300px]" />
            <LoadingPanel className="min-h-[300px]" />
          </section>
        </>
      ) : (
        <>
          {/* KPI Cards */}
          <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total Applications",
                value: metrics.total,
                note: "from live applications",
                icon: FileText,
                accent: "gold",
                iconClass: "text-[#D6A94D]",
              },
              {
                label: "Approved Applications",
                value: metrics.approved,
                note: "current approved cases",
                icon: CheckCircle2,
                accent: "green",
                iconClass: "text-emerald-400",
              },
              {
                label: "Pending Review",
                value: metrics.pending,
                note: "manual underwriting queue",
                icon: Clock3,
                accent: "amber",
                iconClass: "text-amber-400",
              },
              {
                label: "High Risk Cases",
                value: metrics.highRisk,
                note: "risk category: high",
                icon: ShieldAlert,
                accent: "red",
                iconClass: "text-rose-400",
              },
            ].map((kpi) => {
              const Icon = kpi.icon;

              return (
                <article
                  key={kpi.label}
                  className={`cu-kpi cu-kpi-${kpi.accent} group !border-[#C89B3C] !shadow-[0_0_0_1px_rgba(200,155,60,0.22),0_0_18px_rgba(200,155,60,0.06)]`}
                >
                  <div className="cu-kpi-sheen" />

                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-[#8B837A]">
                        {kpi.label}
                      </p>

                      <p className="cu-number mt-3 text-[31px] font-semibold leading-none tracking-[-0.045em] text-white">
                        {kpi.value}
                      </p>

                      <p className="mt-3 truncate text-[10px] font-medium text-[#746C63]">
                        {kpi.note}
                      </p>
                    </div>

                    <div className="cu-kpi-icon">
                      <Icon
                        size={17}
                        strokeWidth={2.1}
                        className={kpi.iconClass}
                      />
                    </div>
                  </div>

                  <div className="cu-kpi-line" />
                </article>
              );
            })}
          </section>

          {/* Application Volume + Underwriting Decisions */}
          <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
            <Panel className="min-h-[300px]">
              <PanelHeader
                title="Application Volume"
                subtitle="Applications created over the last 7 days"
                action={
                  <button
                    type="button"
                    aria-label="Refresh dashboard"
                    onClick={() => void loadDashboard(true)}
                    className="cu-icon-button"
                  >
                    <RefreshCw
                      size={15}
                      className={refreshing ? "animate-spin" : ""}
                    />
                  </button>
                }
              />

              <div className="cu-chart-area">
                <div className="relative h-[188px]">
                  {[0, 1, 2, 3, 4].map((line) => (
                    <div
                      key={line}
                      className="pointer-events-none absolute inset-x-0 h-px bg-[#211B16]"
                      style={{
                        top: `${line * 25}%`,
                      }}
                    />
                  ))}

                  <div className="relative flex h-full items-end gap-2 px-1 sm:gap-3">
                    {volumeData.map((item) => (
                      <div
                        key={`${item.date}-${item.day}`}
                        className="group/bar flex h-full min-w-0 flex-1 flex-col justify-end"
                      >
                        <div className="relative flex h-full items-end">
                          {item.value > 0 && (
                            <>
                              <div
                                className="w-full rounded-t-[7px] bg-gradient-to-t from-[#40372F] via-[#5A5047] to-[#766B5F] transition-all duration-300 ease-out group-hover/bar:brightness-125 group-hover/bar:shadow-[0_0_18px_rgba(200,155,60,0.12)]"
                                style={{
                                  height: `${Math.max(
                                    (item.value / maxVolume) * 100,
                                    8,
                                  )}%`,
                                }}
                              />

                              <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg border border-[#4B3A25] bg-[#17120E] px-2.5 py-1.5 text-[9px] font-semibold text-[#E8DDCF] opacity-0 shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-all duration-200 group-hover/bar:translate-y-0 group-hover/bar:opacity-100">
                                {item.date} · {item.value} applications
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-7 text-center text-[9px] font-semibold text-[#625A52]">
                  {volumeData.map((item) => (
                    <span key={`${item.date}-label`}>
                      {item.day}
                    </span>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel className="min-h-[300px]">
              <PanelHeader
                title="Underwriting Decisions"
                subtitle="Current application decision mix"
                action={
                  <TrendingUp
                    size={17}
                    strokeWidth={2}
                    className="text-[#D6A94D]"
                  />
                }
              />

              <div className="cu-panel-content space-y-3">
                {decisionData.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-transparent px-2 py-2 transition-all duration-200 hover:border-[#30271F] hover:bg-[#17130F]"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3 text-[10px]">
                      <span className="font-medium text-[#9A9188]">
                        {item.label}
                      </span>

                      <span
                        className={`font-bold ${item.text}`}
                      >
                        {item.value}
                      </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-[#211D18]">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{
                          width: item.width,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mx-5 mt-2 border-t border-[#28221C] pt-4 pb-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-[#756D65]">
                    Underwriting coverage
                  </span>

                  <span className="text-[11px] font-bold text-emerald-400">
                    {metrics.decisionCoverage}%
                  </span>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#211D18]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400 transition-all duration-500"
                    style={{
                      width: `${metrics.decisionCoverage}%`,
                    }}
                  />
                </div>
              </div>
            </Panel>
          </section>

          {/* Risk Overview + Recent Applications */}
          <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(260px,0.82fr)_minmax(0,1.7fr)]">
            <Panel className="min-h-[250px]">
              <PanelHeader
                title="Risk Overview"
                subtitle="Current portfolio risk distribution"
                action={
                  <ShieldAlert
                    size={17}
                    strokeWidth={2}
                    className="text-[#D6A94D]"
                  />
                }
              />

              <div className="cu-panel-content flex flex-col justify-center gap-4">
                {riskCounts.map((item) => (
                  <div key={item.key}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-[10px] font-medium text-[#9A9188]">
                        {item.label}
                      </span>

                      <span
                        className={`text-[10px] font-bold ${item.text}`}
                      >
                        {item.percentage}%
                      </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-[#211D18]">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{
                          width: `${item.percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="min-h-[250px]">
              <div className="cu-table-header">
                <div className="min-w-0">
                  <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-[#F7F4EF]">
                    Recent Applications
                  </h2>

                  <p className="mt-1 text-[11px] font-medium leading-4 text-[#746C63]">
                    Latest applications from the live backend
                  </p>
                </div>

                <button
                  type="button"
                  className="cu-text-button"
                >
                  View all
                  <ArrowUpRight size={13} />
                </button>
              </div>

              {recentApplications.length === 0 ? (
                <div className="flex min-h-[150px] items-center justify-center px-5 text-center">
                  <div>
                    <FileText
                      size={22}
                      className="mx-auto text-[#4B4035]"
                    />

                    <p className="mt-3 text-[11px] font-semibold text-[#8C8177]">
                      No loan applications yet
                    </p>

                    <p className="mt-1 text-[10px] text-[#5F5851]">
                      Create an application and it will appear here
                      automatically.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] table-fixed">
                    <thead>
                      <tr className="border-b border-[#28221C] text-left text-[9px] uppercase tracking-[0.11em] text-[#625B54]">
                        <th className="w-[18%] px-5 py-3 font-semibold">
                          Application
                        </th>

                        <th className="w-[26%] px-3 py-3 font-semibold">
                          Applicant
                        </th>

                        <th className="w-[18%] px-3 py-3 font-semibold">
                          Amount
                        </th>

                        <th className="w-[16%] px-3 py-3 font-semibold">
                          Risk
                        </th>

                        <th className="w-[22%] px-5 py-3 font-semibold">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentApplications.map((application) => {
                        const risk =
                          application.risk_category || "Pending";

                        const status =
                          application.status || "Pending";

                        return (
                          <tr
                            key={application.id}
                            className="border-b border-[#211E1A] last:border-0 transition-colors duration-200 hover:bg-[#18140F]"
                          >
                            <td className="overflow-hidden px-5 py-3">
                              <p className="truncate text-[10px] font-bold text-[#F1ECE5]">
                                {application.application_number}
                              </p>
                            </td>

                            <td className="overflow-hidden px-3 py-3">
                              <p className="truncate text-[10px] font-medium text-[#B9B0A7]">
                                {application.applicant_name}
                              </p>
                            </td>

                            <td className="overflow-hidden px-3 py-3">
                              <p className="truncate text-[10px] font-semibold text-[#D0C7BE]">
                                {formatCurrency(
                                  application.loan_amount,
                                )}
                              </p>
                            </td>

                            <td className="px-3 py-3">
                              <span
                                className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-bold ${
                                  normalizeStatus(risk) === "low"
                                    ? "border-emerald-900/60 bg-emerald-950/25 text-emerald-400"
                                    : normalizeStatus(risk) === "medium"
                                      ? "border-amber-900/60 bg-amber-950/25 text-amber-400"
                                      : normalizeStatus(risk) === "high"
                                        ? "border-rose-900/60 bg-rose-950/25 text-rose-400"
                                        : "border-[#3A3028] bg-[#181410] text-[#8F857B]"
                                }`}
                              >
                                {risk}
                              </span>
                            </td>

                            <td className="overflow-hidden px-5 py-3">
                              <span
                                className={`block truncate whitespace-nowrap text-[9px] font-semibold ${
                                  isApproved(status)
                                    ? "text-emerald-400"
                                    : isRejected(status)
                                      ? "text-rose-400"
                                      : "text-amber-400"
                                }`}
                              >
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </section>
        </>
      )}
    </div>
  );
}

export default Dashboard;