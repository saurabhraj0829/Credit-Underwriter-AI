import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

type ComplianceOverview = {
  total_applications: number;
  reviewed_applications: number;
  compliance_score: number;
  compliant_count: number;
  review_required_count: number;
  non_compliant_count: number;
  total_policy_checks: number;
  failed_checks: number;
  warning_checks: number;
  applications: {
    application_number: string;
    applicant_name: string;
    loan_type: string;
    loan_amount: number;
    compliance_status: string;
    failed_checks: number;
    warning_checks: number;
    status: string;
    created_at: string | null;
  }[];
};


function Compliance() {
  const navigate = useNavigate();

const [overview, setOverview] = useState<ComplianceOverview | null>(null);

useEffect(() => {
  fetch("http://127.0.0.1:8000/api/loan-applications/compliance/overview")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch compliance overview");
      }

      return response.json();
    })
    .then((data: ComplianceOverview) => {
      setOverview(data);
    })
    .catch((error) => {
      console.error("Compliance overview fetch error:", error);
    });
}, []);


  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C89B3C]">
          Regulatory Intelligence
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
          Compliance
        </h1>

        <p className="mt-2 text-sm text-[#8F877D]">
          Monitor policy adherence, regulatory checks and underwriting compliance status.
        </p>
      </div>

      {/* Compliance Summary */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Compliance Score
          </p>

          <p className="mt-3 text-3xl font-extrabold text-emerald-400">
  {overview?.compliance_score ?? 0}%
</p>

          <p className="mt-2 text-[11px] text-emerald-400">
            Healthy compliance posture
          </p>
        </div>

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Policy Checks
          </p>

          <p className="mt-3 text-3xl font-extrabold text-white">
  {overview?.total_policy_checks ?? 0}
</p>

          <p className="mt-2 text-[11px] text-[#756D65]">
            Completed this month
          </p>
        </div>

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Policy Violations
          </p>

          <p className="mt-3 text-3xl font-extrabold text-red-400">
  {overview?.non_compliant_count ?? 0}
</p>

          <p className="mt-2 text-[11px] text-red-400">
            Require investigation
          </p>
        </div>

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Pending Reviews
          </p>

          <p className="mt-3 text-3xl font-extrabold text-amber-400">
  {overview?.review_required_count ?? 0}
</p>

          <p className="mt-2 text-[11px] text-[#756D65]">
            Awaiting compliance officer
          </p>
        </div>

      </section>

      {/* Compliance Controls */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5">

          <div>
            <h2 className="text-sm font-bold text-white">
              Compliance Controls
            </h2>

            <p className="mt-1 text-[11px] text-[#756D65]">
              Current status of key regulatory controls
            </p>
          </div>

          <div className="mt-5 space-y-3">

            {[
  {
    label: "Policy Checks",
    status:
      overview && overview.failed_checks > 0
        ? "Failed"
        : overview && overview.warning_checks > 0
          ? "Review"
          : "Compliant",
  },
  {
    label: "Credit Policy",
    status:
      overview && overview.non_compliant_count > 0
        ? "Review"
        : "Compliant",
  },
  {
    label: "Approval Matrix",
    status:
      overview && overview.review_required_count > 0
        ? "Review"
        : "Compliant",
  },
].map((control) => (

              <div
                key={control.label}
                className="flex items-center justify-between rounded-xl border border-[#28221C] bg-[#171512] px-4 py-3 transition-all duration-200 hover:border-[#4A3923]"
              >

                <span className="text-xs font-medium text-[#A69B90]">
                  {control.label}
                </span>

                <span
                  className={
                    control.status === "Compliant"
                      ? "rounded-full border border-emerald-900/60 bg-emerald-950/30 px-2.5 py-1 text-[9px] font-bold text-emerald-400"
                      : "rounded-full border border-amber-900/60 bg-amber-950/30 px-2.5 py-1 text-[9px] font-bold text-amber-400"
                  }
                >
                  {control.status}
                </span>

              </div>

            ))}

          </div>

        </div>

        {/* Regulatory Sources */}
        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5">

          <div>
            <h2 className="text-sm font-bold text-white">
              Regulatory Knowledge Base
            </h2>

            <p className="mt-1 text-[11px] text-[#756D65]">
              Sources used by the compliance intelligence workflow
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">

            {[
              "RBI Guidelines",
              "KYC Policy",
              "AML Policy",
              "Credit Policy",
              "Approval Matrix",
              "Internal SOPs",
            ].map((source) => (

              <div
                key={source}
                className="rounded-xl border border-[#28221C] bg-[#171512] px-4 py-3 transition-all duration-200 hover:border-[#806331] hover:bg-[#1A1713]"
              >

                <p className="text-xs font-semibold text-[#CFC6BC]">
                  {source}
                </p>

                <p className="mt-1 text-[9px] text-emerald-400">
                  Knowledge source active
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* Compliance Alerts */}
      <section className="overflow-hidden rounded-2xl border border-[#2A241E] bg-[#12110F]">

        <div className="border-b border-[#2A241E] px-5 py-4">

          <h2 className="text-sm font-bold text-white">
            Compliance Alerts
          </h2>

          <p className="mt-1 text-[11px] text-[#756D65]">
            Recent policy and regulatory exceptions detected by the system
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[800px]">

            <thead>

              <tr className="border-b border-[#2A241E] text-left text-[9px] uppercase tracking-[0.12em] text-[#625B54]">

                <th className="px-5 py-4 font-semibold">
                  Application
                </th>

                <th className="px-4 py-4 font-semibold">
                  Control
                </th>

                <th className="px-4 py-4 font-semibold">
                  Finding
                </th>

                <th className="px-4 py-4 font-semibold">
                  Severity
                </th>

                <th className="px-4 py-4 font-semibold">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {overview?.applications
  .filter(
    (application) =>
      application.compliance_status !== "Compliant"
  )
  .map((application) => {
    const severity =
      application.compliance_status === "Non-Compliant"
        ? "High"
        : "Medium";

    const status =
      application.compliance_status === "Non-Compliant"
        ? "Open"
        : "Review";

    const finding =
      application.failed_checks > 0
        ? `${application.failed_checks} policy check(s) failed`
        : application.warning_checks > 0
          ? `${application.warning_checks} policy check(s) require review`
          : "Compliance review required";

    return {
      id: application.application_number,
      control: "Underwriting Policy",
      finding,
      severity,
      status,
    };
  })
  .map((alert) => (

                <tr
                  key={`${alert.id}-${alert.control}`}
                  className="border-b border-[#211E1A] transition-colors duration-200 hover:bg-[#1A1511]"
                >

                  <td className="px-5 py-4">
  <button
    type="button"
    onClick={() => navigate(`/loan-applications/${alert.id}`)}
    className="inline-flex items-center gap-2 text-xs font-bold text-white transition-colors hover:text-[#D6A94D]"
  >
    {alert.id}
    <ArrowRight size={13} />
  </button>
</td>

                  <td className="px-4 py-4 text-xs text-[#B9B0A7]">
                    {alert.control}
                  </td>

                  <td className="px-4 py-4 text-xs text-[#CFC6BC]">
                    {alert.finding}
                  </td>

                  <td className="px-4 py-4">

                    <span
                      className={
                        alert.severity === "High"
                          ? "rounded-full border border-red-900/60 bg-red-950/30 px-2.5 py-1 text-[9px] font-bold text-red-400"
                          : alert.severity === "Medium"
                            ? "rounded-full border border-amber-900/60 bg-amber-950/30 px-2.5 py-1 text-[9px] font-bold text-amber-400"
                            : "rounded-full border border-[#46351F] bg-[#18120E] px-2.5 py-1 text-[9px] font-bold text-[#D6A94D]"
                      }
                    >
                      {alert.severity}
                    </span>

                  </td>

                  <td className="px-4 py-4">

                    <span
                      className={
                        alert.status === "Open"
                          ? "text-xs font-semibold text-red-400"
                          : alert.status === "Review"
                            ? "text-xs font-semibold text-amber-400"
                            : "text-xs font-semibold text-[#D6A94D]"
                      }
                    >
                      {alert.status}
                    </span>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}

export default Compliance;