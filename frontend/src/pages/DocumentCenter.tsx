import { useEffect, useRef, useState } from "react";

type LoanApplication = {
  id: number;
  application_number: string;
  applicant_name: string;
};

type DocumentRecord = {
  id: number;
  loan_application_id: number;
  application_number: string;
  applicant_name: string;
  document_type: string;
  original_filename: string;
  upload_status: string;
  ocr_status: string;
  verification_status: string;
  created_at: string | null;
};

const API_BASE = "http://127.0.0.1:8000";

function DocumentCenter() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [applications, setApplications] = useState<LoanApplication[]>([]);

  const [selectedApplication, setSelectedApplication] = useState("");
  const [documentType, setDocumentType] = useState("Other");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processingOCR, setProcessingOCR] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info"
  >("info");

  const loadData = async () => {
    try {
      setLoading(true);

      const [documentsResponse, applicationsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/loan-applications/documents`),
        fetch(`${API_BASE}/api/loan-applications/`),
      ]);

      if (!documentsResponse.ok) {
        throw new Error("Failed to fetch documents");
      }

      if (!applicationsResponse.ok) {
        throw new Error("Failed to fetch applications");
      }

      const documentsData: DocumentRecord[] =
        await documentsResponse.json();

      const applicationsData: LoanApplication[] =
        await applicationsResponse.json();

      setDocuments(documentsData);
      setApplications(applicationsData);

      if (
        !selectedApplication &&
        applicationsData.length > 0
      ) {
        setSelectedApplication(
          applicationsData[0].application_number
        );
      }
    } catch (error) {
      console.error(
        "Document Center fetch error:",
        error
      );

      setMessageType("error");
      setMessage(
        "Unable to load live document data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalDocuments = documents.length;

  const verifiedDocuments = documents.filter(
    (document) =>
      document.verification_status?.toLowerCase() ===
      "verified"
  ).length;

  const pendingDocuments = documents.filter(
    (document) =>
      ["pending", "review", "warning"].includes(
        document.verification_status?.toLowerCase()
      )
  ).length;

  const flaggedDocuments = documents.filter(
    (document) =>
      ["flagged", "failed", "rejected"].includes(
        document.verification_status?.toLowerCase()
      )
  ).length;

  const selectedApplicationData =
    applications.find(
      (application) =>
        application.application_number ===
        selectedApplication
    );

  const selectedApplicationDocuments =
    documents.filter(
      (document) =>
        document.application_number ===
        selectedApplication
    );

  const openFilePicker = () => {
    if (!selectedApplication) {
      setMessageType("error");
      setMessage(
        "Select a loan application before uploading."
      );
      return;
    }

    fileInputRef.current?.click();
  };

  const processOCR = async (
    applicationNumber: string,
    documentId: number
  ) => {
    try {
      setProcessingOCR(documentId);

      const response = await fetch(
        `${API_BASE}/api/loan-applications/${encodeURIComponent(
          applicationNumber
        )}/documents/${documentId}/ocr`,
        {
          method: "POST",
        }
      );

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          body?.detail ||
            "OCR processing failed."
        );
      }

      if (body?.ocr_status === "Completed") {
        setMessageType("success");
        setMessage(
          `OCR completed for ${body.original_filename}.`
        );
      } else {
        setMessageType("error");
        setMessage(
          body?.reasons?.[0] ||
            `OCR processing failed for ${body.original_filename}.`
        );
      }

      await loadData();

      return body;
    } catch (error) {
      console.error(
        "Document OCR error:",
        error
      );

      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "OCR processing failed."
      );

      return null;
    } finally {
      setProcessingOCR(null);
    }
  };

  const uploadDocuments = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(
      event.target.files ?? []
    );

    if (
      !files.length ||
      !selectedApplication
    ) {
      return;
    }

    try {
      setUploading(true);
      setMessageType("info");
      setMessage("");

      for (const file of files) {
        const extension =
          file.name
            .split(".")
            .pop()
            ?.toLowerCase();

        if (extension !== "pdf") {
          throw new Error(
            `${file.name}: only PDF files are allowed.`
          );
        }

        const formData = new FormData();

        formData.append(
          "file",
          file
        );

        const uploadResponse =
          await fetch(
            `${API_BASE}/api/loan-applications/${encodeURIComponent(
              selectedApplication
            )}/documents?document_type=${encodeURIComponent(
              documentType
            )}`,
            {
              method: "POST",
              body: formData,
            }
          );

        const uploadBody =
          await uploadResponse
            .json()
            .catch(() => null);

        if (!uploadResponse.ok) {
          throw new Error(
            uploadBody?.detail ||
              `Upload failed for ${file.name}`
          );
        }

        const documentId =
          uploadBody?.id;

        if (!documentId) {
          throw new Error(
            `Upload succeeded but document ID was not returned for ${file.name}.`
          );
        }

        setMessageType("info");
        setMessage(
          `${file.name} uploaded. Running OCR...`
        );

        await loadData();

        await processOCR(
          selectedApplication,
          Number(documentId)
        );
      }

      setMessageType("success");
      setMessage(
        `${files.length} document${
          files.length > 1 ? "s" : ""
        } uploaded and OCR processing completed.`
      );

      await loadData();
    } catch (error) {
      console.error(
        "Document upload error:",
        error
      );

      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Document upload failed."
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const verifyApplicationDocuments = async () => {
    if (!selectedApplication) {
      setMessageType("error");
      setMessage(
        "Select a loan application first."
      );
      return;
    }

    if (
      selectedApplicationDocuments.length === 0
    ) {
      setMessageType("error");
      setMessage(
        "No documents are available for this application."
      );
      return;
    }

    try {
      setVerifying(true);
      setMessageType("info");
      setMessage(
        "Running document verification..."
      );

      const response = await fetch(
        `${API_BASE}/api/loan-applications/${encodeURIComponent(
          selectedApplication
        )}/documents/verify`,
        {
          method: "POST",
        }
      );

      const body =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          body?.detail ||
            "Document verification failed."
        );
      }

      const verificationStatus =
        body?.verification_status ||
        "Pending";

      if (
        verificationStatus.toLowerCase() ===
        "verified"
      ) {
        setMessageType("success");
        setMessage(
          "All application documents passed verification."
        );
      } else {
        setMessageType("info");
        setMessage(
          body?.reasons?.join(" ") ||
            `Document verification completed with status: ${verificationStatus}.`
        );
      }

      await loadData();
    } catch (error) {
      console.error(
        "Document verification error:",
        error
      );

      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Document verification failed."
      );
    } finally {
      setVerifying(false);
    }
  };

  const formatDate = (
    value: string | null
  ) => {
    if (!value) {
      return "N/A";
    }

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "N/A";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const verificationClass = (
    status: string
  ) => {
    const value =
      status?.toLowerCase();

    if (value === "verified") {
      return "border-emerald-900/60 bg-emerald-950/30 text-emerald-400";
    }

    if (
      [
        "flagged",
        "failed",
        "rejected",
      ].includes(value)
    ) {
      return "border-red-900/60 bg-red-950/30 text-red-400";
    }

    return "border-amber-900/60 bg-amber-950/30 text-amber-400";
  };

  const statusClass = (
    status: string
  ) => {
    const value =
      status?.toLowerCase();

    if (
      [
        "processed",
        "uploaded",
        "completed",
      ].includes(value)
    ) {
      return "text-emerald-400";
    }

    if (
      [
        "failed",
        "rejected",
        "flagged",
      ].includes(value)
    ) {
      return "text-red-400";
    }

    return "text-amber-400";
  };

  const messageClass =
    messageType === "error"
      ? "border-red-900/60 bg-red-950/20 text-red-400"
      : messageType === "success"
        ? "border-emerald-900/60 bg-emerald-950/20 text-emerald-400"
        : "border-[#806331] bg-[#241B11] text-[#D6A94D]";

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C89B3C]">
          Document Intelligence
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
          Document Center
        </h1>

        <p className="mt-2 text-sm text-[#8F877D]">
          Upload, review and verify documents throughout the underwriting workflow.
        </p>
      </div>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "Total Documents",
            totalDocuments,
            "text-white",
          ],
          [
            "Verified",
            verifiedDocuments,
            "text-emerald-400",
          ],
          [
            "Pending Review",
            pendingDocuments,
            "text-amber-400",
          ],
          [
            "Flagged",
            flaggedDocuments,
            "text-red-400",
          ],
        ].map(
          ([
            label,
            value,
            valueClass,
          ]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-[#C89B3C]/70 bg-[#12110F] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#D6A94D] hover:shadow-[0_14px_35px_rgba(200,155,60,0.08)]"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8C8278]">
                {label}
              </p>

              <p
                className={`mt-3 text-3xl font-extrabold ${valueClass}`}
              >
                {loading
                  ? "..."
                  : value}
              </p>
            </div>
          )
        )}
      </section>

      {/* Upload Area */}
      <section className="rounded-2xl border border-[#C89B3C]/70 bg-[#12110F] p-5 transition-all duration-300 hover:border-[#D6A94D]">
        <div className="rounded-2xl border border-dashed border-[#806331] bg-[#171512] px-6 py-8 text-center transition-all duration-300 hover:border-[#C89B3C] hover:bg-[#1A1713]">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D6A94D]/30 bg-[#241B11] text-[#D6A94D]">
            <span className="text-xl font-bold">
              +
            </span>
          </div>

          <h2 className="mt-4 text-sm font-bold text-white">
            Upload Underwriting Documents
          </h2>

          <p className="mx-auto mt-2 max-w-md text-[11px] leading-5 text-[#756D65]">
            Upload PDF documents for the selected loan application. Files are processed through the existing underwriting OCR pipeline.
          </p>

          <div className="mx-auto mt-5 flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">

            {/* Application */}
            <select
              value={selectedApplication}
              onChange={(event) =>
                setSelectedApplication(
                  event.target.value
                )
              }
              disabled={
                uploading ||
                verifying ||
                applications.length === 0
              }
              className="rounded-xl border border-[#806331] bg-[#241B11] px-4 py-2.5 text-xs font-semibold text-[#D6A94D] outline-none transition focus:border-[#D6A94D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option
                value=""
                className="bg-[#12110F]"
              >
                Select application
              </option>

              {applications.map(
                (application) => (
                  <option
                    key={application.id}
                    value={
                      application.application_number
                    }
                    className="bg-[#12110F]"
                  >
                    {
                      application.application_number
                    }{" "}
                    ·{" "}
                    {
                      application.applicant_name
                    }
                  </option>
                )
              )}
            </select>

            {/* Document Type */}
            <select
              value={documentType}
              onChange={(event) =>
                setDocumentType(
                  event.target.value
                )
              }
              disabled={
                uploading ||
                verifying
              }
              className="rounded-xl border border-[#806331] bg-[#241B11] px-4 py-2.5 text-xs font-semibold text-[#D6A94D] outline-none transition focus:border-[#D6A94D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option
                value="PAN"
                className="bg-[#12110F]"
              >
                PAN
              </option>

              <option
                value="Aadhaar"
                className="bg-[#12110F]"
              >
                Aadhaar
              </option>

              <option
                value="Salary Slip"
                className="bg-[#12110F]"
              >
                Salary Slip
              </option>

              <option
                value="Bank Statement"
                className="bg-[#12110F]"
              >
                Bank Statement
              </option>

              <option
                value="GST"
                className="bg-[#12110F]"
              >
                GST
              </option>

              <option
                value="Other"
                className="bg-[#12110F]"
              >
                Other
              </option>
            </select>

            {/* Upload */}
            <button
              type="button"
              onClick={openFilePicker}
              disabled={
                uploading ||
                verifying ||
                !selectedApplication
              }
              className="rounded-xl border border-[#806331] bg-[#241B11] px-5 py-2.5 text-xs font-bold text-[#D6A94D] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D6A94D] hover:bg-[#2B2013] hover:shadow-[0_0_24px_rgba(214,169,77,0.14)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading
                ? "Uploading & Processing..."
                : "Select Documents"}
            </button>

            {/* Verify */}
            <button
              type="button"
              onClick={
                verifyApplicationDocuments
              }
              disabled={
                uploading ||
                verifying ||
                !selectedApplication ||
                selectedApplicationDocuments.length === 0
              }
              className="rounded-xl border border-[#C89B3C]/70 bg-[#18120E] px-5 py-2.5 text-xs font-bold text-[#C89B3C] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D6A94D] hover:bg-[#241B11] hover:shadow-[0_0_24px_rgba(214,169,77,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifying
                ? "Verifying..."
                : "Verify Documents"}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={
              uploadDocuments
            }
          />

          {/* Selected application context */}
          {selectedApplicationData && (
            <div className="mx-auto mt-4 max-w-3xl rounded-xl border border-[#2A241E] bg-[#12110F] px-4 py-3 text-left">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#756D65]">
                    Selected Application
                  </p>

                  <p className="mt-1 text-xs font-bold text-white">
                    {
                      selectedApplicationData.application_number
                    }
                  </p>
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#756D65]">
                    Applicant
                  </p>

                  <p className="mt-1 text-xs font-semibold text-[#CFC6BC]">
                    {
                      selectedApplicationData.applicant_name
                    }
                  </p>
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#756D65]">
                    Documents
                  </p>

                  <p className="mt-1 text-xs font-bold text-[#D6A94D]">
                    {
                      selectedApplicationDocuments.length
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div
              className={`mx-auto mt-4 max-w-3xl rounded-xl border px-4 py-3 text-left text-[11px] font-semibold ${messageClass}`}
            >
              {message}
            </div>
          )}
        </div>
      </section>

      {/* Recent Documents */}
      <section className="overflow-hidden rounded-2xl border border-[#C89B3C]/70 bg-[#12110F]">

        <div className="flex flex-col gap-3 border-b border-[#C89B3C]/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-sm font-bold text-white">
              Recent Documents
            </h2>

            <p className="mt-1 text-[11px] text-[#756D65]">
              Latest documents stored in the underwriting database
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="self-start rounded-lg border border-[#806331] bg-[#18120E] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#C89B3C] transition hover:border-[#D6A94D] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Loading..."
              : "Refresh Data"}
          </button>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[940px]">

            <thead>
              <tr className="border-b border-[#2A241E] text-left text-[9px] uppercase tracking-[0.12em] text-[#756D65]">

                <th className="px-5 py-4 font-semibold">
                  Document
                </th>

                <th className="px-4 py-4 font-semibold">
                  Applicant
                </th>

                <th className="px-4 py-4 font-semibold">
                  Type
                </th>

                <th className="px-4 py-4 font-semibold">
                  Verification
                </th>

                <th className="px-4 py-4 font-semibold">
                  Upload / OCR
                </th>

                <th className="px-4 py-4 font-semibold">
                  Created
                </th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-xs text-[#756D65]"
                  >
                    Loading live documents...
                  </td>
                </tr>
              ) : (
                documents.map(
                  (document) => (
                    <tr
                      key={document.id}
                      className="border-b border-[#211E1A] transition-colors duration-200 hover:bg-[#1A1511]"
                    >

                      <td className="px-5 py-4">
                        <p className="max-w-[260px] truncate text-xs font-bold text-white">
                          {
                            document.original_filename
                          }
                        </p>

                        <p className="mt-1 text-[9px] text-[#756D65]">
                          ID #{document.id}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-xs font-semibold text-[#CFC6BC]">
                          {
                            document.applicant_name
                          }
                        </p>

                        <p className="mt-1 text-[9px] text-[#756D65]">
                          {
                            document.application_number
                          }
                        </p>
                      </td>

                      <td className="px-4 py-4 text-xs text-[#CFC6BC]">
                        {
                          document.document_type
                        }
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[9px] font-bold ${verificationClass(
                            document.verification_status
                          )}`}
                        >
                          {
                            document.verification_status ||
                            "Pending"
                          }
                        </span>
                      </td>

                      <td className="px-4 py-4">

                        <p
                          className={`text-xs font-semibold ${statusClass(
                            document.upload_status
                          )}`}
                        >
                          {
                            document.upload_status
                          }
                        </p>

                        <p className="mt-1 text-[9px] text-[#756D65]">
                          OCR:{" "}
                          {
                            document.ocr_status
                          }
                        </p>

                        {processingOCR ===
                          document.id && (
                          <p className="mt-1 text-[9px] font-semibold text-[#D6A94D]">
                            Processing OCR...
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4 text-xs text-[#B9B0A7]">
                        {formatDate(
                          document.created_at
                        )}
                      </td>

                    </tr>
                  )
                )
              )}

              {!loading &&
                documents.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center"
                    >
                      <p className="text-xs font-semibold text-[#CFC6BC]">
                        No documents found
                      </p>

                      <p className="mt-1 text-[10px] text-[#756D65]">
                        Uploaded underwriting documents will appear here.
                      </p>
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

export default DocumentCenter;