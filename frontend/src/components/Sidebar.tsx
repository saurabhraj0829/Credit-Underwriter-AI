import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  FolderOpen,
  ShieldAlert,
  ShieldCheck,
  Scale,
  BarChart3,
  Bot,
  ClipboardCheck,
  History,
  Settings,
  FileText,
  ChevronRight,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: FileSpreadsheet, label: "Loan Applications", path: "/loan-applications" },
  { icon: Users, label: "Applicants", path: "/applicants" },
  { icon: FolderOpen, label: "Document Center", path: "/documents" },
  { icon: ShieldAlert, label: "Risk Center", path: "/risk" },
  { icon: ShieldCheck, label: "Fraud Center", path: "/fraud" },
  { icon: Scale, label: "Compliance", path: "/compliance" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Bot, label: "AI Copilot", path: "/ai-copilot" },
  { icon: ClipboardCheck, label: "Decision Queue", path: "/decision-queue" },
  { icon: FileText, label: "Reports", path: "/reports" },
  { icon: History, label: "Audit Logs", path: "/audit-logs" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[280px] min-w-[280px] flex-col overflow-hidden border-r border-[#2A2119] bg-[#0D0907] text-white">
      <div className="flex h-[108px] shrink-0 items-center border-b border-[#2A2119] px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#D6A94D]/50 bg-gradient-to-br from-[#D6A94D] to-[#A87525] text-[#120D0A] shadow-[0_0_24px_rgba(200,155,60,0.18)]">
            <span className="text-xl font-extrabold tracking-tight">CU</span>
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[18px] font-bold leading-tight text-white">
              <span className="text-[#D6A94D]">Credit</span> Underwriter AI
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Enterprise Platform
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pt-5 pb-32 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#493720]">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`group flex h-12 w-full items-center gap-3 rounded-xl border px-3 text-left transition-all duration-200 ease-out ${
                  active
                    ? "border-[#6B512A] bg-[#211810] text-[#D6A94D] shadow-[0_0_22px_rgba(200,155,60,0.08)]"
                    : "border-transparent text-[#A59D95] hover:border-[#4A3823] hover:bg-[#1B1511] hover:text-white"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    active
                      ? "bg-[#2A2014] text-[#D6A94D]"
                      : "text-[#8F867D] group-hover:bg-[#251B13] group-hover:text-[#D6A94D]"
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.3 : 2} />
                </div>
                <span className={`whitespace-nowrap text-[15px] font-semibold ${active ? "text-[#E0B45B]" : "text-[#B7AEA5] group-hover:text-white"}`}>
                  {item.label}
                </span>
                {active ? (
                  <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-[#D6A94D] shadow-[0_0_10px_rgba(214,169,77,0.8)]" />
                ) : (
                  <ChevronRight size={14} className="ml-auto shrink-0 text-transparent transition-all group-hover:translate-x-0.5 group-hover:text-[#66513A]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="shrink-0 px-4 pb-6 pt-3">
        <button
          type="button"
          onClick={() => navigate("/ai-copilot")}
          className="group flex w-full items-center gap-3 rounded-2xl border border-[#46351F] bg-[#18120E] px-4 py-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C89B3C] hover:bg-[#211810] hover:shadow-[0_0_28px_rgba(200,155,60,0.14)]"
        >
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D6A94D]/40 bg-[#241B11] text-[#D6A94D]">
            <Bot size={22} strokeWidth={2} />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#0D0907] bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold text-white">Ask Credit AI</p>
            <p className="mt-1 text-[11px] font-medium text-emerald-400">Available 24/7</p>
          </div>
          <ChevronRight size={16} className="shrink-0 text-[#75644F]" />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
