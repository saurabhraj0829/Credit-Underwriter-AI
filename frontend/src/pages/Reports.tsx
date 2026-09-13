import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://127.0.0.1:8000";

type ReportPeriod =
  | "all"
  | "current_month"
  | "previous_month"
  | "current_quarter"
  | "previous_quarter"
  | "year_to_date";

type ReportsOverview = {
  period: string;
  data_source: string;
  total_reports: number;
  executive_reports: number;
  risk_reports: number;
  compliance_reports: number;
  approved_reports: number;
  rejected_reports: number;
  manual_review_reports: number;
  high_risk_reports: number;
  fraud_flagged_reports: number;
  compliance_review_reports: number;
  recent_reports: ReportRecord[];
};

type ReportRecord = {
  report_id: number;
  application_number: string;
  applicant_name: string | null;
  loan_type: string | null;
  loan_amount: number | null;
  report_type: string;
  decision: string | null;
  decision_status: string | null;
  risk_category: string | null;
  risk_score: number | null;
  fraud_category: string | null;
  compliance_status: string | null;
  policy_version: string | null;
  created_at: string | null;
};

const periodLabels: Record<ReportPeriod, string> = {
  all: "All Available",
  current_month: "Current Month",
  previous_month: "Previous Month",
  current_quarter: "Current Quarter",
  previous_quarter: "Previous Quarter",
  year_to_date: "Year to Date",
};

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

function formatDateTime(value: string | null) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMonth(value: string | null) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

function getDecisionClass(decision: string | null) {
  if (decision === "Approved") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  }

  if (decision === "Rejected") {
    return "border-red-500/20 bg-red-500/10 text-red-400";
  }

  return "border-amber-500/20 bg-amber-500/10 text-[#D6A94D]";
}

function getRiskClass(risk: string | null) {
  if (risk === "High" || risk === "Very High") {
    return "text-red-400";
  }

  if (risk === "Medium") {
    return "text-amber-400";
  }

  if (risk === "Low") {
    return "text-emerald-400";
  }

  return "text-[#8F877D]";
}

function Reports() {
  const navigate = useNavigate();

  const [period, setPeriod] = useState<ReportPeriod>("all");
  const [selectedReportType, setSelectedReportType] = useState(
    "Executive Underwriting"
  );

  const [data, setData] = useState<ReportsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const fetchReports = useCallback(
    async (selectedPeriod: ReportPeriod = period) => {
      try {
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/api/reports/overview?period=${selectedPeriod}`
        );

        if (!response.ok) {
          throw new Error(
            `Reports API returned HTTP ${response.status}`
          );
        }

        const result: ReportsOverview = await response.json();
        setData(result);
      } catch (err) {
        console.error("Failed to load reports:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load reports."
        );
      } finally {
        setLoading(false);
        setGenerating(false);
      }
    },
    [period]
  );

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    setExportMessage(null);

    await fetchReports(period);
  };

  const handlePeriodChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const nextPeriod = event.target.value as ReportPeriod;

    setPeriod(nextPeriod);
    setExportMessage(null);
  };

  const handleExport = (format: "PDF" | "CSV") => {
    setExportMessage(
      `${format} export is not available yet. The backend currently provides live report data only.`
    );
  };

  const reportRows = useMemo(() => {
    return data?.recent_reports ?? [];
  }, [data]);

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C89B3C]">
          Executive Intelligence
        </p>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Reports
            </h1>

            <p className="mt-2 text-sm text-[#8F877D]">
              Generate and review executive underwriting, risk and compliance reports.
            </p>
          </div>

          <div className="text-[10px] text-[#625B54]">
            Source:{" "}
            <span className="text-[#8F877D]">
              {data?.data_source ?? "Loading..."}
            </span>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#3A3026] border-t-[#D6A94D]" />
            <p className="text-xs text-[#8F877D]">
              Loading live underwriting reports...
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-5">
          <p className="text-xs font-semibold text-red-400">
            Unable to load reports
          </p>

          <p className="mt-1 text-[11px] text-[#8F877D]">
            {error}
          </p>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchReports(period);
            }}
            className="mt-4 rounded-xl border border-[#806331] bg-[#241B11] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#D6A94D] transition-all hover:border-[#D6A94D] hover:bg-[#2B2013]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Report Summary */}
      {!loading && !error && data && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
              Total Reports
            </p>

            <p className="mt-3 text-3xl font-extrabold text-white">
              {data.total_reports}
            </p>

            <p className="mt-2 text-[11px] text-[#756D65]">
              Persisted underwriting decisions
            </p>
          </div>

          <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
              Executive Reports
            </p>

            <p className="mt-3 text-3xl font-extrabold text-[#D6A94D]">
              {data.executive_reports}
            </p>

            <p className="mt-2 text-[11px] text-[#756D65]">
              Executive underwriting records
            </p>
          </div>

          <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
              Risk Reports
            </p>

            <p className="mt-3 text-3xl font-extrabold text-red-400">
              {data.risk_reports}
            </p>

            <p className="mt-2 text-[11px] text-[#756D65]">
              Records containing risk assessment
            </p>
          </div>

          <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
              Compliance Reports
            </p>

            <p className="mt-3 text-3xl font-extrabold text-emerald-400">
              {data.compliance_reports}
            </p>

            <p className="mt-2 text-[11px] text-[#756D65]">
              Records containing compliance assessment
            </p>
          </div>

        </section>
      )}

      {/* Decision Snapshot */}
      {!loading && !error && data && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">

          <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#625B54]">
              Approved
            </p>
            <p className="mt-2 text-xl font-extrabold text-emerald-400">
              {data.approved_reports}
            </p>
          </div>

          <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#625B54]">
              Rejected
            </p>
            <p className="mt-2 text-xl font-extrabold text-red-400">
              {data.rejected_reports}
            </p>
          </div>

          <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#625B54]">
              Manual Review
            </p>
            <p className="mt-2 text-xl font-extrabold text-[#D6A94D]">
              {data.manual_review_reports}
            </p>
          </div>

          <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#625B54]">
              High Risk
            </p>
            <p className="mt-2 text-xl font-extrabold text-red-400">
              {data.high_risk_reports}
            </p>
          </div>

          <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#625B54]">
              Fraud Flagged
            </p>
            <p className="mt-2 text-xl font-extrabold text-orange-400">
              {data.fraud_flagged_reports}
            </p>
          </div>

        </section>
      )}

      {/* Report Generator */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5">

          <div>
            <h2 className="text-sm font-bold text-white">
              Generate Report
            </h2>

            <p className="mt-1 text-[11px] text-[#756D65]">
              Select a supported reporting period and refresh live underwriting data.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#777068]">
                Report Type
              </label>

              <select
                value={selectedReportType}
                onChange={(event) =>
                  setSelectedReportType(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-[#342A22] bg-[#171512] px-3 py-3 text-xs text-[#CFC6BC] outline-none transition-all focus:border-[#806331]"
              >
                <option>Executive Underwriting</option>
                <option disabled>Risk Portfolio</option>
                <option disabled>Fraud Analysis</option>
                <option disabled>Compliance Review</option>
                <option disabled>Monthly Performance</option>
              </select>

              <p className="mt-2 text-[9px] text-[#625B54]">
                Currently supported: {selectedReportType}
              </p>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#777068]">
                Reporting Period
              </label>

              <select
                value={period}
                onChange={handlePeriodChange}
                className="mt-2 w-full rounded-xl border border-[#342A22] bg-[#171512] px-3 py-3 text-xs text-[#CFC6BC] outline-none transition-all focus:border-[#806331]"
              >
                <option value="all">All Available</option>
                <option value="current_month">Current Month</option>
                <option value="previous_month">Previous Month</option>
                <option value="current_quarter">Current Quarter</option>
                <option value="previous_quarter">Previous Quarter</option>
                <option value="year_to_date">Year to Date</option>
              </select>
            </div>

          </div>

          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={generating}
            className="mt-5 rounded-xl border border-[#806331] bg-[#241B11] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#D6A94D] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D6A94D] hover:bg-[#2B2013] hover:shadow-[0_0_24px_rgba(214,169,77,0.14)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? "Refreshing..." : "Generate Report"}
          </button>

        </div>

        {/* Export Options */}
        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5">

          <h2 className="text-sm font-bold text-white">
            Export Options
          </h2>

          <p className="mt-1 text-[11px] text-[#756D65]">
            Export endpoints are not implemented in the current backend.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={() => handleExport("PDF")}
              className="rounded-xl border border-[#28221C] bg-[#171512] px-4 py-4 text-left transition-all duration-200 hover:border-[#806331] hover:bg-[#1A1713]"
            >
              <p className="text-xs font-bold text-white">
                PDF
              </p>

              <p className="mt-1 text-[9px] text-[#756D65]">
                Not available yet
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleExport("CSV")}
              className="rounded-xl border border-[#28221C] bg-[#171512] px-4 py-4 text-left transition-all duration-200 hover:border-[#806331] hover:bg-[#1A1713]"
            >
              <p className="text-xs font-bold text-white">
                CSV
              </p>

              <p className="mt-1 text-[9px] text-[#756D65]">
                Not available yet
              </p>
            </button>

          </div>

          {exportMessage && (
            <div className="mt-4 rounded-xl border border-[#342A22] bg-[#171512] px-3 py-3">
              <p className="text-[10px] leading-5 text-[#8F877D]">
                {exportMessage}
              </p>
            </div>
          )}

        </div>

      </section>

      {/* Recent Reports */}
      <section className="overflow-hidden rounded-2xl border border-[#2A241E] bg-[#12110F]">

        <div className="border-b border-[#2A241E] px-5 py-4">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-sm font-bold text-white">
                Recent Reports
              </h2>

              <p className="mt-1 text-[11px] text-[#756D65]">
                Latest persisted underwriting records from the selected period
              </p>
            </div>

            <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#625B54]">
              {periodLabels[period]}
            </span>

          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1050px]">

            <thead>
              <tr className="border-b border-[#2A241E] text-left text-[9px] uppercase tracking-[0.12em] text-[#625B54]">

                <th className="px-5 py-4 font-semibold">
                  Application
                </th>

                <th className="px-4 py-4 font-semibold">
                  Applicant
                </th>

                <th className="px-4 py-4 font-semibold">
                  Loan
                </th>

                <th className="px-4 py-4 font-semibold">
                  Decision
                </th>

                <th className="px-4 py-4 font-semibold">
                  Risk
                </th>

                <th className="px-4 py-4 font-semibold">
                  Fraud
                </th>

                <th className="px-4 py-4 font-semibold">
                  Compliance
                </th>

                <th className="px-4 py-4 font-semibold">
                  Generated
                </th>

              </tr>
            </thead>

            <tbody>

              {reportRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center"
                  >
                    <p className="text-xs text-[#8F877D]">
                      No underwriting reports found for this period.
                    </p>
                  </td>
                </tr>
              ) : (
                reportRows.map((report) => (
                  <tr
                    key={report.report_id}
                    className="border-b border-[#211E1A] transition-colors duration-200 hover:bg-[#1A1511]"
                  >

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/loan-applications/${report.application_number}`
                          )
                        }
                        className="text-left"
                      >
                        <p className="text-xs font-bold text-[#D6A94D] hover:text-[#F0C96A]">
                          {report.application_number}
                        </p>

                        <p className="mt-1 text-[9px] text-[#625B54]">
                          Report #{report.report_id}
                        </p>
                      </button>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-xs font-semibold text-white">
                        {report.applicant_name ?? "N/A"}
                      </p>

                      <p className="mt-1 text-[9px] text-[#625B54]">
                        {report.loan_type ?? "N/A"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-xs text-[#CFC6BC]">
                        {formatCurrency(report.loan_amount)}
                      </p>

                      <p className="mt-1 text-[9px] text-[#625B54]">
                        {formatMonth(report.created_at)}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[9px] font-bold ${getDecisionClass(
                          report.decision
                        )}`}
                      >
                        {report.decision ?? "N/A"}
                      </span>

                      <p className="mt-2 text-[9px] text-[#625B54]">
                        {report.decision_status ?? "N/A"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p
                        className={`text-xs font-bold ${getRiskClass(
                          report.risk_category
                        )}`}
                      >
                        {report.risk_category ?? "N/A"}
                      </p>

                      <p className="mt-1 text-[9px] text-[#625B54]">
                        Score: {report.risk_score ?? "N/A"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-xs text-[#CFC6BC]">
                        {report.fraud_category ?? "N/A"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-xs text-[#CFC6BC]">
                        {report.compliance_status ?? "N/A"}
                      </p>

                      <p className="mt-1 text-[9px] text-[#625B54]">
                        Policy {report.policy_version ?? "N/A"}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-xs text-[#8F877D]">
                      {formatDateTime(report.created_at)}
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}

export default Reports;