import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useFacilityStore } from "@/lib/store";
import { parseExcelFile, buildSampleWorkbook } from "@/lib/excel";
import { analyzeAll } from "@/lib/extraction";
import { SAMPLE_FACILITIES } from "@/lib/sampleData";
import { downloadBlob } from "@/lib/exportCsv";
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle2, Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Hospital Data — CareMap" },
      { name: "description", content: "Upload an Excel file of Indian hospital records to analyze for medical deserts and trust scores." },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  const setFacilities = useFacilityStore((s) => s.setFacilities);
  const resetToSample = useFacilityStore((s) => s.resetToSample);
  const source = useFacilityStore((s) => s.source);
  const fileName = useFacilityStore((s) => s.fileName);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);

  const onFile = (f: File | null) => {
    if (!f) return;
    if (!/\.(xlsx|xls)$/i.test(f.name)) {
      toast.error("Please upload an .xlsx or .xls file");
      return;
    }
    setFile(f);
  };

  const onProcess = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const buf = await file.arrayBuffer();
      const rows = parseExcelFile(buf);
      if (rows.length === 0) {
        toast.error("No rows found in the file");
        return;
      }
      const analyzed = analyzeAll(rows);
      setFacilities(analyzed, "uploaded", file.name);
      toast.success(`Analyzed ${analyzed.length} facilities`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to parse the Excel file");
    } finally {
      setProcessing(false);
    }
  };

  const downloadSample = () => {
    const buf = buildSampleWorkbook(SAMPLE_FACILITIES);
    downloadBlob(buf, "sample-hospitals.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload hospital dataset</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Drop an Excel file with the standard schema (facility_name, city, district, state, bed_count, icu_available, etc.).
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onFile(e.dataTransfer.files?.[0] ?? null);
        }}
        className={`relative rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border bg-card"
        }`}
      >
        <div className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--gradient-primary)" }}>
          <UploadCloud className="h-7 w-7 text-primary-foreground" />
        </div>
        <div className="mt-4 font-semibold">Drag &amp; drop your Excel file</div>
        <div className="text-xs text-muted-foreground mt-1">or click to browse · .xlsx / .xls up to ~10MB</div>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label="Upload Excel file"
        />
      </div>

      {file && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
          <FileSpreadsheet className="h-6 w-6 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{file.name}</div>
            <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
          </div>
          <button
            onClick={onProcess}
            disabled={processing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground disabled:opacity-50"
            style={{ background: "var(--gradient-primary)" }}
          >
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {processing ? "Processing…" : "Process data"}
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <button
          onClick={downloadSample}
          className="text-left p-5 rounded-2xl border border-border bg-card hover:bg-accent/50 transition-colors"
        >
          <Download className="h-5 w-5 text-primary" />
          <div className="mt-3 font-semibold">Download sample.xlsx</div>
          <div className="text-xs text-muted-foreground mt-1">10 sample Indian hospital records following the schema</div>
        </button>
        <button
          onClick={() => { resetToSample(); toast.success("Reset to sample dataset"); }}
          className="text-left p-5 rounded-2xl border border-border bg-card hover:bg-accent/50 transition-colors"
        >
          <RotateCcw className="h-5 w-5 text-primary" />
          <div className="mt-3 font-semibold">Reset to demo data</div>
          <div className="text-xs text-muted-foreground mt-1">
            Currently: {source === "uploaded" ? `Uploaded — ${fileName}` : "Sample dataset"}
          </div>
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold text-sm mb-2">Expected columns</h3>
        <div className="flex flex-wrap gap-1.5">
          {[
            "facility_name","city","district","state","bed_count","icu_available",
            "oxygen_available","ambulance_available","emergency_24x7",
            "specialist_available","unstructured_notes","latitude","longitude",
          ].map((c) => (
            <code key={c} className="text-[11px] px-2 py-1 rounded bg-muted text-muted-foreground">{c}</code>
          ))}
        </div>
        <Link to="/" className="mt-4 inline-block text-xs text-primary hover:underline">← Back to dashboard</Link>
      </div>
    </div>
  );
}
