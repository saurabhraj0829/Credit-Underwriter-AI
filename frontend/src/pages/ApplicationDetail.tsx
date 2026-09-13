import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileCheck2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from "lucide-react";

type LoanApplication = {
  id: number;
  application_number: string;
  applicant_name: string;
  loan_type: string;
  loan_amount: number;
  annual_income: number | null;
  credit_score: number | null;
  debt_to_income_ratio: number | null;
  employment_years: number | null;
  risk_score: number | null;
  default_probability: number | null;
  risk_category: string | null;
  status: string;
  created_at: string | null;
};

type UnderwritingDecision = {
  id: number;
  application_id: number;
  application_number: string;
  decision: string;
  decision_status: string;
  risk_score: number | null;
  risk_category: string | null;
  default_probability: number | null;
  fraud_score: number | null;
  fraud_category: string | null;
  compliance_status: string | null;
  income_status: string | null;
  reason_codes: string | null;
  reasons: string | null;
  policy_version: string;
  next_step: string | null;
  created_at: string;
};

const API_BASE_URL = "http://127.0.0.1:8000";

function parseJsonArray(value: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is string => typeof item === "string",
      );
    }

    return [];
  } catch {
    return [];
  }
}

function formatCurrency(amount: number | null) {
  if (amount === null || amount === undefined) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getRiskClasses(category: string | null) {
  if (category === "High") {
    return {
      text: "text-red-400",
      border: "border-red-900/60",
      background: "bg-red-950/20",
    };
  }

  if (category === "Medium") {
    return {
      text: "text-amber-400",
      border: "border-amber-900/60",
      background: "bg-amber-950/20",
    };
  }

  if (category === "Low") {
    return {
      text: "text-emerald-400",
      border: "border-emerald-900/60",
      background: "bg-emerald-950/20",
    };
  }

  return {
    text: "text-[#B9B0A7]",
    border: "border-[#3A3027]",
    background: "bg-[#181411]",
  };
}

function getDecisionClasses(decision: string) {
  if (decision === "Approved") {
    return {
      text: "text-emerald-400",
      border: "border-emerald-900/60",
      background: "bg-emerald-950/20",
      icon: CheckCircle2,
    };
  }

  if (decision === "Rejected") {
    return {
      text: "text-red-400",
      border: "border-red-900/60",
      background: "bg-red-950/20",
      icon: XCircle,
    };
  }

  if (decision === "Manual Review") {
    return {
      text: "text-amber-400",
      border: "border-amber-900/60",
      background: "bg-amber-950/20",
      icon: AlertTriangle,
    };
  }

  return {
    text: "text-[#C89B3C]",
    border: "border-[#6B512A]",
    background: "bg-[#20180F]",
    icon: Clock3,
  };
}

function parseRatio(value: number | null) {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return `${(value * 100).toFixed(1)}%`;
}

function LoanApplicationDetail() {
  const { applicationNumber } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] =
    useState<LoanApplication | null>(null);

  const [decisions, setDecisions] = useState<UnderwritingDecision[]>([]);

  const [loading, setLoading] = useState(true);
  const [decisionsLoading, setDecisionsLoading] = useState(true);

  const [error, setError] = useState("");
  const [decisionsError, setDecisionsError] = useState("");

  const [workflowLoading, setWorkflowLoading] =
    useState(false);

  const [workflowError, setWorkflowError] =
    useState("");

  const [workflowSuccess, setWorkflowSuccess] =
    useState("");

  const fetchApplication = useCallback(async () => {
    if (!applicationNumber) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/loan-applications/${applicationNumber}`,
      );

      if (!response.ok) {
        throw new Error("Loan application not found");
      }

      const data: LoanApplication = await response.json();

      setApplication(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load loan application",
      );
    } finally {
      setLoading(false);
    }
  }, [applicationNumber]);

  const fetchDecisions = useCallback(async () => {
    if (!applicationNumber) {
      return;
    }

    try {
      setDecisionsLoading(true);
      setDecisionsError("");

      const response = await fetch(
        `${API_BASE_URL}/api/loan-applications/${applicationNumber}/decisions`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch decision history");
      }

      const data: UnderwritingDecision[] =
        await response.json();

      setDecisions(data);
    } catch (err) {
      setDecisionsError(
        err instanceof Error
          ? err.message
          : "Failed to fetch decision history",
      );
    } finally {
      setDecisionsLoading(false);
    }
  }, [applicationNumber]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  useEffect(() => {
    fetchDecisions();
  }, [fetchDecisions]);

  const runUnderwritingWorkflow = async () => {
    if (!applicationNumber || workflowLoading) {
      return;
    }

    try {
      setWorkflowLoading(true);
      setWorkflowError("");
      setWorkflowSuccess("");

      const response = await fetch(
        `${API_BASE_URL}/api/loan-applications/${applicationNumber}/decision`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            decision: "Pending",
            decision_reason:
              "Underwriting workflow initiated from loan application detail.",
            decided_by: "Underwriter",
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.detail ||
            "Failed to execute underwriting workflow",
        );
      }

      const decisionData = await response.json();

      setWorkflowSuccess(
        `Underwriting workflow completed. Final decision: ${
          decisionData.decision || "Pending"
        }.`,
      );

      await Promise.all([
        fetchApplication(),
        fetchDecisions(),
      ]);
    } catch (err) {
      setWorkflowError(
        err instanceof Error
          ? err.message
          : "Failed to execute underwriting workflow",
      );
    } finally {
      setWorkflowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[#8F877D]">
          <RefreshCw
            size={16}
            className="animate-spin text-[#C89B3C]"
          />
          Loading application...
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="space-y-5">
        <Link
          to="/loan-applications"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#C89B3C] transition-colors hover:text-[#E0B75A]"
        >
          <ArrowLeft size={14} />
          Back to Loan Applications
        </Link>

        <div className="rounded-2xl border border-red-900/50 bg-[#12110F] p-6">
          <p className="text-sm font-semibold text-red-400">
            {error || "Loan application not found"}
          </p>
        </div>
      </div>
    );
  }

  const riskClasses = getRiskClasses(
    application.risk_category,
  );

  const decisionClasses = getDecisionClasses(
    application.status,
  );

  const DecisionIcon = decisionClasses.icon;

  const latestDecision = decisions[0] ?? null;
  const previousDecisions = decisions.slice(1);

  const latestDecisionClasses = latestDecision
    ? getDecisionClasses(latestDecision.decision)
    : decisionClasses;

  const LatestDecisionIcon = latestDecision
    ? latestDecisionClasses.icon
    : DecisionIcon;

  const latestReasonCodes = latestDecision
    ? parseJsonArray(latestDecision.reason_codes)
    : [];

  const latestReasons = latestDecision
    ? parseJsonArray(latestDecision.reasons)
    : [];

  return (
    <div className="cu-dashboard space-y-5 pb-8">

      {/* Back navigation */}
<button
  type="button"
  onClick={() => navigate(-1)}
  className="inline-flex items-center gap-2 text-xs font-semibold text-[#D6A94D] transition-colors hover:text-[#E0B75A]"
>
  <ArrowLeft size={14} />
  Back
</button>

      {/* Application Header */}
      <section className="cu-panel overflow-hidden !border-[#C89B3C] !shadow-[0_0_0_1px_rgba(200,155,60,0.18),0_0_24px_rgba(200,155,60,0.05)]">
        <div className="flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] leading-none text-[#D6A94D]">
              Credit Underwriting
            </p>

            <h1 className="mt-3 break-words text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {application.application_number}
            </h1>

            <p className="mt-2 text-xs leading-5 text-[#8F877D] sm:text-sm">
              Detailed underwriting profile for{" "}
              <span className="font-semibold text-[#CFC6BC]">
                {application.applicant_name}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <span
              className={`inline-flex items-center gap-2 rounded-full border ${riskClasses.border} ${riskClasses.background} px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] ${riskClasses.text}`}
            >
              <ShieldAlert size={13} />
              {application.risk_category || "Unassessed"} Risk
            </span>

            <span
              className={`inline-flex items-center gap-2 rounded-full border ${decisionClasses.border} ${decisionClasses.background} px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] ${decisionClasses.text}`}
            >
              <DecisionIcon size={13} />
              {application.status}
            </span>
          </div>
        </div>
      </section>

      {/* Application Overview */}
      <section className="cu-panel overflow-hidden !border-[#C89B3C] !shadow-[0_0_0_1px_rgba(200,155,60,0.14)]">
        <div className="relative z-10 border-b border-[#3A3027] bg-[#12100E] px-5 py-5 sm:px-6">
  <p className="text-[10px] font-bold uppercase tracking-[0.16em] leading-4 text-[#D6A94D]">
    Application Overview
  </p>

  <p className="mt-2 text-[11px] leading-5 text-[#756D65]">
    Core loan application details from the underwriting database
  </p>
</div>

        <div className="grid grid-cols-1 gap-px bg-[#30271F] md:grid-cols-3">
          <div className="min-w-0 bg-[#12100E] px-5 py-5 sm:px-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] leading-4 text-[#777068]">
              Applicant
            </p>
            <p className="mt-2 break-words text-base font-bold leading-6 text-white sm:text-lg">
              {application.applicant_name}
            </p>
          </div>

          <div className="min-w-0 bg-[#12100E] px-5 py-5 sm:px-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] leading-4 text-[#777068]">
              Loan Type
            </p>
            <p className="mt-2 break-words text-base font-bold leading-6 text-white sm:text-lg">
              {application.loan_type}
            </p>
          </div>

          <div className="min-w-0 bg-[#12100E] px-5 py-5 sm:px-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] leading-4 text-[#777068]">
              Loan Amount
            </p>
            <p className="mt-2 break-words text-base font-bold leading-6 text-[#D6A94D] sm:text-lg">
              {formatCurrency(application.loan_amount)}
            </p>
          </div>
        </div>
      </section>

      {/* Financial Profile */}
      <section className="cu-panel overflow-hidden !border-[#C89B3C] !shadow-[0_0_0_1px_rgba(200,155,60,0.14)]">
        <div className="relative z-10 border-b border-[#3A3027] bg-[#12100E] px-5 py-5 sm:px-6">
  <div className="flex items-center gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#5A4527] bg-[#201811] text-[#D6A94D]">
      <TrendingUp size={17} />
    </div>

    <div className="min-w-0">
      <h2 className="text-sm font-bold leading-5 text-white">
        Financial Profile
      </h2>

      <p className="mt-1 text-[11px] leading-5 text-[#756D65]">
        Applicant financial and credit information
      </p>
    </div>
  </div>
</div>

        <div className="grid grid-cols-2 gap-px bg-[#30271F] md:grid-cols-4">
          <div className="min-w-0 bg-[#12100E] px-4 py-5 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] leading-4 text-[#777068]">
              Annual Income
            </p>
            <p className="mt-2 break-words text-base font-bold leading-6 text-white sm:text-lg">
              {formatCurrency(application.annual_income)}
            </p>
          </div>

          <div className="min-w-0 bg-[#12100E] px-4 py-5 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] leading-4 text-[#777068]">
              Credit Score
            </p>
            <p className="mt-2 text-base font-bold leading-6 text-white sm:text-lg">
              {application.credit_score ?? "N/A"}
            </p>
          </div>

          <div className="min-w-0 bg-[#12100E] px-4 py-5 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] leading-4 text-[#777068]">
              Debt-to-Income
            </p>
            <p className="mt-2 text-base font-bold leading-6 text-white sm:text-lg">
              {parseRatio(application.debt_to_income_ratio)}
            </p>
          </div>

          <div className="min-w-0 bg-[#12100E] px-4 py-5 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] leading-4 text-[#777068]">
              Employment
            </p>
            <p className="mt-2 text-base font-bold leading-6 text-white sm:text-lg">
              {application.employment_years !== null
                ? `${application.employment_years} years`
                : "N/A"}
            </p>
          </div>
        </div>
      </section>

      {/* ML Risk Assessment */}
      <section className="cu-panel overflow-hidden !border-[#C89B3C] !shadow-[0_0_0_1px_rgba(200,155,60,0.14)]">
        <div className="relative z-10 border-b border-[#3A3027] bg-[#12100E] px-5 py-5 sm:px-6">
  <div className="flex items-center gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#5A4527] bg-[#201811] text-[#D6A94D]">
      <ShieldCheck size={17} />
    </div>

    <div className="min-w-0">
      <h2 className="text-sm font-bold leading-5 text-white">
        ML Risk Assessment
      </h2>

      <p className="mt-1 text-[11px] leading-5 text-[#756D65]">
        Current automated credit risk assessment
      </p>
    </div>
  </div>
</div>

        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3 sm:p-6">
          <div className="rounded-xl border border-[#4A3823] bg-[#0E0D0C] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] leading-4 text-[#777068]">
              Risk Score
            </p>
            <p className={`mt-3 text-3xl font-extrabold leading-none ${riskClasses.text}`}>
              {application.risk_score ?? "N/A"}
            </p>
            <p className="mt-3 text-[11px] leading-4 text-[#756D65]">
              Automated credit risk score
            </p>
          </div>

          <div className="rounded-xl border border-[#4A3823] bg-[#0E0D0C] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] leading-4 text-[#777068]">
              Default Probability
            </p>
            <p className="mt-3 text-3xl font-extrabold leading-none text-white">
              {application.default_probability !== null
                ? `${(application.default_probability * 100).toFixed(0)}%`
                : "N/A"}
            </p>
            <p className="mt-3 text-[11px] leading-4 text-[#756D65]">
              Estimated probability of default
            </p>
          </div>

          <div className="rounded-xl border border-[#4A3823] bg-[#0E0D0C] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] leading-4 text-[#777068]">
              Risk Category
            </p>
            <p className={`mt-3 text-3xl font-extrabold leading-none ${riskClasses.text}`}>
              {application.risk_category || "N/A"}
            </p>
            <p className="mt-3 text-[11px] leading-4 text-[#756D65]">
              Current model classification
            </p>
          </div>
        </div>
      </section>

      {/* Underwriting Decision */}
      <section className="cu-panel overflow-hidden !border-[#C89B3C] !shadow-[0_0_0_1px_rgba(200,155,60,0.14)]">
        <div className="relative z-10 border-b border-[#3A3027] bg-[#12100E] px-5 py-5 sm:px-6">
  <div className="flex items-center gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#5A4527] bg-[#201811] text-[#D6A94D]">
      <FileCheck2 size={17} />
    </div>

    <div className="min-w-0">
      <h2 className="text-sm font-bold leading-5 text-white">
        Underwriting Decision
      </h2>

      <p className="mt-1 text-[11px] leading-5 text-[#756D65]">
        Execute the complete deterministic underwriting workflow
      </p>
    </div>
  </div>
</div>

        <div className="p-5 sm:p-6">
          <div className="rounded-xl border border-[#4A3823] bg-[#0E0D0C] p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] leading-4 text-[#777068]">
                  Current Decision
                </p>

                <div className="mt-2 flex items-center gap-3">
                  <DecisionIcon
                    size={20}
                    className={decisionClasses.text}
                  />
                  <span className={`text-2xl font-extrabold leading-none ${decisionClasses.text}`}>
                    {application.status}
                  </span>
                </div>

                <p className="mt-3 max-w-2xl text-[11px] leading-5 text-[#756D65]">
                  Run the underwriting workflow to evaluate the current
                  application using the configured risk, fraud, income and
                  policy checks.
                </p>
              </div>

              <button
                type="button"
                onClick={runUnderwritingWorkflow}
                disabled={workflowLoading}
                className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-[#C89B3C] bg-[#211810] px-5 py-3 text-xs font-bold text-[#D6A94D] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#E0B75A] hover:bg-[#2A1D13] hover:shadow-[0_0_22px_rgba(200,155,60,0.12)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <RefreshCw
                  size={15}
                  className={workflowLoading ? "animate-spin" : ""}
                />
                {workflowLoading
                  ? "Running Underwriting..."
                  : "Run Underwriting Assessment"}
              </button>
            </div>
          </div>

          {workflowSuccess && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-900/50 bg-emerald-950/20 px-4 py-3 text-xs font-semibold text-emerald-400">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <span>{workflowSuccess}</span>
            </div>
          )}

          {workflowError && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-xs font-semibold text-red-400">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{workflowError}</span>
            </div>
          )}
        </div>
      </section>

      {/* Decision History */}
      <section className="cu-panel overflow-hidden !border-[#C89B3C] !shadow-[0_0_0_1px_rgba(200,155,60,0.14)]">
        <div className="relative z-10 border-b border-[#3A3027] bg-[#12100E] px-5 py-5 sm:px-6">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] leading-4 text-[#D6A94D]">
        Decision History
      </p>

      <p className="mt-2 text-[11px] leading-5 text-[#756D65]">
        Persisted underwriting decisions and governance metadata
      </p>
    </div>

    <span className="w-fit rounded-full border border-[#4A3823] bg-[#181411] px-3 py-1 text-[10px] font-bold text-[#A79B8E]">
      {decisions.length} {decisions.length === 1 ? "record" : "records"}
    </span>
  </div>
</div>

        <div className="p-5 sm:p-6">
          {decisionsLoading && (
            <div className="flex items-center justify-center rounded-xl border border-[#3A3027] bg-[#0E0D0C] px-4 py-8 text-xs text-[#756D65]">
              <RefreshCw
                size={15}
                className="mr-2 animate-spin text-[#C89B3C]"
              />
              Loading decision history...
            </div>
          )}

          {decisionsError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-4 text-xs font-semibold text-red-400">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{decisionsError}</span>
            </div>
          )}

          {!decisionsLoading &&
            !decisionsError &&
            decisions.length === 0 && (
              <div className="rounded-xl border border-[#3A3027] bg-[#0E0D0C] px-4 py-10 text-center">
                <Clock3 size={20} className="mx-auto text-[#5F574F]" />
                <p className="mt-3 text-xs font-semibold text-[#A79B8E]">
                  No underwriting decisions recorded yet.
                </p>
                <p className="mt-1 text-[10px] leading-4 text-[#625B54]">
                  Run the underwriting assessment to create the first
                  persisted decision record.
                </p>
              </div>
            )}

          {!decisionsLoading &&
            !decisionsError &&
            latestDecision && (
              <div className="space-y-3">

                {/* Latest persisted decision */}
                <article className="overflow-hidden rounded-xl border border-[#C89B3C] bg-[#0E0D0C] shadow-[0_0_0_1px_rgba(200,155,60,0.10)]">
                  <div className="border-b border-[#3A3027] bg-[#17120E] px-4 py-3 sm:px-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border ${latestDecisionClasses.border} ${latestDecisionClasses.background} px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${latestDecisionClasses.text}`}
                        >
                          <LatestDecisionIcon size={12} />
                          {latestDecision.decision}
                        </span>

                        <span className="rounded-full border border-[#5A4527] bg-[#1B150F] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#D6A94D]">
                          Latest
                        </span>

                        <span className="rounded-full border border-[#3A3027] bg-[#181411] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#8F877D]">
                          {latestDecision.decision_status}
                        </span>

                        <span className="rounded-full border border-[#3A3027] bg-[#181411] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#8F877D]">
                          Policy {latestDecision.policy_version}
                        </span>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-[9px] uppercase tracking-[0.1em] leading-4 text-[#625B54]">
                          Recorded
                        </p>
                        <p className="mt-1 text-xs font-semibold leading-4 text-[#B9B0A7]">
                          {formatDate(latestDecision.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-px bg-[#30271F] md:grid-cols-4">
                    <div className="bg-[#0E0D0C] px-4 py-4">
                      <p className="text-[9px] uppercase tracking-[0.1em] leading-4 text-[#625B54]">
                        Risk Score
                      </p>
                      <p className="mt-1 text-sm font-bold text-white">
                        {latestDecision.risk_score ?? "N/A"}
                      </p>
                    </div>

                    <div className="bg-[#0E0D0C] px-4 py-4">
                      <p className="text-[9px] uppercase tracking-[0.1em] leading-4 text-[#625B54]">
                        Risk Category
                      </p>
                      <p
                        className={`mt-1 text-sm font-bold ${
                          getRiskClasses(latestDecision.risk_category).text
                        }`}
                      >
                        {latestDecision.risk_category || "N/A"}
                      </p>
                    </div>

                    <div className="bg-[#0E0D0C] px-4 py-4">
                      <p className="text-[9px] uppercase tracking-[0.1em] leading-4 text-[#625B54]">
                        Default Probability
                      </p>
                      <p className="mt-1 text-sm font-bold text-white">
                        {latestDecision.default_probability !== null
                          ? `${(latestDecision.default_probability * 100).toFixed(0)}%`
                          : "N/A"}
                      </p>
                    </div>

                    <div className="bg-[#0E0D0C] px-4 py-4">
                      <p className="text-[9px] uppercase tracking-[0.1em] leading-4 text-[#625B54]">
                        Fraud
                      </p>
                      <p className="mt-1 text-sm font-bold text-white">
                        {latestDecision.fraud_category || "N/A"}
                        {latestDecision.fraud_score !== null
                          ? ` · ${latestDecision.fraud_score}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-t border-[#211E1A] px-4 py-4 sm:grid-cols-3 sm:px-5">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.1em] leading-4 text-[#625B54]">
                        Compliance
                      </p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-[#CFC6BC]">
                        {latestDecision.compliance_status || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase tracking-[0.1em] leading-4 text-[#625B54]">
                        Income Verification
                      </p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-[#CFC6BC]">
                        {latestDecision.income_status || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase tracking-[0.1em] leading-4 text-[#625B54]">
                        Next Step
                      </p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-[#CFC6BC]">
                        {latestDecision.next_step || "N/A"}
                      </p>
                    </div>
                  </div>

                  {(latestReasonCodes.length > 0 || latestReasons.length > 0) && (
                    <div className="border-t border-[#211E1A] bg-[#12100E] px-4 py-4 sm:px-5">
                      {latestReasonCodes.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.1em] leading-4 text-[#625B54]">
                            Reason Codes
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {latestReasonCodes.map((code, index) => (
                              <span
                                key={`${code}-${index}`}
                                className="rounded-md border border-[#5A4527] bg-[#1B150F] px-2 py-1 text-[9px] font-semibold leading-4 text-[#D6A94D]"
                              >
                                {code}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {latestReasons.length > 0 && (
                        <div className={latestReasonCodes.length > 0 ? "mt-4" : ""}>
                          <p className="text-[9px] font-bold uppercase tracking-[0.1em] leading-4 text-[#625B54]">
                            Underwriting Reasons
                          </p>

                          <ul className="mt-2 space-y-1.5">
                            {latestReasons.map((reason, index) => (
                              <li
                                key={`${reason}-${index}`}
                                className="text-[11px] leading-5 text-[#A79B8E]"
                              >
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </article>

                {/* Older persisted decisions stay compact */}
                {previousDecisions.length > 0 && (
                  <div className="pt-2">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] leading-4 text-[#756D65]">
                        Previous Decisions
                      </p>
                      <span className="text-[9px] text-[#625B54]">
                        {previousDecisions.length} archived records
                      </span>
                    </div>

                    <div className="space-y-2">
                      {previousDecisions.map((decision) => {
                        const classes = getDecisionClasses(decision.decision);
                        const HistoryIcon = classes.icon;

                        const reasonCodes = parseJsonArray(
                          decision.reason_codes,
                        );
                        const reasons = parseJsonArray(decision.reasons);

                        return (
                          <details
                            key={decision.id}
                            className="group overflow-hidden rounded-xl border border-[#30271F] bg-[#0E0D0C] transition-colors hover:border-[#5A4527]"
                          >
                            <summary className="cursor-pointer list-none px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-full border ${classes.border} ${classes.background} px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${classes.text}`}
                                  >
                                    <HistoryIcon size={11} />
                                    {decision.decision}
                                  </span>

                                  <span className="text-[9px] font-semibold uppercase tracking-wide text-[#625B54]">
                                    {decision.decision_status}
                                  </span>

                                  <span className="text-[9px] text-[#625B54]">
                                    Policy {decision.policy_version}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-[9px] text-[#756D65]">
                                  <span>{formatDate(decision.created_at)}</span>
                                  <span className="text-[#C89B3C] transition-transform group-open:rotate-180">
                                    ▼
                                  </span>
                                </div>
                              </div>
                            </summary>

                            <div className="border-t border-[#211E1A] px-4 py-4 sm:px-5">
                              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                <div>
                                  <p className="text-[9px] uppercase tracking-[0.1em] leading-4 text-[#625B54]">
                                    Risk Score
                                  </p>
                                  <p className="mt-1 text-sm font-bold text-white">
                                    {decision.risk_score ?? "N/A"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[9px] uppercase tracking-[0.1em] leading-4 text-[#625B54]">
                                    Risk Category
                                  </p>
                                  <p
                                    className={`mt-1 text-sm font-bold ${
                                      getRiskClasses(decision.risk_category).text
                                    }`}
                                  >
                                    {decision.risk_category || "N/A"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[9px] uppercase tracking-[0.1em] leading-4 text-[#625B54]">
                                    Default Probability
                                  </p>
                                  <p className="mt-1 text-sm font-bold text-white">
                                    {decision.default_probability !== null
                                      ? `${(decision.default_probability * 100).toFixed(0)}%`
                                      : "N/A"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[9px] uppercase tracking-[0.1em] leading-4 text-[#625B54]">
                                    Fraud
                                  </p>
                                  <p className="mt-1 text-sm font-bold text-white">
                                    {decision.fraud_category || "N/A"}
                                    {decision.fraud_score !== null
                                      ? ` · ${decision.fraud_score}`
                                      : ""}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 grid grid-cols-1 gap-4 border-t border-[#211E1A] pt-4 sm:grid-cols-3">
                                <div>
                                  <p className="text-[9px] uppercase tracking-[0.1em] leading-4 text-[#625B54]">
                                    Compliance
                                  </p>
                                  <p className="mt-1 text-xs font-semibold leading-5 text-[#CFC6BC]">
                                    {decision.compliance_status || "N/A"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[9px] uppercase tracking-[0.1em] leading-4 text-[#625B54]">
                                    Income Verification
                                  </p>
                                  <p className="mt-1 text-xs font-semibold leading-5 text-[#CFC6BC]">
                                    {decision.income_status || "N/A"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[9px] uppercase tracking-[0.1em] leading-4 text-[#625B54]">
                                    Next Step
                                  </p>
                                  <p className="mt-1 text-xs font-semibold leading-5 text-[#CFC6BC]">
                                    {decision.next_step || "N/A"}
                                  </p>
                                </div>
                              </div>

                              {(reasonCodes.length > 0 || reasons.length > 0) && (
                                <div className="mt-4 rounded-lg border border-[#30271F] bg-[#12100E] p-4">
                                  {reasonCodes.length > 0 && (
                                    <div>
                                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] leading-4 text-[#625B54]">
                                        Reason Codes
                                      </p>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {reasonCodes.map((code, index) => (
                                          <span
                                            key={`${code}-${index}`}
                                            className="rounded-md border border-[#5A4527] bg-[#1B150F] px-2 py-1 text-[9px] font-semibold leading-4 text-[#D6A94D]"
                                          >
                                            {code}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {reasons.length > 0 && (
                                    <div className={reasonCodes.length > 0 ? "mt-4" : ""}>
                                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] leading-4 text-[#625B54]">
                                        Underwriting Reasons
                                      </p>
                                      <ul className="mt-2 space-y-1.5">
                                        {reasons.map((reason, index) => (
                                          <li
                                            key={`${reason}-${index}`}
                                            className="text-[11px] leading-5 text-[#A79B8E]"
                                          >
                                            {reason}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      </section>
    </div>
  );
}

export default LoanApplicationDetail;