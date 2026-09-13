import { useEffect, useState } from "react";

type AnalyticsOverview = {
  total_applications: number;
  total_loan_volume: number;
  approved_count: number;
  approval_rate: number;
  high_risk_count: number;
  high_risk_rate: number;

  risk_distribution: {
    Low: number;
    Medium: number;
    High: number;
    "Very High": number;
  };

  approval_trend: {
    month: string;
    applications: number;
    approved: number;
    rejected: number;
    approval_rate: number;
  }[];

  average_processing_time: number;

  applications: {
    application_number: string;
    applicant_name: string;
    loan_type: string;
    loan_amount: number;
    status: string;
    risk_score: number | null;
    risk_category: string | null;
    created_at: string | null;
  }[];
};

function Analytics() {
  const [overview, setOverview] =
    useState<AnalyticsOverview | null>(null);

  useEffect(() => {
    fetch(
      "http://127.0.0.1:8000/api/loan-applications/analytics/overview"
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Failed to fetch analytics overview"
          );
        }

        return response.json();
      })
      .then((data: AnalyticsOverview) => {
        setOverview(data);
      })
      .catch((error) => {
        console.error(
          "Analytics overview fetch error:",
          error
        );
      });
  }, []);

  return (
    <div className="space-y-6">

      {/* Page Header */}

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C89B3C]">
          Portfolio Intelligence
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
          Analytics
        </h1>

        <p className="mt-2 text-sm text-[#8F877D]">
          Analyze underwriting performance, approval trends
          and portfolio risk distribution.
        </p>
      </div>

      {/* KPI Summary */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Total Loan Volume */}

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Total Loan Volume
          </p>

          <p className="mt-3 text-3xl font-extrabold text-white">
            {overview
              ? `₹${(
                  overview.total_loan_volume / 10000000
                ).toFixed(1)}Cr`
              : "—"}
          </p>

          <p className="mt-2 text-[11px] font-medium text-[#756D65]">
            Current portfolio volume
          </p>
        </div>

        {/* Approval Rate */}

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Approval Rate
          </p>

          <p className="mt-3 text-3xl font-extrabold text-emerald-400">
            {overview
              ? `${overview.approval_rate}%`
              : "—"}
          </p>

          <p className="mt-2 text-[11px] font-medium text-[#756D65]">
            Across current portfolio
          </p>
        </div>

        {/* Average Processing Time */}

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Avg. Processing Time
          </p>

          <p className="mt-3 text-3xl font-extrabold text-[#D6A94D]">
            {overview
              ? `${overview.average_processing_time}h`
              : "—"}
          </p>

          <p className="mt-2 text-[11px] font-medium text-[#756D65]">
            Current portfolio average
          </p>
        </div>

        {/* High Risk Rate */}

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            High Risk Rate
          </p>

          <p className="mt-3 text-3xl font-extrabold text-red-400">
            {overview
              ? `${overview.high_risk_rate}%`
              : "—"}
          </p>

          <p className="mt-2 text-[11px] font-medium text-[#756D65]">
            Portfolio exposure
          </p>
        </div>

      </section>

      {/* Approval Trend + Risk Distribution */}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_0.9fr]">

        {/* Approval Trend */}

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5">

          <div className="flex items-start justify-between">

            <div>
              <h2 className="text-sm font-bold text-white">
                Approval Trend
              </h2>

              <p className="mt-1 text-[11px] text-[#756D65]">
                Monthly underwriting approval performance
              </p>
            </div>

            <span className="rounded-full border border-[#46351F] bg-[#18120E] px-3 py-1 text-[9px] font-bold text-[#D6A94D]">
              {overview?.approval_trend?.length ?? 0} Months
            </span>

          </div>

          <div className="mt-7 flex h-52 items-end gap-3 sm:gap-5">

            {overview?.approval_trend?.length ? (

              overview.approval_trend.map((item) => (

                <div
                  key={item.month}
                  className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
                >

                  <div
                    className="w-full max-w-12 rounded-t-xl bg-[#8F6A2D] transition-all duration-300 group-hover:bg-[#D6A94D] group-hover:shadow-[0_0_24px_rgba(214,169,77,0.18)]"
                    style={{
                      height: `${Math.max(
                        item.approval_rate,
                        2
                      )}%`,
                    }}
                    title={`${item.approval_rate}% approval rate`}
                  />

                  <span className="text-[9px] font-medium text-[#625B54]">
                    {item.month}
                  </span>

                </div>

              ))

            ) : (

              <div className="flex w-full items-center justify-center text-xs text-[#756D65]">
                No approval trend data available.
              </div>

            )}

          </div>

        </div>

        {/* Risk Distribution */}

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5">

          <div>
            <h2 className="text-sm font-bold text-white">
              Risk Distribution
            </h2>

            <p className="mt-1 text-[11px] text-[#756D65]">
              Current portfolio classification
            </p>
          </div>

          <div className="mt-6 space-y-5">

            {overview &&
              Object.entries(
                overview.risk_distribution
              ).map(([category, count]) => {

                const total = Object.values(
                  overview.risk_distribution
                ).reduce(
                  (sum, value) => sum + value,
                  0
                );

                const percentage =
                  total > 0
                    ? Math.round(
                        (count / total) * 100
                      )
                    : 0;

                const label =
                  category === "Very High"
                    ? "Very High Risk"
                    : `${category} Risk`;

                const textClass =
                  category === "Low"
                    ? "text-emerald-400"
                    : category === "Medium"
                      ? "text-amber-400"
                      : "text-red-400";

                const barClass =
                  category === "Low"
                    ? "bg-emerald-400"
                    : category === "Medium"
                      ? "bg-amber-400"
                      : "bg-red-400";

                return (
                  <div key={category}>

                    <div className="mb-2 flex items-center justify-between">

                      <span className="text-xs font-medium text-[#A69B90]">
                        {label}
                      </span>

                      <span
                        className={`text-xs font-bold ${textClass}`}
                      >
                        {percentage}%
                      </span>

                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-[#211D18]">

                      <div
                        className={`h-full rounded-full ${barClass}`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />

                    </div>

                    <p className="mt-1 text-[10px] text-[#756D65]">
                      {count} application
                      {count !== 1 ? "s" : ""}
                    </p>

                  </div>
                );
              })}

          </div>

          <div className="mt-7 border-t border-[#28221C] pt-5">

            <div className="flex items-center justify-between">

              <span className="text-[10px] text-[#756D65]">
                Portfolio Risk Score
              </span>

              <span className="text-sm font-extrabold text-white">
                —
              </span>

            </div>

            <p className="mt-1 text-[10px] text-[#756D65]">
              Portfolio risk score is not currently provided
              by the analytics API.
            </p>

          </div>

        </div>

      </section>

      {/* Monthly Performance */}

      <section className="overflow-hidden rounded-2xl border border-[#2A241E] bg-[#12110F]">

        <div className="border-b border-[#2A241E] px-5 py-4">

          <h2 className="text-sm font-bold text-white">
            Monthly Performance
          </h2>

          <p className="mt-1 text-[11px] text-[#756D65]">
            Underwriting activity and decision outcomes
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[760px]">

            <thead>

              <tr className="border-b border-[#2A241E] text-left text-[9px] uppercase tracking-[0.12em] text-[#625B54]">

                <th className="px-5 py-4 font-semibold">
                  Month
                </th>

                <th className="px-4 py-4 font-semibold">
                  Applications
                </th>

                <th className="px-4 py-4 font-semibold">
                  Approved
                </th>

                <th className="px-4 py-4 font-semibold">
                  Rejected
                </th>

                <th className="px-4 py-4 font-semibold">
                  Approval Rate
                </th>

              </tr>

            </thead>

            <tbody>

              {overview?.approval_trend?.length ? (

                overview.approval_trend.map((row) => (

                  <tr
                    key={row.month}
                    className="border-b border-[#211E1A] transition-colors duration-200 hover:bg-[#1A1511]"
                  >

                    <td className="px-5 py-4 text-xs font-bold text-white">
                      {row.month}
                    </td>

                    <td className="px-4 py-4 text-xs text-[#B9B0A7]">
                      {row.applications}
                    </td>

                    <td className="px-4 py-4 text-xs font-semibold text-emerald-400">
                      {row.approved}
                    </td>

                    <td className="px-4 py-4 text-xs font-semibold text-red-400">
                      {row.rejected}
                    </td>

                    <td className="px-4 py-4 text-xs font-bold text-[#D6A94D]">
                      {row.approval_rate}%
                    </td>

                  </tr>

                ))

              ) : (

                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-xs text-[#756D65]"
                  >
                    No monthly performance data available.
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}

export default Analytics;