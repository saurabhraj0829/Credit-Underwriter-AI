import { useEffect, useMemo, useState, type ReactElement } from "react";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

type Application = {
  application_number: string;
  applicant_name?: string;
  loan_type?: string;
  loan_amount?: number;
  status?: string;
};

type CopilotResponse = {
  agent?: string;
  agent_version?: string;
  application_id?: number;
  application_number?: string;
  question?: string;
  answer?: string | null;
  context_available?: boolean;
  rag_status?: string;
  evidence_available?: boolean;
  evidence_count?: number;
  evidence_sources?: Array<{
    document_id?: string;
    category?: string;
    source?: string;
    chunk_index?: number;
    relevance_score?: number;
  }>;
  relevance_threshold?: number;
  status?: string;
  error?: string;
  next_step?: string;
};

const API_BASE_URL = "http://127.0.0.1:8000";

const suggestedQuestions = [
  "Why does this application require manual review?",
  "Why was this loan rejected?",
  "Show compliance violations.",
  "Explain the current risk assessment.",
];

const quickActions = [
  {
    title: "Risk Analysis",
    description: "Analyze application risk and underwriting signals",
    icon: "◈",
    question: "Explain the current risk assessment.",
  },
  {
    title: "Compliance",
    description: "Check policy and regulatory issues",
    icon: "✓",
    question: "Are there any compliance issues with this application?",
  },
  {
    title: "Fraud Signals",
    description: "Identify suspicious underwriting signals",
    icon: "⌁",
    question: "Explain the fraud signals for this application.",
  },
  {
    title: "Decision Explain",
    description: "Explain why the current decision was made",
    icon: "✦",
    question: "Why does this application require manual review?",
  },
];

function formatCurrency(value?: number) {
  if (value === undefined || value === null) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatInlineMarkdown(value: string): ReactElement[] {
  const normalized = value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\\([_*`])/g, "$1");

  const parts = normalized.split(
    /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`)/g,
  );

  return parts.map((part, index) => {
    if (
      (part.startsWith("**") && part.endsWith("**")) ||
      (part.startsWith("__") && part.endsWith("__"))
    ) {
      return (
        <strong
          key={`strong-${index}`}
          className="font-bold text-white"
        >
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`code-${index}`}
          className="rounded-md border border-[#332A21] bg-[#0D0C0A] px-1.5 py-0.5 text-[10px] text-[#D6A94D]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={`text-${index}`}>{part}</span>;
  });
}

function parseTableRow(line: string): string[] {
  let content = line.trim();

  if (content.startsWith("|")) content = content.slice(1);
  if (content.endsWith("|")) content = content.slice(0, -1);

  const cells: string[] = [];
  let current = "";
  let escaped = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

function isTableSeparator(line: string): boolean {
  const cells = parseTableRow(line);
  return (
    cells.length >= 2 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()))
  );
}

function cleanHeader(value: string): string {
  return value
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/\\([_*`])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCollapsedHeader(
  header: string[],
  columnCount: number,
): string[] {
  if (header.length === columnCount) {
    return header;
  }

  if (header.length !== 1) {
    return header;
  }

  const raw = cleanHeader(header[0]);

  // Exact malformed headers produced by the Copilot response.
  const knownHeaders: Record<string, string[]> = {
    itemvalue: ["Item", "Value"],
    "documentidsection/chunkrelevantcontent": [
      "Document ID",
      "Section / Chunk",
      "Relevant Content",
    ],
    "documentidsection/chunkrelevantpolicytext": [
      "Document ID",
      "Section / Chunk",
      "Relevant Policy Text",
    ],
  };

  const key = raw
    .toLowerCase()
    .replace(/[^\w/]+/g, "");

  if (knownHeaders[key] && knownHeaders[key].length === columnCount) {
    return knownHeaders[key];
  }

  // Generic two-column fallback.
  if (columnCount === 2) {
    const candidates = [
      "Value",
      "Status",
      "Description",
      "Result",
      "Details",
    ];

    for (const boundary of candidates) {
      const position = raw.toLowerCase().lastIndexOf(
        boundary.toLowerCase(),
      );

      if (
        position > 0 &&
        position < raw.length - boundary.length
      ) {
        return [
          raw.slice(0, position).trim(),
          raw.slice(position).trim(),
        ];
      }
    }
  }

  // Generic three-column fallback for common underwriting evidence headers.
  if (columnCount === 3) {
    const lower = raw.toLowerCase();

    if (
      lower.includes("documentid") &&
      lower.includes("section") &&
      (lower.includes("content") || lower.includes("text"))
    ) {
      const documentIndex = lower.indexOf("section");
      const contentMatch = lower.match(
        /(relevant.*?(?:content|text))$/i,
      );

      if (documentIndex > 0 && contentMatch?.index != null) {
        return [
          raw.slice(0, documentIndex).trim(),
          raw.slice(documentIndex, contentMatch.index).trim(),
          raw.slice(contentMatch.index).trim(),
        ];
      }

      return [
        "Document ID",
        "Section / Chunk",
        lower.includes("policy")
          ? "Relevant Policy Text"
          : "Relevant Content",
      ];
    }
  }

  return header;
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const elements: ReactElement[] = [];

  let index = 0;

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (/^---+$/.test(line)) {
      elements.push(
        <hr
          key={`hr-${index}`}
          className="my-5 border-[#302920]"
        />,
      );
      index += 1;
      continue;
    }

    /*
     * Markdown table:
     *
     * | Header | Value |
     * |--------|-------|
     * | A      | B     |
     *
     * We deliberately parse the separator row separately so the first
     * header never becomes "HeaderValue".
     */
    if (
      line.startsWith("|") &&
      line.endsWith("|") &&
      index + 1 < lines.length
    ) {
      const separatorLine = lines[index + 1].trim();

      if (
        separatorLine.startsWith("|") &&
        separatorLine.endsWith("|") &&
        isTableSeparator(separatorLine)
      ) {
        const separator = parseTableRow(separatorLine);
        const rawHeader = parseTableRow(line);
        const header = normalizeCollapsedHeader(
          rawHeader,
          separator.length,
        );
        const rows: string[][] = [];

        index += 2;

        while (index < lines.length) {
          const tableLine = lines[index].trim();

          if (
            !tableLine ||
            !tableLine.startsWith("|") ||
            !tableLine.endsWith("|")
          ) {
            break;
          }

          const row = parseTableRow(tableLine);

          // Pad/truncate rows to the actual header column count.
          rows.push(
            Array.from(
              { length: header.length },
              (_, cellIndex) => row[cellIndex] ?? "",
            ),
          );

          index += 1;
        }

        elements.push(
          <div
            key={`table-${index}`}
            className="my-5 w-full overflow-x-auto rounded-xl border border-[#302920] bg-[#11100E]"
          >
            <table className="w-full min-w-[560px] border-collapse text-[10px]">
              <thead className="bg-[#1D1812]">
                <tr>
                  {header.map((cell, cellIndex) => (
                    <th
                      key={`th-${cellIndex}`}
                      className="border-b border-[#3A3026] px-3 py-3 text-left font-bold text-[#D6A94D]"
                    >
                      {formatInlineMarkdown(cell)}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr
                    key={`row-${rowIndex}`}
                    className="transition-colors hover:bg-[#171512]"
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`td-${rowIndex}-${cellIndex}`}
                        className="border-b border-[#25211C] px-3 py-3 align-top leading-5 text-[#B9B0A7]"
                      >
                        {formatInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );

        continue;
      }
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingClass =
        level === 1
          ? "mb-3 mt-1 text-base font-bold text-white"
          : level === 2
            ? "mb-3 mt-5 text-sm font-bold text-white"
            : "mb-2 mt-4 text-xs font-bold text-white";

      const HeadingTag =
        level === 1 ? "h1" : level === 2 ? "h2" : "h3";

      elements.push(
        <HeadingTag
          key={`heading-${index}`}
          className={headingClass}
        >
          {formatInlineMarkdown(headingMatch[2])}
        </HeadingTag>,
      );

      index += 1;
      continue;
    }

    const orderedMatch = line.match(/^\d+[.)]\s+(.*)$/);
    const unorderedMatch = line.match(/^[-*]\s+(.*)$/);

    if (orderedMatch || unorderedMatch) {
      const isOrdered = Boolean(orderedMatch);
      const items: string[] = [];

      while (index < lines.length) {
        const listLine = lines[index].trim();
        const match = isOrdered
          ? listLine.match(/^\d+[.)]\s+(.*)$/)
          : listLine.match(/^[-*]\s+(.*)$/);

        if (!match) {
          break;
        }

        items.push(match[1]);
        index += 1;
      }

      if (isOrdered) {
        elements.push(
          <ol
            key={`ol-${index}`}
            className="mb-4 ml-5 list-decimal space-y-1.5 text-[#CFC6BC]"
          >
            {items.map((item, itemIndex) => (
              <li
                key={`oli-${itemIndex}`}
                className="pl-1 leading-6"
              >
                {formatInlineMarkdown(item)}
              </li>
            ))}
          </ol>,
        );
      } else {
        elements.push(
          <ul
            key={`ul-${index}`}
            className="mb-4 ml-5 list-disc space-y-1.5 text-[#CFC6BC]"
          >
            {items.map((item, itemIndex) => (
              <li
                key={`uli-${itemIndex}`}
                className="pl-1 leading-6"
              >
                {formatInlineMarkdown(item)}
              </li>
            ))}
          </ul>,
        );
      }

      continue;
    }

    /*
     * Consecutive normal lines are grouped into one paragraph.
     * This keeps the response compact and prevents every line from
     * looking like a separate block.
     */
    const paragraphLines: string[] = [line];
    index += 1;

    while (index < lines.length) {
      const nextLine = lines[index].trim();

      if (
        !nextLine ||
        /^---+$/.test(nextLine) ||
        /^#{1,3}\s+/.test(nextLine) ||
        /^\d+[.)]\s+/.test(nextLine) ||
        /^[-*]\s+/.test(nextLine) ||
        (nextLine.startsWith("|") &&
          nextLine.endsWith("|") &&
          index + 1 < lines.length &&
          lines[index + 1].trim().startsWith("|") &&
          lines[index + 1].trim().endsWith("|") &&
          isTableSeparator(lines[index + 1].trim()))
      ) {
        break;
      }

      paragraphLines.push(nextLine);
      index += 1;
    }

    elements.push(
      <p
        key={`paragraph-${index}`}
        className="mb-3 leading-6 text-[#CFC6BC]"
      >
        {paragraphLines.map((paragraphLine, paragraphIndex) => (
          <span key={`line-${paragraphIndex}`}>
            {paragraphIndex > 0 && " "}
            {formatInlineMarkdown(paragraphLine)}
          </span>
        ))}
      </p>,
    );
  }

  return <div>{elements}</div>;
}

function AICopilot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState("");

  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [applicationError, setApplicationError] = useState("");

  const selectedApplicationData = useMemo(
    () =>
      applications.find(
        (application) =>
          application.application_number === selectedApplication,
      ),
    [applications, selectedApplication],
  );

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setIsLoadingApplications(true);
        setApplicationError("");

        const response = await fetch(
          `${API_BASE_URL}/api/loan-applications/`,
        );

        if (!response.ok) {
          throw new Error(
            `Unable to load applications (${response.status})`,
          );
        }

        const data = await response.json();

        const applicationList: Application[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.applications)
            ? data.applications
            : [];

        setApplications(applicationList);

        if (applicationList.length > 0) {
          setSelectedApplication(
            applicationList[0].application_number,
          );
        }
      } catch (error) {
        setApplicationError(
          error instanceof Error
            ? error.message
            : "Unable to load applications.",
        );
      } finally {
        setIsLoadingApplications(false);
      }
    };

    loadApplications();
  }, []);

  const sendMessage = async (question?: string) => {
    const text = (question ?? input).trim();

    if (!text || isThinking) {
      return;
    }

    if (!selectedApplication) {
      setApplicationError(
        "Select a loan application before asking Copilot.",
      );
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setShowSuggestions(false);
    setIsThinking(true);
    setApplicationError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/loan-applications/${encodeURIComponent(
          selectedApplication,
        )}/copilot?question=${encodeURIComponent(text)}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const data: CopilotResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Copilot request failed (${response.status}).`,
        );
      }

      const answer =
        data.answer ||
        "Copilot completed the request but did not return an answer.";

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: answer,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to connect to AI Copilot.";

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          `I couldn't complete the Copilot request.\n\n${errorMessage}`,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setInput("");
    setShowSuggestions(true);
    setApplicationError("");
  };

  const handleQuickAction = (question: string) => {
    setInput(question);
  };

  return (
    <div className="min-h-full space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C89B3C]">
            Intelligent Underwriting Assistant
          </p>

          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              AI Copilot
            </h1>

            <span className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              Online
            </span>
          </div>

          <p className="mt-2 max-w-2xl text-sm text-[#8F877D]">
            Investigate applications, explain underwriting decisions,
            analyze risk, review compliance and retrieve policy evidence.
          </p>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearConversation}
            className="self-start rounded-xl border border-[#302920] bg-[#12110F] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#8F877D] transition-all duration-200 hover:border-[#806331] hover:text-[#D6A94D] lg:self-auto"
          >
            New conversation
          </button>
        )}
      </div>

      {/* Application Context */}
      <section className="rounded-2xl border border-[#2B251F] bg-[#12110F] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#C89B3C]/25 bg-[#20180E] text-sm font-black text-[#D6A94D]">
              CU
            </div>

            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#756D65]">
                Application Context
              </p>

              <p className="mt-1 truncate text-sm font-bold text-white">
                {selectedApplicationData?.applicant_name ||
                  "Select an application"}
              </p>

              {selectedApplicationData && (
                <p className="mt-0.5 text-[10px] text-[#756D65]">
                  {selectedApplicationData.application_number}
                  {" · "}
                  {selectedApplicationData.loan_type || "Loan"}
                  {" · "}
                  {formatCurrency(
                    selectedApplicationData.loan_amount,
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex w-full items-center gap-3 lg:w-auto">

            <div className="relative w-full lg:min-w-[280px]">
              <select
                value={selectedApplication}
                onChange={(event) => {
                  setSelectedApplication(event.target.value);
                  setMessages([]);
                  setShowSuggestions(true);
                }}
                disabled={
                  isLoadingApplications ||
                  applications.length === 0
                }
                className="w-full appearance-none rounded-xl border border-[#3A3026] bg-[#171512] px-4 py-3 pr-10 text-xs font-semibold text-white outline-none transition-all duration-200 focus:border-[#806331] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoadingApplications ? (
                  <option value="">
                    Loading applications...
                  </option>
                ) : applications.length === 0 ? (
                  <option value="">
                    No applications available
                  </option>
                ) : (
                  applications.map((application) => (
                    <option
                      key={application.application_number}
                      value={application.application_number}
                    >
                      {application.application_number}
                      {" · "}
                      {application.applicant_name || "Applicant"}
                    </option>
                  ))
                )}
              </select>

              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#756D65]">
                ↓
              </span>
            </div>

          </div>
        </div>

        {applicationError && (
          <div className="mt-3 rounded-xl border border-red-400/15 bg-red-400/5 px-3 py-2 text-[10px] leading-5 text-red-300">
            {applicationError}
          </div>
        )}
      </section>

      {/* Main AI Workspace */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">

        {/* Chat Workspace */}
        <div className="flex min-h-[650px] flex-col overflow-hidden rounded-3xl border border-[#2B251F] bg-[#0F0E0C] shadow-[0_20px_80px_rgba(0,0,0,0.28)]">

          {/* AI Workspace Header */}
          <div className="flex items-center justify-between border-b border-[#25211C] px-5 py-4 sm:px-6">

            <div className="flex items-center gap-3">

              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#C89B3C]/30 bg-gradient-to-br from-[#2B2113] to-[#17120D]">
                <span className="text-xs font-black tracking-tight text-[#E1B65B]">
                  CU
                </span>

                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0F0E0C] bg-emerald-400" />
              </div>

              <div>
                <p className="text-sm font-bold text-white">
                  Credit Underwriter AI
                </p>

                <p className="mt-0.5 text-[10px] text-[#756D65]">
                  RAG-grounded underwriting intelligence
                </p>
              </div>

            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <span className="rounded-lg border border-[#28221C] bg-[#151310] px-2.5 py-1.5 text-[9px] font-semibold text-[#756D65]">
                RAG
              </span>

              <span className="rounded-lg border border-emerald-400/10 bg-emerald-400/5 px-2.5 py-1.5 text-[9px] font-semibold text-emerald-400">
                Live
              </span>
            </div>

          </div>

          {/* Conversation Area */}
          <div className="flex-1 overflow-y-auto">

            {messages.length === 0 ? (

              <div className="flex min-h-[500px] flex-col items-center justify-center px-5 py-12 text-center sm:px-10">

                <div className="relative mb-7">

                  <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-[#C89B3C]/30 bg-gradient-to-br from-[#2B2113] via-[#1B150E] to-[#11100E] shadow-[0_0_60px_rgba(200,155,60,0.08)]">
                    <span className="text-2xl font-black tracking-tight text-[#D6A94D]">
                      AI
                    </span>
                  </div>

                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#0F0E0C] bg-emerald-400 text-[8px] font-black text-[#07110B]">
                    ✓
                  </span>

                </div>

                <h2 className="text-2xl font-extrabold tracking-tight text-white">
                  How can I help?
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-[#756D65]">
                  Ask about the selected application and I’ll explain
                  the underwriting signals using application context,
                  agent results and retrieved policy evidence.
                </p>

                {/* Search / Ask Prompt */}
                <div className="mt-8 w-full max-w-2xl">

                  <div className="rounded-2xl border border-[#3A3026] bg-[#151310] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition-all duration-200 focus-within:border-[#806331] focus-within:shadow-[0_0_35px_rgba(200,155,60,0.07)]">

                    <div className="flex items-end gap-2">

                      <textarea
                        value={input}
                        onChange={(event) =>
                          setInput(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" &&
                            !event.shiftKey
                          ) {
                            event.preventDefault();
                            void sendMessage();
                          }
                        }}
                        rows={2}
                        placeholder={
                          selectedApplication
                            ? `Ask about ${selectedApplication}...`
                            : "Select an application first..."
                        }
                        disabled={!selectedApplication}
                        className="min-h-[54px] flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-[#57514B] disabled:cursor-not-allowed"
                      />

                      <button
                        type="button"
                        onClick={() => void sendMessage()}
                        disabled={
                          !input.trim() ||
                          isThinking ||
                          !selectedApplication
                        }
                        className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D6A94D] text-[#17120D] transition-all duration-200 hover:bg-[#E5BB69] disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="Send message"
                      >
                        ↑
                      </button>

                    </div>

                    <div className="flex items-center justify-between border-t border-[#27221D] px-3 pt-2">
                      <span className="text-[9px] text-[#5E5852]">
                        Enter to send · Shift + Enter for new line
                      </span>

                      <span className="hidden text-[9px] text-[#5E5852] sm:block">
                        Groq · RAG · Underwriting Context
                      </span>
                    </div>

                  </div>

                </div>

                {/* Suggested Questions */}
                {showSuggestions && (
                  <div className="mt-7 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">

                    {suggestedQuestions.map((question) => (
                      <button
                        key={question}
                        type="button"
                        onClick={() => void sendMessage(question)}
                        disabled={!selectedApplication || isThinking}
                        className="group rounded-xl border border-[#29231E] bg-[#13120F] px-4 py-3 text-left transition-all duration-200 hover:border-[#806331] hover:bg-[#19150F] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <div className="flex items-center justify-between gap-3">

                          <span className="text-[10px] font-medium leading-5 text-[#A69B90] group-hover:text-[#D6A94D]">
                            {question}
                          </span>

                          <span className="text-[#514B45] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#D6A94D]">
                            →
                          </span>

                        </div>
                      </button>
                    ))}

                  </div>
                )}

              </div>

            ) : (

              <div className="mx-auto w-full max-w-4xl space-y-7 px-5 py-7 sm:px-8">

                {messages.map((message) => (

                  <div
                    key={message.id}
                    className={
                      message.role === "user"
                        ? "flex justify-end"
                        : "flex items-start gap-3"
                    }
                  >

                    {message.role === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#C89B3C]/25 bg-[#20180E] text-[9px] font-black text-[#D6A94D]">
                        AI
                      </div>
                    )}

                    <div
                      className={
                        message.role === "user"
                          ? "max-w-[82%] rounded-2xl rounded-tr-md border border-[#5A4524] bg-[#211810] px-4 py-3"
                          : "max-w-[90%] rounded-2xl rounded-tl-md border border-[#29241F] bg-[#171512] px-5 py-4"
                      }
                    >

                      {message.role === "user" ? (
                        <p className="whitespace-pre-wrap text-xs leading-6 text-[#E1B65B]">
                          {message.content}
                        </p>
                      ) : (
                        <div className="text-xs leading-6 text-[#CFC6BC]">
                          <MarkdownContent content={message.content} />
                        </div>
                      )}

                    </div>

                  </div>

                ))}

                {isThinking && (
                  <div className="flex items-start gap-3">

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#C89B3C]/25 bg-[#20180E] text-[9px] font-black text-[#D6A94D]">
                      AI
                    </div>

                    <div className="rounded-2xl rounded-tl-md border border-[#29241F] bg-[#171512] px-5 py-4">

                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#D6A94D]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#D6A94D] [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#D6A94D] [animation-delay:300ms]" />
                      </div>

                      <p className="mt-2 text-[9px] text-[#756D65]">
                        Analyzing application and retrieving evidence...
                      </p>

                    </div>

                  </div>
                )}

              </div>
            )}

          </div>

          {/* Bottom Composer */}
          {messages.length > 0 && (
            <div className="border-t border-[#25211C] bg-[#0F0E0C] p-4 sm:p-5">

              <div className="mx-auto max-w-4xl">

                <div className="rounded-2xl border border-[#3A3026] bg-[#151310] p-2 transition-all duration-200 focus-within:border-[#806331]">

                  <div className="flex items-end gap-2">

                    <textarea
                      value={input}
                      onChange={(event) =>
                        setInput(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          !event.shiftKey
                        ) {
                          event.preventDefault();
                          void sendMessage();
                        }
                      }}
                      rows={1}
                      placeholder="Ask Credit Underwriter AI..."
                      disabled={!selectedApplication}
                      className="max-h-32 min-h-[42px] flex-1 resize-none bg-transparent px-3 py-2 text-xs leading-5 text-white outline-none placeholder:text-[#57514B] disabled:cursor-not-allowed"
                    />

                    <button
                      type="button"
                      onClick={() => void sendMessage()}
                      disabled={
                        !input.trim() ||
                        isThinking ||
                        !selectedApplication
                      }
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D6A94D] text-[#17120D] transition-all duration-200 hover:bg-[#E5BB69] disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Send message"
                    >
                      ↑
                    </button>

                  </div>

                </div>

              </div>

            </div>
          )}

        </div>

        {/* Intelligence Sidebar */}
        <aside className="space-y-4">

          {/* AI Status */}
          <div className="rounded-2xl border border-[#2B251F] bg-[#12110F] p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#C89B3C]">
                  AI Intelligence
                </p>

                <h2 className="mt-2 text-sm font-bold text-white">
                  Copilot Workspace
                </h2>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/5 text-xs text-emerald-400">
                ✦
              </div>

            </div>

            <div className="mt-5 rounded-xl border border-[#29231E] bg-[#171512] p-3">

              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />

                <span className="text-[10px] font-semibold text-emerald-400">
                  API Connected
                </span>
              </div>

              <p className="mt-2 text-[10px] leading-5 text-[#756D65]">
                Copilot uses application context, underwriting
                results and policy evidence through RAG.
              </p>

            </div>

          </div>

          {/* Selected Application */}
          <div className="rounded-2xl border border-[#2B251F] bg-[#12110F] p-5">

            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#C89B3C]">
              Active Context
            </p>

            <h2 className="mt-2 text-sm font-bold text-white">
              {selectedApplication || "No application"}
            </h2>

            {selectedApplicationData && (
              <div className="mt-4 space-y-2">

                <div className="flex items-center justify-between rounded-lg border border-[#28221C] bg-[#171512] px-3 py-2">
                  <span className="text-[9px] text-[#756D65]">
                    Applicant
                  </span>

                  <span className="max-w-[140px] truncate text-[9px] font-semibold text-[#CFC6BC]">
                    {selectedApplicationData.applicant_name ||
                      "Unknown"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-[#28221C] bg-[#171512] px-3 py-2">
                  <span className="text-[9px] text-[#756D65]">
                    Loan
                  </span>

                  <span className="text-[9px] font-semibold text-[#CFC6BC]">
                    {selectedApplicationData.loan_type || "N/A"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-[#28221C] bg-[#171512] px-3 py-2">
                  <span className="text-[9px] text-[#756D65]">
                    Amount
                  </span>

                  <span className="text-[9px] font-semibold text-[#D6A94D]">
                    {formatCurrency(
                      selectedApplicationData.loan_amount,
                    )}
                  </span>
                </div>

              </div>
            )}

          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-[#2B251F] bg-[#12110F] p-5">

            <div>
              <h2 className="text-sm font-bold text-white">
                Quick Actions
              </h2>

              <p className="mt-1 text-[10px] text-[#756D65]">
                Start an underwriting investigation
              </p>
            </div>

            <div className="mt-5 space-y-2">

              {quickActions.map((action) => (

                <button
                  key={action.title}
                  type="button"
                  onClick={() =>
                    handleQuickAction(action.question)
                  }
                  disabled={!selectedApplication || isThinking}
                  className="group w-full rounded-xl border border-[#29231E] bg-[#171512] p-3 text-left transition-all duration-200 hover:border-[#806331] hover:bg-[#1A1713] disabled:cursor-not-allowed disabled:opacity-40"
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#49371F] bg-[#20180E] text-xs text-[#D6A94D]">
                      {action.icon}
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="text-[10px] font-bold text-[#CFC6BC] group-hover:text-white">
                        {action.title}
                      </p>

                      <p className="mt-1 text-[9px] leading-4 text-[#625B54]">
                        {action.description}
                      </p>

                    </div>

                    <span className="text-[#4F4943] group-hover:text-[#D6A94D]">
                      →
                    </span>

                  </div>

                </button>

              ))}

            </div>

          </div>

          {/* Suggested Questions */}
          <div className="rounded-2xl border border-[#2B251F] bg-[#12110F] p-5">

            <h2 className="text-sm font-bold text-white">
              Suggested Questions
            </h2>

            <p className="mt-1 text-[10px] text-[#756D65]">
              Common underwriting investigations
            </p>

            <div className="mt-4 space-y-2">

              {suggestedQuestions.map((question) => (

                <button
                  key={question}
                  type="button"
                  onClick={() => void sendMessage(question)}
                  disabled={!selectedApplication || isThinking}
                  className="group flex w-full items-center justify-between gap-3 rounded-xl border border-[#29231E] bg-[#171512] px-3 py-3 text-left transition-all duration-200 hover:border-[#806331] hover:bg-[#1A1713] disabled:cursor-not-allowed disabled:opacity-40"
                >

                  <span className="text-[10px] leading-4 text-[#8F877D] group-hover:text-[#D6A94D]">
                    {question}
                  </span>

                  <span className="shrink-0 text-[#4F4943] group-hover:text-[#D6A94D]">
                    →
                  </span>

                </button>

              ))}

            </div>

          </div>

        </aside>

      </section>

    </div>
  );
}

export default AICopilot;