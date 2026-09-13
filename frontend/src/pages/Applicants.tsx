import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FileText, RefreshCw, ShieldCheck, Users } from "lucide-react";

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

type ApplicantRecord = {
  name: string;
  applications: LoanApplication[];
  latest: LoanApplication;
  totalExposure: number;
};

const API_URL = "http://127.0.0.1:8000/api/loan-applications/";

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatDate(value: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getRiskClasses(risk: string | null) {
  if (risk === "Low") return {
    border: "border-emerald-900/60",
    background: "bg-emerald-950/30",
    text: "text-emerald-400",
  };
  if (risk === "Medium") return {
    border: "border-amber-900/60",
    background: "bg-amber-950/30",
    text: "text-amber-400",
  };
  if (risk === "High") return {
    border: "border-red-900/60",
    background: "bg-red-950/30",
    text: "text-red-400",
  };
  return {
    border: "border-[#4A3823]",
    background: "bg-[#1B150F]",
    text: "text-[#A79B8E]",
  };
}

function getStatusClasses(status: string) {
  if (status === "Approved" || status === "Verified") return "text-emerald-400";
  if (status === "Rejected" || status === "Escalated") return "text-red-400";
  if (status === "Pending" || status === "Under Review") return "text-amber-400";
  return "text-[#D6A94D]";
}

function Applicants() {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchApplications() {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to fetch applicant data");
      const data: LoanApplication[] = await response.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      console.error("Applicants fetch error:", fetchError);
      setError("Unable to load applicant data from the underwriting system.");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchApplications();
  }, []);

  const applicants = useMemo<ApplicantRecord[]>(() => {
    const grouped = new Map<string, LoanApplication[]>();

    for (const application of applications) {
      const name = application.applicant_name?.trim() || "Unknown Applicant";
      const current = grouped.get(name) ?? [];
      current.push(application);
      grouped.set(name, current);
    }

    return Array.from(grouped.entries())
      .map(([name, records]) => {
        const sorted = [...records].sort((a, b) => {
          const at = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bt - at;
        });

        return {
          name,
          applications: sorted,
          latest: sorted[0],
          totalExposure: sorted.reduce(
            (sum, application) => sum + Number(application.loan_amount || 0),
            0,
          ),
        };
      })
      .sort((a, b) => {
        const at = a.latest.created_at ? new Date(a.latest.created_at).getTime() : 0;
        const bt = b.latest.created_at ? new Date(b.latest.created_at).getTime() : 0;
        return bt - at;
      });
  }, [applications]);

  const totalApplicants = applicants.length;

  const newApplicants = useMemo(() => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return applicants.filter((applicant) => {
      if (!applicant.latest.created_at) return false;
      const created = new Date(applicant.latest.created_at).getTime();
      return now - created >= 0 && now - created <= sevenDays;
    }).length;
  }, [applicants]);

  const approvedApplicants = useMemo(
    () =>
      applicants.filter((applicant) =>
        applicant.applications.some(
          (application) =>
            application.status === "Approved" ||
            application.status === "Verified",
        ),
      ).length,
    [applicants],
  );

  const attentionRequired = useMemo(
    () =>
      applicants.filter((applicant) =>
        applicant.applications.some(
          (application) =>
            application.status === "Escalated" ||
            application.risk_category === "High" ||
            application.status === "Rejected",
        ),
      ).length,
    [applicants],
  );

  return (
    <div className="cu-dashboard space-y-5 pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] leading-4 text-[#D6A94D]">
            Applicant Management
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            Applicants
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-5 text-[#8F877D]">
            Review applicant profiles, application exposure and underwriting activity from the live loan application database.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchApplications}
          disabled={loading}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#C89B3C] bg-[#18120E] px-4 text-xs font-bold text-[#D6A94D] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#211810] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-xs font-semibold text-red-400">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            {
              label: "Total Applicants",
              value: loading ? "—" : totalApplicants,
              valueClass: "text-white",
              Icon: Users,
            },
            {
              label: "New Applicants",
              value: loading ? "—" : newApplicants,
              valueClass: "text-[#D6A94D]",
              Icon: FileText,
            },
            {
              label: "Approved Applicants",
              value: loading ? "—" : approvedApplicants,
              valueClass: "text-emerald-400",
              Icon: ShieldCheck,
            },
            {
              label: "Attention Required",
              value: loading ? "—" : attentionRequired,
              valueClass: "text-amber-400",
              Icon: AlertTriangle,
            },
          ] as const
        ).map(({ label, value, valueClass, Icon }) => (
          <div
            key={String(label)}
            className="cu-panel !border-[#C89B3C] !shadow-[0_0_0_1px_rgba(200,155,60,0.14)] p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] leading-4 text-[#777068]">
                  {label}
                </p>
                <p className={`mt-3 text-3xl font-extrabold leading-none ${valueClass}`}>
                  {value}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#5A4527] bg-[#201811] text-[#D6A94D]">
                <Icon size={17} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="cu-panel overflow-hidden !border-[#C89B3C] !shadow-[0_0_0_1px_rgba(200,155,60,0.14)]">
        <div className="relative z-10 border-b border-[#3A3027] bg-[#12100E] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] leading-4 text-[#D6A94D]">
                Applicant Directory
              </p>
              <p className="mt-2 text-[11px] leading-5 text-[#756D65]">
                Unique applicant records grouped from live loan applications
              </p>
            </div>
            <span className="w-fit shrink-0 rounded-full border border-[#5A4527] bg-[#1B150F] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#D6A94D]">
              {loading ? "Loading" : `${totalApplicants} Records`}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center px-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#756D65]">
              <RefreshCw size={15} className="animate-spin text-[#C89B3C]" />
              Loading applicant records...
            </div>
          </div>
        ) : applicants.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center px-5 text-center">
            <Users size={22} className="text-[#5F574F]" />
            <p className="mt-3 text-xs font-semibold text-[#A79B8E]">
              No applicant records found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-[#30271F] bg-[#0F0E0D] text-left text-[9px] uppercase tracking-[0.12em] text-[#625B54]">
                  <th className="px-5 py-4 font-semibold">Applicant</th>
                  <th className="px-4 py-4 font-semibold">Applications</th>
                  <th className="px-4 py-4 font-semibold">Loan Exposure</th>
                  <th className="px-4 py-4 font-semibold">Risk</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Latest Activity</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((applicant) => {
                  const riskClasses = getRiskClasses(applicant.latest.risk_category);

                  return (
                    <tr
                      key={applicant.name}
                      className="border-b border-[#211E1A] transition-colors duration-200 hover:bg-[#1A1511]"
                    >
                      <td className="px-5 py-4">
                        <p className="break-words text-xs font-bold leading-5 text-white">
                          {applicant.name}
                        </p>
                        <p className="mt-1 text-[10px] leading-4 text-[#756D65]">
                          Latest: {applicant.latest.application_number}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-[#CFC6BC]">
                        {applicant.applications.length}
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-[#D6A94D]">
                        {formatCurrency(applicant.totalExposure)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold ${riskClasses.border} ${riskClasses.background} ${riskClasses.text}`}>
                          {applicant.latest.risk_category || "Unassessed"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs font-semibold ${getStatusClasses(applicant.latest.status)}`}>
                          {applicant.latest.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[11px] font-medium text-[#A79B8E]">
                        {formatDate(applicant.latest.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Applicants;