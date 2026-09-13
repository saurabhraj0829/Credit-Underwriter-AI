import { useEffect, useMemo, useState } from "react";
import { Bell, Search, CircleUserRound, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

function Navbar() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchApplications = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          "http://127.0.0.1:8000/api/loan-applications/"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch loan applications");
        }

        const data: LoanApplication[] = await response.json();

        if (mounted) {
          setApplications(data);
        }
      } catch (error) {
        console.error("Navbar applications fetch error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchApplications();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredApplications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return applications
      .filter((application) => {
        const searchableText = [
          application.application_number,
          application.applicant_name,
          application.loan_type,
          application.status,
          application.risk_category,
          String(application.loan_amount),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      })
      .slice(0, 6);
  }, [applications, searchTerm]);

  const showSearchResults = isFocused && searchTerm.trim().length > 0;

  const handleApplicationClick = (applicationNumber: string) => {
    setSearchTerm("");
    setIsFocused(false);

    navigate(`/loan-applications/${applicationNumber}`);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <header className="h-[72px] w-full border-b border-[#2A1D18] bg-[#0B0A09]">
      <div className="flex h-full items-center justify-between gap-6 px-8">

        {/* Search */}
        <div className="relative min-w-0 w-[420px] max-w-full">

          <Search
            size={17}
            strokeWidth={2}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 z-20 -translate-y-1/2 text-[#C89B3C]"
          />
          <input
  type="text"
  value={searchTerm}
  aria-label="Search applications"
  placeholder="Search applications..."
  autoComplete="off"
  onFocus={() => setIsFocused(true)}
  onChange={(event) => setSearchTerm(event.target.value)}
  onKeyDown={(event) => {
    if (event.key === "Escape") {
      clearSearch();
      setIsFocused(false);
    }
  }}
  style={{
    paddingLeft: "52px",
    paddingRight: "44px",
  }}
  className="
    block
    h-11
    w-full
    appearance-none
    rounded-xl
    border
    border-[#C89B3C]
    bg-[#181311]
    text-sm
    text-white
    placeholder:text-[#7C7167]
    outline-none
    transition-all
    duration-200
    shadow-[0_0_0_1px_rgba(200,155,60,0.12)]
    focus:border-[#E2B85B]
    focus:ring-2
    focus:ring-[#C89B3C]/25
    focus:shadow-[0_0_18px_rgba(200,155,60,0.14)]
  "
/>
          

          {searchTerm && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={clearSearch}
              className="
                absolute
                right-3
                top-1/2
                z-20
                flex
                h-7
                w-7
                -translate-y-1/2
                items-center
                justify-center
                rounded-lg
                text-[#8F877D]
                transition
                hover:bg-[#241B15]
                hover:text-[#C89B3C]
              "
            >
              <X size={15} />
            </button>
          )}

          {/* Search Results */}
          {showSearchResults && (
            <div
              className="
                absolute
                left-0
                right-0
                top-[calc(100%+8px)]
                z-50
                overflow-hidden
                rounded-xl
                border
                border-[#C89B3C]
                bg-[#12100F]
                shadow-[0_10px_35px_rgba(0,0,0,0.45)]
              "
            >
              {loading ? (
                <div className="px-4 py-4 text-xs text-[#8F877D]">
                  Loading applications...
                </div>
              ) : filteredApplications.length > 0 ? (
                <div className="py-1">

                  {filteredApplications.map((application) => (
                    <button
                      key={application.id}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      onClick={() =>
                        handleApplicationClick(
                          application.application_number
                        )
                      }
                      className="
                        group
                        flex
                        w-full
                        items-center
                        justify-between
                        gap-4
                        border-b
                        border-[#241D18]
                        px-4
                        py-3
                        text-left
                        transition
                        last:border-b-0
                        hover:bg-[#211912]
                      "
                    >
                      <div className="min-w-0">

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#C89B3C]">
                            {application.application_number}
                          </span>

                          <span className="truncate text-xs font-semibold text-white">
                            {application.applicant_name}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-[10px] text-[#756D65]">
                          <span>{application.loan_type}</span>
                          <span>•</span>
                          <span>
                            ₹
                            {(application.loan_amount / 100000).toFixed(1)}
                            L
                          </span>
                        </div>

                      </div>

                      <div className="shrink-0 text-right">

                        <div
                          className={`text-[10px] font-bold ${
                            application.risk_category === "High"
                              ? "text-red-400"
                              : application.risk_category === "Medium"
                                ? "text-amber-400"
                                : "text-emerald-400"
                          }`}
                        >
                          {application.risk_category ?? "Pending"}
                        </div>

                        <div className="mt-1 text-[9px] text-[#756D65]">
                          {application.status}
                        </div>

                      </div>
                    </button>
                  ))}

                </div>
              ) : (
                <div className="px-4 py-5">
                  <p className="text-xs font-semibold text-white">
                    No applications found
                  </p>

                  <p className="mt-1 text-[10px] text-[#756D65]">
                    Try an application number, applicant name, loan type or
                    status.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side */}
        <div className="flex shrink-0 items-center gap-3">

          <div className="hidden items-center gap-2 md:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_9px_rgba(52,211,153,0.8)]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-400">
              System Online
            </span>
          </div>

          <button
            type="button"
            aria-label="Notifications"
            className="cu-nav-button"
          >
            <Bell size={18} />

            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-400 shadow-[0_0_7px_rgba(251,113,133,0.8)]" />
          </button>

          <button
            type="button"
            aria-label="User profile"
            className="cu-profile-button"
          >
            <CircleUserRound size={19} />
          </button>

        </div>
      </div>
    </header>
  );
}

export default Navbar;