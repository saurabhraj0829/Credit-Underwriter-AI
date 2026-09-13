import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Clock3, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://127.0.0.1:8000";

interface QueueApplication {
  application_number: string;
  applicant_name: string;
  loan_type: string;
  loan_amount: number;
  risk_score: number | null;
  risk_category: string | null;
  default_probability: number | null;
  fraud_category: string | null;
  compliance_status: string | null;
  decision_status: string | null;
  recommendation: string | null;
  priority: string;
  created_at: string | null;
}

interface DecisionQueueResponse {
  pending_decisions: number;
  high_priority: number;
  approved_today: number;
  average_decision_time_minutes: number | null;
  average_decision_time_available: boolean;
  queue: QueueApplication[];
}

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return "₹0";

  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`;
  }

  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }

  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }

  return `₹${Math.round(value)}`;
}

function normalize(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function riskClass(risk: string | null) {
  const normalized = normalize(risk);

  if (normalized === "high" || normalized === "very high") {
    return "border-red-900/60 bg-red-950/30 text-red-400";
  }

  if (normalized === "medium") {
    return "border-amber-900/60 bg-amber-950/30 text-amber-400";
  }

  if (normalized === "low") {
    return "border-emerald-900/60 bg-emerald-950/30 text-emerald-400";
  }

  return "border-[#3A3028] bg-[#181410] text-[#8F857B]";
}

function priorityClass(priority: string) {
  if (normalize(priority) === "high") {
    return "border-red-900/60 bg-red-950/30 text-red-400";
  }

  return "border-[#46351F] bg-[#18120E] text-[#D6A94D]";
}

function recommendationClass(recommendation: string | null) {
  const normalized = normalize(recommendation);

  if (normalized === "approve") {
    return "text-emerald-400";
  }

  if (normalized === "rejected" || normalized === "reject") {
    return "text-red-400";
  }

  return "text-amber-400";
}

function DecisionQueue() {
  const navigate = useNavigate();

  const [data, setData] = useState<DecisionQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDecisionQueue = useCallback(async (manual = false) => {
    try {
      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/loan-applications/decision-queue`,
      );

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const result: DecisionQueueResponse = await response.json();

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load decision queue data",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDecisionQueue();

    const interval = window.setInterval(
      () => void loadDecisionQueue(),
      30000,
    );

    return () => window.clearInterval(interval);
  }, [loadDecisionQueue]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C89B3C]">
            Underwriting Operations
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            Decision Queue
          </h1>

          <p className="mt-2 text-sm text-[#8F877D]">
            Review applications that require approval, rejection or manual
            underwriting decisions.
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-[142px] animate-pulse rounded-2xl border border-[#2A241E] bg-[#12110F]"
            >
              <div className="space-y-4 p-5">
                <div className="h-3 w-32 rounded bg-[#211B16]" />
                <div className="h-8 w-16 rounded bg-[#211B16]" />
                <div className="h-2 w-40 rounded bg-[#1B1713]" />
              </div>
            </div>
          ))}
        </section>

        <div className="h-[400px] animate-pulse rounded-2xl border border-[#2A241E] bg-[#12110F]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C89B3C]">
          Underwriting Operations
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
          Decision Queue
        </h1>

        <p className="mt-2 text-sm text-[#8F877D]">
          Review applications that require approval, rejection or manual
          underwriting decisions.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-900/60 bg-red-950/20 px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold text-red-300">
              Decision queue unavailable
            </p>

            <p className="mt-1 text-[10px] text-red-400/80">
              {error}. Make sure the FastAPI server is running.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadDecisionQueue(true)}
            className="flex items-center gap-2 rounded-lg border border-[#46351F] bg-[#18120E] px-3 py-2 text-[10px] font-bold text-[#D6A94D] transition hover:bg-[#21180F]"
          >
            Retry
            <RefreshCw size={13} />
          </button>
        </div>
      )}

      {/* Queue Summary */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Pending Decisions
          </p>

          <p className="mt-3 text-3xl font-extrabold text-[#D6A94D]">
            {data?.pending_decisions ?? 0}
          </p>

          <p className="mt-2 text-[11px] text-[#756D65]">
            Awaiting underwriting action
          </p>
        </div>

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            High Priority
          </p>

          <p className="mt-3 text-3xl font-extrabold text-red-400">
            {data?.high_priority ?? 0}
          </p>

          <p className="mt-2 text-[11px] text-red-400">
            Based on retrieved risk signals
          </p>
        </div>

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Approved Today
          </p>

          <p className="mt-3 text-3xl font-extrabold text-emerald-400">
            {data?.approved_today ?? 0}
          </p>

          <p className="mt-2 text-[11px] text-emerald-400">
            Decisions completed today
          </p>
        </div>

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Avg. Decision Time
          </p>

          <p className="mt-3 text-3xl font-extrabold text-white">
            {data?.average_decision_time_available &&
            data.average_decision_time_minutes !== null
              ? `${data.average_decision_time_minutes}m`
              : "N/A"}
          </p>

          <p className="mt-2 text-[11px] text-[#756D65]">
            Completion timing data unavailable
          </p>
        </div>
      </section>

      {/* Queue */}
      <section className="overflow-hidden rounded-2xl border border-[#2A241E] bg-[#12110F]">
        <div className="flex items-center justify-between border-b border-[#2A241E] px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-white">
              Pending Underwriting Decisions
            </h2>

            <p className="mt-1 text-[11px] text-[#756D65]">
              Applications requiring an underwriting decision
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Refresh decision queue"
              onClick={() => void loadDecisionQueue(true)}
              className="rounded-lg border border-[#2A241E] bg-[#181410] p-2 text-[#9A9188] transition hover:border-[#46351F] hover:text-[#D6A94D]"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>

            <span className="rounded-full border border-[#46351F] bg-[#18120E] px-3 py-1 text-[9px] font-bold text-[#D6A94D]">
              {data?.pending_decisions ?? 0} Pending
            </span>
          </div>
        </div>

        {data?.queue.length === 0 ? (
          <div className="flex min-h-[280px] items-center justify-center px-5 text-center">
            <div>
              <Clock3
                size={24}
                className="mx-auto text-[#4B4035]"
              />

              <p className="mt-3 text-[12px] font-semibold text-[#8C8177]">
                No pending underwriting decisions
              </p>

              <p className="mt-1 text-[10px] text-[#5F5851]">
                The decision queue is currently clear.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-[#2A241E] text-left text-[9px] uppercase tracking-[0.12em] text-[#625B54]">
                  <th className="px-5 py-4 font-semibold">
                    Application
                  </th>

                  <th className="px-4 py-4 font-semibold">
                    Applicant
                  </th>

                  <th className="px-4 py-4 font-semibold">
                    Amount
                  </th>

                  <th className="px-4 py-4 font-semibold">
                    Risk
                  </th>

                  <th className="px-4 py-4 font-semibold">
                    AI Recommendation
                  </th>

                  <th className="px-4 py-4 font-semibold">
                    Priority
                  </th>

                  <th className="px-4 py-4 font-semibold">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {(data?.queue ?? []).map((application) => (
                  <tr
                    key={application.application_number}
                    className="border-b border-[#211E1A] transition-colors duration-200 hover:bg-[#1A1511]"
                  >
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/loan-applications/${application.application_number}`,
                          )
                        }
                        className="group flex items-center gap-1.5 text-xs font-bold text-white"
                      >
                        {application.application_number}

                        <ArrowUpRight
                          size={12}
                          className="text-[#756D65] transition group-hover:text-[#D6A94D]"
                        />
                      </button>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-xs text-[#B9B0A7]">
                        {application.applicant_name}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-xs font-semibold text-[#CFC6BC]">
                        {formatCurrency(application.loan_amount)}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[9px] font-bold ${riskClass(
                          application.risk_category,
                        )}`}
                      >
                        {application.risk_category || "Pending"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`text-xs font-semibold ${recommendationClass(
                          application.recommendation,
                        )}`}
                      >
                        {application.recommendation || "Pending"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[9px] font-bold ${priorityClass(
                          application.priority,
                        )}`}
                      >
                        {application.priority}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-[#D0C7BE]">
                          {application.decision_status || "Pending"}
                        </p>

                        {application.fraud_category && (
                          <p className="text-[9px] text-red-400">
                            Fraud: {application.fraud_category}
                          </p>
                        )}

                        {application.compliance_status && (
                          <p className="text-[9px] text-amber-400">
                            Compliance: {application.compliance_status}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default DecisionQueue;