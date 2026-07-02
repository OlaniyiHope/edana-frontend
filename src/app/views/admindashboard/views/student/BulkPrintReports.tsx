import { useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import useFetch from "@/hooks/useFetch";
import { SessionContext } from "@/contexts/SessionContext";
import { resolveClassName } from "@/lib/class-utils";

const TERM_MAP: Record<string, { label: string; route: (id: string) => string }> = {
  "first-term": { label: "First Term Report Card", route: (id) => `/dashboard/first_term_report_card/${id}` },
  "second-term": { label: "Second Term Report Card", route: (id) => `/dashboard/term_report_card/${id}` },
  "third-term": { label: "Third Term Report Card", route: (id) => `/dashboard/third_term_report_card/${id}` },
  cumulative: { label: "Cumulative Result", route: (id) => `/dashboard/cumulative/${id}` },
};

const BulkPrintReports = () => {
  const { classId, term } = useParams<{ classId: string; term: string }>();
  const navigate = useNavigate();
  const { currentSession } = useContext(SessionContext);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  const resolvedClassName = resolveClassName(classId);
  const termConfig = TERM_MAP[term || ""] ?? TERM_MAP["first-term"];

  const { data, loading } = useFetch(
    currentSession && resolvedClassName
      ? `/students/${currentSession._id}/${encodeURIComponent(resolvedClassName)}`
      : null
  );
  const allStudents: any[] = Array.isArray(data) ? data : [];

  const handleBulkPrint = () => {
    const iframes = iframeContainerRef.current?.querySelectorAll("iframe");
    if (!iframes || iframes.length === 0) return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      alert("Please allow popups for this site to enable bulk printing.");
      return;
    }

    let combinedBody = "";
    iframes.forEach((iframe, idx) => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          const bodyHtml = doc.body?.innerHTML || "";
          const styles = Array.from(doc.querySelectorAll("style, link[rel='stylesheet']"))
            .map((el) => el.outerHTML)
            .join("\n");

          if (idx === 0) {
            combinedBody += `<head>${styles}</head><body>`;
          }

          combinedBody += `
            <div style="page-break-after: always; page-break-inside: avoid;">
              ${bodyHtml}
            </div>
          `;
        }
      } catch {
        // Ignore unreadable iframe content and continue printing what we can access.
      }
    });
    combinedBody += "</body>";

    printWindow.document.write(`<!DOCTYPE html><html>${combinedBody}</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-sm text-slate-500">Loading students for {resolvedClassName || classId || "-"}...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 transition-colors hover:text-primary">
            <ArrowLeft size={18} /> Back
          </button>
          <div>
            <h2 className="text-2xl font-bold text-primary">Bulk Print - {termConfig.label}</h2>
            <p className="text-sm text-slate-500">
              Class: <span className="font-semibold">{resolvedClassName || "-"}</span>
              {" · "}
              <span className="font-semibold">{allStudents.length}</span> students
            </p>
          </div>
        </div>

        <Button onClick={handleBulkPrint} disabled={allStudents.length === 0} className="gap-2 bg-primary hover:bg-primary/90">
          <Printer size={16} />
          Print All {allStudents.length} Report Cards
        </Button>
      </div>

      {allStudents.length === 0 ? (
        <p className="py-20 text-center text-slate-400">No students found in this class.</p>
      ) : (
        <>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 print:hidden">
            Wait for all <strong>{allStudents.length}</strong> report cards to finish loading before clicking Print All.
          </div>

          <div className="grid grid-cols-2 gap-2 print:hidden md:grid-cols-3 lg:grid-cols-4">
            {allStudents.map((student, i) => (
              <div key={student._id} className="flex items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-xs">
                <span className="w-5 text-right text-slate-400">{i + 1}.</span>
                <span className="truncate font-medium text-slate-700">{student.studentName}</span>
              </div>
            ))}
          </div>

          <div ref={iframeContainerRef} className="hidden" aria-hidden="true">
            {allStudents.map((student) => (
              <iframe
                key={student._id}
                src={termConfig.route(student._id)}
                title={`Report - ${student.studentName}`}
                style={{ width: "210mm", height: "297mm", border: "none" }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BulkPrintReports;
