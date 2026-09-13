import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AuditLogs() {
  const navigate = useNavigate();

  const API_BASE_URL = "http://127.0.0.1:8000";

  const [logs, setLogs] = useState<any[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [readyCount, setReadyCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eventTypeCounts, setEventTypeCounts] = useState<Record<string, number>>({});
  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/audit-logs/?limit=100`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch audit logs (${response.status})`
        );
      }

      const data = await response.json();

      setLogs(data.logs || []);
      setTotalEvents(data.total_count || 0);
      setReadyCount(data.ready_count || 0);
      setCompletedCount(data.completed_count || 0);
      setErrorCount(data.error_count || 0);
      setEventTypeCounts(data.event_type_counts || {});
    } catch (err) {
      console.error("Audit logs fetch error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load audit logs."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const activitySummary = Object.entries(eventTypeCounts)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 5)
  .map(([name, count]) => ({
    name,
    count,
    percentage:
      totalEvents > 0
        ? Math.round((count / totalEvents) * 100)
        : 0,
  }));

  
  if (loading) {
  return (
    <div className="flex min-h-[400px] items-center justify-center text-sm text-[#8F877D]">
      Loading audit logs...
    </div>
  );
}

if (error) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
      <p className="text-sm font-semibold text-[#D6A94D]">
        Unable to load audit logs
      </p>

      <p className="mt-2 text-xs text-[#756D65]">
        {error}
      </p>

      <button
        type="button"
        onClick={fetchAuditLogs}
        className="mt-4 rounded-lg border border-[#3A3025] bg-[#181511] px-4 py-2 text-xs font-semibold text-[#D6A94D] transition-colors duration-200 hover:bg-[#211C16]"
      >
        Retry
      </button>
    </div>
  );
}

  return (
  
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C89B3C]">
          Governance & Traceability
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
          Audit Logs
        </h1>

        <p className="mt-2 text-sm text-[#8F877D]">
          Track underwriting actions, system events and decision history across the platform.
        </p>
      </div>

      {/* Audit Summary */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Total Events
          </p>

          <p className="mt-3 text-3xl font-extrabold text-white">
  {totalEvents.toLocaleString()}
</p>

          <p className="mt-2 text-[11px] text-[#756D65]">
            All recorded events
          </p>
        </div>

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Completed Events
          </p>

          <p className="mt-3 text-3xl font-extrabold text-[#D6A94D]">
            {completedCount.toLocaleString()}
          </p>

          <p className="mt-2 text-[11px] text-[#756D65]">
            Successfully completed
          </p>
        </div>

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Ready Events
          </p>

          <p className="mt-3 text-3xl font-extrabold text-emerald-400">
            {readyCount.toLocaleString()}
          </p>

          <p className="mt-2 text-[11px] text-emerald-400">
            Ready for next step
          </p>
        </div>

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3923]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777068]">
            Errors
          </p>

          <p className="mt-3 text-3xl font-extrabold text-red-400">
            {errorCount.toLocaleString()}
          </p>

          <p className="mt-2 text-[11px] text-red-400">
            Workflow errors
          </p>
        </div>

      </section>

      {/* Audit Controls */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">

        <div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5">

          <div>
            <h2 className="text-sm font-bold text-white">
              Audit Controls
            </h2>

            <p className="mt-1 text-[11px] text-[#756D65]">
              Current governance and audit configuration
            </p>
          </div>

          <div className="mt-5 space-y-3">

            {[
              {
                label: "Decision Traceability",
                status: "Enabled",
              },
              {
                label: "User Activity Logging",
                status: "Enabled",
              },
              {
                label: "AI Decision Logging",
                status: "Enabled",
              },
              {
                label: "Document Access Logging",
                status: "Enabled",
              },
              {
                label: "Security Event Monitoring",
                status: "Active",
              },
            ].map((control) => (

              <div
                key={control.label}
                className="flex items-center justify-between rounded-xl border border-[#28221C] bg-[#171512] px-4 py-3 transition-all duration-200 hover:border-[#4A3923]"
              >

                <span className="text-xs font-medium text-[#A69B90]">
                  {control.label}
                </span>

                <span className="rounded-full border border-emerald-900/60 bg-emerald-950/30 px-2.5 py-1 text-[9px] font-bold text-emerald-400">
                  {control.status}
                </span>

              </div>

            ))}

          </div>

        </div>

        {/* Activity Summary */}
<div className="rounded-2xl border border-[#2A241E] bg-[#12110F] p-5">

  <div>
    <h2 className="text-sm font-bold text-white">
      Activity Summary
    </h2>

    <p className="mt-1 text-[11px] text-[#756D65]">
      Event distribution across the platform
    </p>
  </div>

  <div className="mt-6 space-y-4">

    {activitySummary.map((item) => (

      <div key={item.name}>

        <div className="mb-1.5 flex items-center justify-between">

          <span className="text-[10px] font-medium text-[#A69B90]">
            {item.name}
          </span>

          <span className="text-[10px] font-bold text-[#D6A94D]">
            {item.percentage}%
          </span>

        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-[#211D18]">

          <div
            className="h-full rounded-full bg-[#8F6A2D] transition-all duration-500 hover:bg-[#D6A94D]"
            style={{ width: `${item.percentage}%` }}
          />

        </div>

      </div>

    ))}

  </div>

</div>

      </section>

      {/* Audit Event Log */}
      <section className="overflow-hidden rounded-2xl border border-[#2A241E] bg-[#12110F]">

        <div className="flex items-center justify-between border-b border-[#2A241E] px-5 py-4">

          <div>
            <h2 className="text-sm font-bold text-white">
              Recent Audit Events
            </h2>

            <p className="mt-1 text-[11px] text-[#756D65]">
              Latest recorded system and user activity
            </p>
          </div>

          <div className="flex items-center gap-2">
  <button
    type="button"
    onClick={fetchAuditLogs}
    className="rounded-lg border border-[#3A3025] bg-[#181511] px-3 py-1.5 text-[9px] font-bold text-[#D6A94D] transition-colors duration-200 hover:bg-[#211C16]"
  >
    Refresh
  </button>

  <span className="rounded-full border border-[#46351F] bg-[#18120E] px-3 py-1 text-[9px] font-bold text-[#D6A94D]">
    Live Log
  </span>
</div>
            

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px]">

            <thead>

              <tr className="border-b border-[#2A241E] text-left text-[9px] uppercase tracking-[0.12em] text-[#625B54]">

                <th className="px-5 py-4 font-semibold">
                  Timestamp
                </th>

                <th className="px-4 py-4 font-semibold">
                  Actor
                </th>

                <th className="px-4 py-4 font-semibold">
                  Event
                </th>

                <th className="px-4 py-4 font-semibold">
                  Resource
                </th>

                <th className="px-4 py-4 font-semibold">
                  Result
                </th>

              </tr>

            </thead>

            <tbody>

              {logs.map((log) => (
  <tr
    key={log.id}
    className="border-b border-[#211E1A] transition-colors duration-200 hover:bg-[#1A1511]"
  >
    <td className="px-5 py-4 text-[10px] text-[#8F877D]">
      {new Date(log.created_at).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}
    </td>

    <td className="px-4 py-4 text-xs font-semibold text-[#CFC6BC]">
      {log.agent_name || "System"}
    </td>

    <td className="px-4 py-4 text-xs text-[#B9B0A7]">
      {log.event_type}
    </td>

    <td className="px-4 py-4 text-xs font-semibold text-[#D6A94D]">
  {log.application_number ? (
    <button
      type="button"
      onClick={() =>
        navigate(`/loan-applications/${log.application_number}`)
      }
      className="transition-colors duration-200 hover:text-[#F0C86A] hover:underline"
    >
      {log.application_number}
    </button>
  ) : (
    "System"
  )}
</td>

    <td className="px-4 py-4">
      <span className="rounded-full border border-emerald-900/60 bg-emerald-950/30 px-2.5 py-1 text-[9px] font-bold text-emerald-400">
        {log.event_status}
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

export default AuditLogs;