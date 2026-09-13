import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

type LoanApplication = {
  id: number;
  application_number: string;
  applicant_name: string;
  loan_type: string;
  loan_amount: number;
  risk_score: number | null;
  default_probability: number | null;
  risk_category: string | null;
  status: string;
  created_at: string | null;
};

type FraudSignal = {
  type?: string;
  document_id?: number;
  document_ids?: number[];
  filename?: string;
  content_hash?: string;
  file_hash?: string;
  keywords?: string[];
};

type FraudAssessment = {
  agent?: string;
  agent_version?: string;
  fraud_score?: number | null;
  fraud_category?: string | null;
  signals?: FraudSignal[];
  next_step?: string;
  reasons?: string[];
  recommendation?: string;
};

type FraudRecord = {
  application: LoanApplication;
  assessment: FraudAssessment | null;
  error?: string;
};

function FraudCenter() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [fraudRecords, setFraudRecords] = useState<FraudRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [assessing, setAssessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFraudData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "http://127.0.0.1:8000/api/loan-applications/"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch loan applications");
        }

        const data: LoanApplication[] = await response.json();

        setApplications(data);
      } catch (err) {
        console.error("Fraud Center application fetch error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load fraud data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadFraudData();
  }, []);

  useEffect(() => {
    if (applications.length === 0) {
      setFraudRecords([]);
      return;
    }

    const loadFraudAssessments = async () => {
      try {
        setAssessing(true);

        const results = await Promise.all(
          applications.map(async (application) => {
            try {
              const response = await fetch(
                `http://127.0.0.1:8000/api/loan-applications/${encodeURIComponent(
                  application.application_number
                )}/fraud`,
                {
                  method: "POST",
                  headers: {
                    Accept: "application/json",
                  },
                }
              );

              if (!response.ok) {
                throw new Error(
                  `Fraud assessment failed with status ${response.status}`
                );
              }

              const data = await response.json();

              return {
                application,
                assessment:
                  data.fraud_assessment ?? null,
              };
            } catch (err) {
              console.error(
                `Fraud assessment error for ${application.application_number}:`,
                err
              );

              return {
                application,
                assessment: null,
                error:
                  err instanceof Error
                    ? err.message
                    : "Fraud assessment failed",
              };
            }
          })
        );

        setFraudRecords(results);
      } finally {
        setAssessing(false);
      }
    };

    loadFraudAssessments();
  }, [applications]);

  const allSignals = useMemo(
    () =>
      fraudRecords.flatMap(
        (record) => record.assessment?.signals ?? []
      ),
    [fraudRecords]
  );

  const criticalCases = useMemo(
    () =>
      fraudRecords.filter(
        (record) =>
          record.assessment?.fraud_category === "Critical"
      ).length,
    [fraudRecords]
  );

  const highRiskCases = useMemo(
    () =>
      fraudRecords.filter(
        (record) =>
          record.assessment?.fraud_category === "High"
      ).length,
    [fraudRecords]
  );

  const duplicateSignals = useMemo(
    () =>
      allSignals.filter(
        (signal) =>
          signal.type?.toLowerCase().includes("duplicate")
      ).length,
    [allSignals]
  );

  const suspiciousSignals = useMemo(
    () =>
      allSignals.filter(
        (signal) =>
          signal.type
            ?.toLowerCase()
            .includes("suspicious")
      ).length,
    [allSignals]
  );

  const totalFraudSignals = allSignals.length;

  const getCategoryClass = (
    category?: string | null
  ) => {
    switch (category) {
      case "Critical":
        return "border-red-900/60 bg-red-950/30 text-red-400";

      case "High":
        return "border-red-900/50 bg-red-950/20 text-red-400";

      case "Medium":
        return "border-amber-900/60 bg-amber-950/30 text-amber-400";

      case "Low":
        return "border-emerald-900/60 bg-emerald-950/30 text-emerald-400";

      default:
        return "border-[#46351F] bg-[#18120E] text-[#D6A94D]";
    }
  };

  const getSignalLabel = (signal: FraudSignal) => {
    if (signal.type) {
      return signal.type;
    }

    return "Fraud Signal";
  };

  const getSignalEvidence = (signal: FraudSignal) => {
    if (signal.filename) {
      return signal.filename;
    }

    if (signal.keywords?.length) {
      return signal.keywords.join(", ");
    }

    if (signal.document_ids?.length) {
      return `Documents: ${signal.document_ids.join(", ")}`;
    }

    if (signal.document_id) {
      return `Document ID: ${signal.document_id}`;
    }

    if (signal.content_hash) {
      return `OCR hash: ${signal.content_hash.slice(0, 12)}...`;
    }

    if (signal.file_hash) {
      return `File hash: ${signal.file_hash.slice(0, 12)}...`;
    }

    return "Evidence available in fraud assessment";
  };

  const fraudAlerts = useMemo(() => {
    return fraudRecords.flatMap((record) => {
      const signals = record.assessment?.signals ?? [];

      return signals.map((signal, index) => ({
        id: `${record.application.application_number}-${index}`,
        application: record.application,
        assessment: record.assessment,
        signal,
      }));
    });
  }, [fraudRecords]);

  const riskSignals = [
    {
      label: "Duplicate Signals",
      value: duplicateSignals,
      description: "Duplicate filename, file or OCR matches",
    },
    {
      label: "Suspicious OCR",
      value: suspiciousSignals,
      description: "Suspicious keywords detected in OCR",
    },
    {
      label: "Critical Cases",
      value: criticalCases,
      description: "Applications requiring immediate attention",
    },
    {
      label: "High Risk Cases",
      value: highRiskCases,
      description: "Applications with high fraud risk",
    },
  ];

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C89B3C]">
          Fraud Intelligence
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
          Fraud Center
        </h1>

        <p className="mt-2 text-sm text-[#8F877D]">
          Detect suspicious applications, document anomalies and
          potential fraud patterns.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-900/50 bg-red-950/20 px-5 py-4">
          <p className="text-xs font-semibold text-red-400">
            Unable to load fraud intelligence
          </p>

          <p className="mt-1 text-[11px] text-red-300/70">
            {error}
          </p>
        </div>
      )}

      {/* Summary */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Fraud Signals
          </p>

          <p className="mt-3 text-3xl font-extrabold text-red-400">
            {loading ? "..." : totalFraudSignals}
          </p>

          <p className="mt-2 text-[11px] text-[#756D65]">
            Detected by fraud analysis
          </p>
        </div>

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Duplicate Matches
          </p>

          <p className="mt-3 text-3xl font-extrabold text-amber-400">
            {loading ? "..." : duplicateSignals}
          </p>

          <p className="mt-2 text-[11px] text-[#756D65]">
            Filename, OCR and file matches
          </p>
        </div>

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Critical Cases
          </p>

          <p className="mt-3 text-3xl font-extrabold text-red-400">
            {loading ? "..." : criticalCases}
          </p>

          <p className="mt-2 text-[11px] text-red-400">
            Immediate attention
          </p>
        </div>

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Suspicious OCR
          </p>

          <p className="mt-3 text-3xl font-extrabold text-[#D6A94D]">
            {loading ? "..." : suspiciousSignals}
          </p>

          <p className="mt-2 text-[11px] text-[#756D65]">
            OCR-based fraud indicators
          </p>
        </div>

      </section>

      {/* Detection Overview */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">

        {/* Signal Overview */}
        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5">

          <div>
            <h2 className="text-sm font-bold text-white">
              Fraud Signal Overview
            </h2>

            <p className="mt-1 text-[11px] text-[#756D65]">
              Actual fraud evidence returned by the detection agent
            </p>
          </div>

          <div className="mt-6 space-y-4">

            {riskSignals.map((item) => {

              const percentage =
                totalFraudSignals > 0
                  ? Math.round(
                      (item.value / totalFraudSignals) * 100
                    )
                  : 0;

              return (
                <div key={item.label}>

                  <div className="mb-2 flex items-center justify-between">

                    <div>
                      <span className="text-xs font-medium text-[#A69B90]">
                        {item.label}
                      </span>

                      <p className="mt-0.5 text-[9px] text-[#625B54]">
                        {item.description}
                      </p>
                    </div>

                    <span className="text-xs font-bold text-[#D6A94D]">
                      {item.value}
                    </span>

                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-[#211D18]">

                    <div
                      className="h-full rounded-full bg-[#8F6A2D] transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />

                  </div>

                </div>
              );
            })}

          </div>

        </div>

        {/* Detection Status */}
        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5">

          <div>
            <h2 className="text-sm font-bold text-white">
              Detection Status
            </h2>

            <p className="mt-1 text-[11px] text-[#756D65]">
              Current fraud assessment status
            </p>
          </div>

          <div className="mt-6 space-y-3">

            <div className="flex items-center justify-between rounded-xl border border-[#28221C] bg-[#171512] px-4 py-3">
              <span className="text-xs text-[#A69B90]">
                Applications Assessed
              </span>

              <span className="text-[10px] font-bold text-emerald-400">
                {fraudRecords.filter(
                  (record) => record.assessment !== null
                ).length}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#28221C] bg-[#171512] px-4 py-3">
              <span className="text-xs text-[#A69B90]">
                Duplicate Detection
              </span>

              <span className="text-[10px] font-bold text-emerald-400">
                Operational
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#28221C] bg-[#171512] px-4 py-3">
              <span className="text-xs text-[#A69B90]">
                OCR Signal Analysis
              </span>

              <span className="text-[10px] font-bold text-emerald-400">
                Operational
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#28221C] bg-[#171512] px-4 py-3">
              <span className="text-xs text-[#A69B90]">
                Assessment Engine
              </span>

              <span className="text-[10px] font-bold text-emerald-400">
                {assessing ? "Processing" : "Operational"}
              </span>
            </div>

          </div>

        </div>

      </section>

      {/* Fraud Alerts */}
      <section className="overflow-hidden rounded-2xl border border-[#2A241E] bg-[#12110F]">

        <div className="border-b border-[#2A241E] px-5 py-4">

          <h2 className="text-sm font-bold text-white">
            Fraud Alerts
          </h2>

          <p className="mt-1 text-[11px] text-[#756D65]">
            Applications flagged by the Fraud Detection Agent
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px]">

            <thead>
              <tr className="border-b border-[#2A241E] text-left text-[9px] uppercase tracking-[0.12em] text-[#625B54]">

                <th className="px-5 py-4">
                  Application
                </th>

                <th className="px-4 py-4">
                  Applicant
                </th>

                <th className="px-4 py-4">
                  Fraud Category
                </th>

                <th className="px-4 py-4">
                  Signal
                </th>

                <th className="px-4 py-4">
                  Evidence
                </th>

                <th className="px-4 py-4">
                  Status
                </th>

              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-xs text-[#756D65]"
                  >
                    Loading fraud intelligence...
                  </td>
                </tr>
              ) : fraudAlerts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-xs text-[#756D65]"
                  >
                    No fraud signals detected.
                  </td>
                </tr>
              ) : (
                fraudAlerts.map((alert) => {

                  const category =
                    alert.assessment?.fraud_category;

                  return (
                    <tr
                      key={alert.id}
                      className="border-b border-[#211E1A] transition-colors duration-200 hover:bg-[#1A1511]"
                    >

                      <td className="px-5 py-4">
  <button
    type="button"
    onClick={() =>
      navigate(
        `/loan-applications/${alert.application.application_number}`
      )
    }
    className="group inline-flex items-center gap-1.5 text-xs font-bold text-white transition-colors hover:text-[#D6A94D]"
  >
    {alert.application.application_number}
    <ArrowRight
      size={13}
      className="transition-transform group-hover:translate-x-0.5"
    />
  </button>
</td>

                      <td className="px-4 py-4 text-xs text-[#B9B0A7]">
                        {alert.application.applicant_name}
                      </td>

                      <td className="px-4 py-4">

                        <span
                          className={`rounded-full border px-2.5 py-1 text-[9px] font-bold ${getCategoryClass(
                            category
                          )}`}
                        >
                          {category ?? "Unknown"}
                        </span>

                      </td>

                      <td className="px-4 py-4 text-xs font-semibold text-[#CFC6BC]">
                        {getSignalLabel(alert.signal)}
                      </td>

                      <td className="max-w-[260px] px-4 py-4 text-xs text-[#A69B90]">
                        <span className="block truncate">
                          {getSignalEvidence(alert.signal)}
                        </span>
                      </td>

                      <td className="px-4 py-4">

                        <span
                          className={
                            category === "Critical"
                              ? "rounded-full border border-red-900/60 bg-red-950/30 px-2.5 py-1 text-[9px] font-bold text-red-400"
                              : category === "High"
                                ? "rounded-full border border-red-900/50 bg-red-950/20 px-2.5 py-1 text-[9px] font-bold text-red-400"
                                : category === "Medium"
                                  ? "rounded-full border border-amber-900/60 bg-amber-950/30 px-2.5 py-1 text-[9px] font-bold text-amber-400"
                                  : "rounded-full border border-[#46351F] bg-[#18120E] px-2.5 py-1 text-[9px] font-bold text-[#D6A94D]"
                          }
                        >
                          {alert.assessment?.recommendation ??
  (category === "Critical"
    ? "Investigate"
    : category === "High"
      ? "Review"
      : category === "Medium"
        ? "Review"
        : "Monitor")}
                        </span>

                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}

export default FraudCenter;