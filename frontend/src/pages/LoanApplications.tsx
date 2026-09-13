import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

function LoanApplications() {
const [applications, setApplications] = useState<LoanApplication[]>([]);
  
const totalApplications = applications.length;

  const approvedApplications = applications.filter(
    (application) => application.status === "Approved"
  ).length;

  const pendingApplications = applications.filter(
  (application) =>
    application.status === "Pending" ||
    application.status === "Under Review" ||
    application.status === "Manual Review"
).length;

  const highRiskApplications = applications.filter(
    (application) => application.risk_category === "High"
  ).length;

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/loan-applications/")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch loan applications");
        }

        return response.json();
      })
      .then((data: LoanApplication[]) => {
        setApplications(data);
      })
      .catch((error) => {
        console.error("Loan applications fetch error:", error);
      });
  }, []);
  
return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C89B3C]">
          Loan Management
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
          Loan Applications
        </h1>

        <p className="mt-2 text-sm text-[#8F877D]">
          Review, monitor and manage credit applications across the underwriting pipeline.
        </p>
      </div>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Total Applications
          </p>
          <p className="mt-3 text-3xl font-extrabold text-white">
            {totalApplications}
          </p>
        </div>

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Approved
          </p>
          <p className="mt-3 text-3xl font-extrabold text-emerald-400">
            {approvedApplications}
          </p>
        </div>

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Pending Review
          </p>
          <p className="mt-3 text-3xl font-extrabold text-amber-400">
            {pendingApplications}
          </p>
        </div>

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            High Risk
          </p>
          <p className="mt-3 text-3xl font-extrabold text-red-400">
            {highRiskApplications}
          </p>
        </div>

      </section>

      {/* Applications Table */}
      <section className="overflow-hidden rounded-2xl border border-[#2A241E] bg-[#12110F]">

        <div className="border-b border-[#2A241E] px-5 py-4">
          <h2 className="text-sm font-bold text-white">
            Application Pipeline
          </h2>

          <p className="mt-1 text-[11px] text-[#756D65]">
            Latest loan underwriting activity
          </p>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[760px]">

            <thead>
              <tr className="border-b border-[#2A241E] text-left text-[9px] uppercase tracking-[0.12em] text-[#625B54]">

                <th className="px-5 py-4">
                  Application
                </th>

                <th className="px-4 py-4">
                  Applicant
                </th>

                <th className="px-4 py-4">
                  Amount
                </th>

                <th className="px-4 py-4">
                  Risk
                </th>

                <th className="px-4 py-4">
                  Status
                </th>

              </tr>
            </thead>

            <tbody>

              {applications.map((application) => (

                <tr
                  key={application.id}
                  className="border-b border-[#211E1A] transition-colors duration-200 hover:bg-[#1A1511]"
                >

                  <td className="px-5 py-4 text-xs font-bold">
  <Link
    to={`/loan-applications/${application.application_number}`}
    className="text-white transition-colors hover:text-[#C89B3C]"
  >
    {application.application_number}
  </Link>
</td>

                  <td className="px-4 py-4 text-xs text-[#B9B0A7]">
                    {application.applicant_name}
                  </td>

                  <td className="px-4 py-4 text-xs font-semibold text-[#CFC6BC]">
                    ₹{(application.loan_amount / 100000).toFixed(1)}L
                  </td>

                  <td className="px-4 py-4">

                    <span
                      className={`
                        rounded-full
                        border
                        px-2.5
                        py-1
                        text-[9px]
                        font-bold
                        ${
                          application.risk_category === "Low"
                            ? "border-emerald-900/60 bg-emerald-950/30 text-emerald-400"
                            : application.risk_category === "Medium"
                              ? "border-amber-900/60 bg-amber-950/30 text-amber-400"
                              : "border-red-900/60 bg-red-950/30 text-red-400"
                        }
                      `}
                    >
                      {application.risk_category ?? "Pending"}
                    </span>

                  </td>

                  <td className="px-4 py-4">

                    <span
                      className={
                        application.status === "Approved"
                          ? "text-xs font-semibold text-emerald-400"
                          : application.status === "Escalated"
                            ? "text-xs font-semibold text-red-400"
                            : "text-xs font-semibold text-amber-400"
                      }
                    >
                      {application.status}
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

export default LoanApplications;