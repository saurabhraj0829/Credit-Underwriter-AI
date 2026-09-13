import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/Dashboard";
import LoanApplications from "../pages/LoanApplications";
import ApplicationDetail from "../pages/ApplicationDetail";
import Applicants from "../pages/Applicants";
import DocumentCenter from "../pages/DocumentCenter";
import RiskCenter from "../pages/RiskCenter";
import FraudCenter from "../pages/FraudCenter";
import Compliance from "../pages/Compliance";
import Analytics from "../pages/Analytics";
import AICopilot from "../pages/AICopilot";
import DecisionQueue from "../pages/DecisionQueue";
import Reports from "../pages/Reports";
import AuditLogs from "../pages/AuditLogs";
import Settings from "../pages/Settings";
function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <h1 className="text-4xl font-bold text-red-500">
        404 | Page Not Found
      </h1>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/loan-applications" element={<LoanApplications />} />
          <Route
  path="/loan-applications/:applicationNumber"
  element={<ApplicationDetail />}
/>
          <Route path="/applicants" element={<Applicants />} />
          <Route path="/documents" element={<DocumentCenter />} />
          <Route path="/risk" element={<RiskCenter />} />
          <Route path="/fraud" element={<FraudCenter />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai-copilot" element={<AICopilot />} />
          <Route path="/decision-queue" element={<DecisionQueue />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}