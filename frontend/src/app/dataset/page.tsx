"use client";
import React, { useState, useEffect } from "react";
import { UploadCloud, Database, Search, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { Alert, LinearProgress } from "@mui/material";
import { Button, Card, Badge } from "@/components/ui/primitives";

interface DatasetRow {
  id: number;
  question: string;
  model_answer: string;
  student_answer: string;
  teacher_marks: number;
  total_marks: number;
  split?: string;
}

export default function DatasetExplorerPage() {
  const [records, setRecords] = useState<DatasetRow[]>([]);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/dataset?limit=100");
      const data = await res.json();
      setRecords(data.records || data || []);
    } catch {
      // Fallback empty
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    setUploadSummary(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUploadSummary(data);
      fetchRecords();
    } catch (err: any) {
      setError(err.message || "Error uploading file.");
    } finally {
      setUploading(false);
    }
  };

  const filtered = records.filter(
    (r) =>
      r.question?.toLowerCase().includes(search.toLowerCase()) ||
      r.student_answer?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
          <Database className="h-7 w-7 text-emerald-500" /> ASAG Dataset Explorer
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload CSV/Excel grading datasets (automatically splits first 4,000 train / remaining test) and inspect records.
        </p>
      </div>

      {/* Interactive Drag-and-Drop Zone */}
      <Card
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
        }}
        className={`p-8 border-2 border-dashed text-center transition-all ${
          dragActive
            ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
            : "border-slate-300 dark:border-slate-700"
        }`}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 mb-3">
          <UploadCloud className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold">Drag & Drop your ASAG Dataset (.csv or .xlsx)</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          Required columns: <code>question</code>, <code>model_answer</code>, <code>student_answer</code>,{" "}
          <code>teacher_marks</code>, <code>total_marks</code>
        </p>

        <label className="inline-block cursor-pointer">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
          <span className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md">
            <FileSpreadsheet className="h-4 w-4" /> Browse & Upload Dataset
          </span>
        </label>

        {uploading && <LinearProgress className="mt-5 rounded-full" />}
      </Card>

      {error && <Alert severity="error">{error}</Alert>}

      {uploadSummary && (
        <Alert severity="success" icon={<CheckCircle2 className="h-5 w-5" />}>
          <strong>Dataset Validated & Indexed!</strong> Processed{" "}
          <strong>{uploadSummary.records_processed ?? uploadSummary.total_records}</strong> records.
          {uploadSummary.benchmark && (
            <>
              {" "}
              | Test Split MAE: <strong>{uploadSummary.benchmark.mae}</strong> | Accuracy:{" "}
              <strong>{uploadSummary.benchmark.accuracy}%</strong>
            </>
          )}
        </Alert>
      )}

      {/* Searchable Table */}
      <Card className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">Indexed Records</h2>
            <Badge variant="indigo">{filtered.length} shown</Badge>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter questions or student answers..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/80 dark:bg-slate-950/90 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Question</th>
                <th className="px-5 py-3.5">Student Answer</th>
                <th className="px-5 py-3.5">Teacher Score</th>
                <th className="px-5 py-3.5">Split</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                    No dataset records found. Upload a CSV/Excel dataset above to populate.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">#{row.id}</td>
                    <td className="px-5 py-4 font-medium max-w-xs truncate">{row.question}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 max-w-md truncate">
                      {row.student_answer}
                    </td>
                    <td className="px-5 py-4 font-bold text-indigo-500">
                      {row.teacher_marks} / {row.total_marks}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={row.split === "test" ? "warning" : "success"}>
                        {row.split || "train"}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
