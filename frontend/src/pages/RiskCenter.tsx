import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
type RiskApplication = {
  application_number: string;
  applicant_name: string;
  loan_type: string;
  loan_amount: number;
  risk_score: number | null;
  default_probability: number | null;
  risk_category: string | null;
  status: string;
  created_at: string;
};

type RiskCase = {
  application_number: string;
  applicant_name: string;
  risk_score: number;
  default_probability: number;
  risk_category: string;
  status: string;
};

type RiskOverview = {
  total_applications: number;
  scored_applications: number;
  unscored_applications: number;
  average_risk_score: number;
  average_default_probability: number;
  risk_distribution: {
    Low: number;
    Medium: number;
    High: number;
    "Very High": number;
  };
  risk_percentages: {
    Low: number;
    Medium: number;
    High: number;
    "Very High": number;
  };
  high_risk_cases: RiskCase[];
  high_risk_count: number;
  manual_review_cases: RiskApplication[];
  manual_review_count: number;
  applications: RiskApplication[];
};

function RiskCenter() {
  const navigate = useNavigate();
  const [data, setData] = useState<RiskOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRiskOverview = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/api/loan-applications/risk/overview"
      );

      if (!response.ok) {
        throw new Error(
          `Risk overview request failed: ${response.status}`
        );
      }

      const result: RiskOverview = await response.json();

      setData(result);
    } catch (err) {
      console.error("Risk Center error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load risk overview."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskOverview();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C89B3C]">
            Credit Risk Intelligence
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            Risk Center
          </h1>

          <p className="mt-2 text-sm text-[#8F877D]">
            Monitor portfolio risk, credit scores and high-risk underwriting cases.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl border border-[#2A241E] bg-[#12110F]"
            />
          ))}
        </div>

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5">
          <div className="h-5 w-40 animate-pulse rounded bg-[#211D18]" />
          <div className="mt-6 h-48 animate-pulse rounded bg-[#211D18]" />
        </div>

      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C89B3C]">
            Credit Risk Intelligence
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            Risk Center
          </h1>

          <p className="mt-2 text-sm text-[#8F877D]">
            Monitor portfolio risk, credit scores and high-risk underwriting cases.
          </p>
        </div>

        <div className="rounded-2xl border border-red-900/50 bg-[#12110F] p-6">
          <p className="text-sm font-semibold text-red-400">
            Unable to load Risk Center
          </p>

          <p className="mt-2 text-xs text-[#8F877D]">
            {error || "Risk overview data is unavailable."}
          </p>

          <button
            onClick={fetchRiskOverview}
            className="mt-4 rounded-lg border border-[#4A3923] bg-[#1A1511] px-4 py-2 text-xs font-bold text-[#D6A94D] transition hover:border-[#C89B3C] hover:bg-[#211A13]"
          >
            Retry
          </button>
        </div>

      </div>
    );
  }

  const riskDistribution = [
    {
      label: "Low Risk",
      value: data.risk_percentages.Low,
      count: data.risk_distribution.Low,
      bar: "bg-emerald-400",
      text: "text-emerald-400",
    },
    {
      label: "Medium Risk",
      value: data.risk_percentages.Medium,
      count: data.risk_distribution.Medium,
      bar: "bg-amber-400",
      text: "text-amber-400",
    },
    {
      label: "High Risk",
      value: data.risk_percentages.High,
      count: data.risk_distribution.High,
      bar: "bg-red-400",
      text: "text-red-400",
    },
    {
      label: "Very High Risk",
      value: data.risk_percentages["Very High"],
      count: data.risk_distribution["Very High"],
      bar: "bg-red-500",
      text: "text-red-400",
    },
  ];

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C89B3C]">
          Credit Risk Intelligence
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
          Risk Center
        </h1>

        <p className="mt-2 text-sm text-[#8F877D]">
          Monitor portfolio risk, credit scores and high-risk underwriting cases.
        </p>
      </div>

      {/* Risk Summary */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923] hover:shadow-[0_14px_35px_rgba(200,155,60,0.06)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Average Risk Score
          </p>

          <p className="mt-3 text-3xl font-extrabold text-white">
            {data.average_risk_score}
          </p>

          <p className="mt-2 text-[11px] font-medium text-[#756D65]">
            Based on {data.scored_applications} scored applications
          </p>
        </div>

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923] hover:shadow-[0_14px_35px_rgba(200,155,60,0.06)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Low Risk
          </p>

          <p className="mt-3 text-3xl font-extrabold text-emerald-400">
            {data.risk_percentages.Low}%
          </p>

          <p className="mt-2 text-[11px] font-medium text-[#756D65]">
            {data.risk_distribution.Low} applications
          </p>
        </div>

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923] hover:shadow-[0_14px_35px_rgba(200,155,60,0.06)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            High Risk Cases
          </p>

          <p className="mt-3 text-3xl font-extrabold text-red-400">
            {data.high_risk_count}
          </p>

          <p className="mt-2 text-[11px] font-medium text-red-400">
            Immediate attention
          </p>
        </div>

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923] hover:shadow-[0_14px_35px_rgba(200,155,60,0.06)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Manual Review
          </p>

          <p className="mt-3 text-3xl font-extrabold text-amber-400">
            {data.manual_review_count}
          </p>

          <p className="mt-2 text-[11px] font-medium text-[#756D65]">
            Awaiting decision
          </p>
        </div>

      </section>

      {/* Risk Distribution */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5">

          <div>
            <h2 className="text-sm font-bold text-white">
              Risk Distribution
            </h2>

            <p className="mt-1 text-[11px] text-[#756D65]">
              Current credit portfolio classification
            </p>
          </div>

          <div className="mt-6 space-y-5">

            {riskDistribution.map((item) => (
              <div key={item.label}>

                <div className="mb-2 flex items-center justify-between">

                  <span className="text-xs font-medium text-[#A69B90]">
                    {item.label}
                  </span>

                  <span className={`text-xs font-bold ${item.text}`}>
                    {item.value}%
                  </span>

                </div>

                <div className="h-2 overflow-hidden rounded-full bg-[#211D18]">

                  <div
                    className={`h-full rounded-full ${item.bar} transition-all duration-500`}
                    style={{ width: `${item.value}%` }}
                  />

                </div>

                <p className="mt-1 text-[9px] text-[#625B54]">
                  {item.count} applications
                </p>

              </div>
            ))}

          </div>

        </div>

        {/* Risk Overview */}
        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5">

          <div>
            <h2 className="text-sm font-bold text-white">
              Portfolio Risk Overview
            </h2>

            <p className="mt-1 text-[11px] text-[#756D65]">
              Current underwriting risk metrics
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">

            <div className="rounded-xl border border-[#2A241E] bg-[#0E0D0C] p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#625B54]">
                Total Applications
              </p>

              <p className="mt-2 text-2xl font-extrabold text-white">
                {data.total_applications}
              </p>
            </div>

            <div className="rounded-xl border border-[#2A241E] bg-[#0E0D0C] p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#625B54]">
                Scored
              </p>

              <p className="mt-2 text-2xl font-extrabold text-emerald-400">
                {data.scored_applications}
              </p>
            </div>

            <div className="rounded-xl border border-[#2A241E] bg-[#0E0D0C] p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#625B54]">
                Avg Default Probability
              </p>

              <p className="mt-2 text-2xl font-extrabold text-[#D6A94D]">
                {(data.average_default_probability * 100).toFixed(1)}%
              </p>
            </div>

            <div className="rounded-xl border border-[#2A241E] bg-[#0E0D0C] p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#625B54]">
                Unscored
              </p>

              <p className="mt-2 text-2xl font-extrabold text-[#8F877D]">
                {data.unscored_applications}
              </p>
            </div>

          </div>

        </div>

      </section>

      {/* High Risk Cases */}
      <section className="overflow-hidden rounded-2xl border border-[#2A241E] bg-[#12110F]">

        <div className="border-b border-[#2A241E] px-5 py-4">

          <h2 className="text-sm font-bold text-white">
            High Risk Cases
          </h2>

          <p className="mt-1 text-[11px] text-[#756D65]">
            Applications requiring risk officer attention
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[760px]">

            <thead>

              <tr className="border-b border-[#2A241E] text-left text-[9px] uppercase tracking-[0.12em] text-[#625B54]">

                <th className="px-5 py-4 font-semibold">
                  Application
                </th>

                <th className="px-4 py-4 font-semibold">
                  Applicant
                </th>

                <th className="px-4 py-4 font-semibold">
                  Risk Score
                </th>

                <th className="px-4 py-4 font-semibold">
                  Default Probability
                </th>

                <th className="px-4 py-4 font-semibold">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {data.high_risk_cases.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-xs text-[#756D65]"
                  >
                    No high-risk applications found.
                  </td>
                </tr>
              ) : (
                data.high_risk_cases.map((item) => (

                  <tr
                    key={item.application_number}
                    className="border-b border-[#211E1A] transition-colors duration-200 hover:bg-[#1A1511]"
                  >

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/loan-applications/${item.application_number}`
                          )
                        }
                        className="group inline-flex items-center gap-1.5 text-xs font-bold text-white transition-colors hover:text-[#D6A94D]"
                      >
                        {item.application_number}
                        <ArrowRight
                          size={13}
                          className="transition-transform group-hover:translate-x-0.5"
                        />
                      </button>
                    </td>

                    <td className="px-4 py-4 text-xs text-[#B9B0A7]">
                      {item.applicant_name}
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-bold text-red-400">
                        {item.risk_score}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-xs font-semibold text-[#E0B45B]">
                      {(item.default_probability * 100).toFixed(1)}%
                    </td>

                    <td className="px-4 py-4">

                      <span className="rounded-full border border-red-900/60 bg-red-950/30 px-2.5 py-1 text-[9px] font-bold text-red-400">
                        {item.status}
                      </span>

                    </td>

                  </tr>

                ))
              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* Manual Review Cases */}
      <section className="overflow-hidden rounded-2xl border border-[#2A241E] bg-[#12110F]">

        <div className="border-b border-[#2A241E] px-5 py-4">

          <h2 className="text-sm font-bold text-white">
            Manual Review Queue
          </h2>

          <p className="mt-1 text-[11px] text-[#756D65]">
            Applications awaiting underwriting review
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[760px]">

            <thead>

              <tr className="border-b border-[#2A241E] text-left text-[9px] uppercase tracking-[0.12em] text-[#625B54]">

                <th className="px-5 py-4 font-semibold">
                  Application
                </th>

                <th className="px-4 py-4 font-semibold">
                  Applicant
                </th>

                <th className="px-4 py-4 font-semibold">
                  Risk Category
                </th>

                <th className="px-4 py-4 font-semibold">
                  Risk Score
                </th>

                <th className="px-4 py-4 font-semibold">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {data.manual_review_cases.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-xs text-[#756D65]"
                  >
                    No applications are currently awaiting manual review.
                  </td>
                </tr>
              ) : (
                data.manual_review_cases.map((item) => (

                  <tr
                    key={item.application_number}
                    className="border-b border-[#211E1A] transition-colors duration-200 hover:bg-[#1A1511]"
                  >

                    <td className="px-5 py-4">
  <button
    type="button"
    onClick={() =>
      navigate(
        `/loan-applications/${item.application_number}`
      )
    }
    className="group inline-flex items-center gap-1.5 text-xs font-bold text-white transition-colors hover:text-[#D6A94D]"
  >
    {item.application_number}
    <ArrowRight
      size={13}
      className="transition-transform group-hover:translate-x-0.5"
    />
  </button>
</td>

                    <td className="px-4 py-4 text-xs text-[#B9B0A7]">
                      {item.applicant_name}
                    </td>

                    <td className="px-4 py-4 text-xs font-semibold text-amber-400">
                      {item.risk_category}
                    </td>

                    <td className="px-4 py-4 text-xs font-bold text-[#D6A94D]">
                      {item.risk_score ?? "N/A"}
                    </td>

                    <td className="px-4 py-4">

                      <span className="rounded-full border border-amber-900/60 bg-amber-950/30 px-2.5 py-1 text-[9px] font-bold text-amber-400">
                        {item.status}
                      </span>

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

export default RiskCenter;