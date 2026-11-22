"use client";
import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  Cpu,
  Columns2,
  Wand2,
} from "lucide-react";
import { CircularProgress, Slider, Alert, Snackbar } from "@mui/material";
import { Button, Card, Badge } from "@/components/ui/primitives";

interface EvalResult {
  model_used: string;
  predicted_marks: number;
  total_marks: number;
  similarity_score: number;
  feedback: string;
  matched_keywords?: string[];
  missing_keywords?: string[];
}

const SAMPLE_SCENARIOS = [
  {
    label: "Biology: Photosynthesis",
    question: "Explain the process of photosynthesis in green plants.",
    model_answer:
      "Photosynthesis is the process by which green plants use sunlight, chlorophyll, carbon dioxide, and water to synthesize glucose and release oxygen.",
    student_answer:
      "Green plants absorb sunlight using chlorophyll to convert water and carbon dioxide into glucose energy and oxygen.",
    total_marks: 5,
  },
  {
    label: "CS: Neural Networks",
    question: "How does backpropagation train an artificial neural network?",
    model_answer:
      "Backpropagation calculates the gradient of the loss function with respect to each weight using the chain rule and updates weights via gradient descent to minimize error.",
    student_answer:
      "It computes the error gradient backwards through layers and adjusts network weights using gradient descent.",
    total_marks: 10,
  },
  {
    label: "Partial Credit Case",
    question: "What causes seasons on Earth?",
    model_answer:
      "Seasons are caused by the 23.5-degree axial tilt of the Earth as it orbits around the Sun, changing the angle and duration of sunlight reaching each hemisphere.",
    student_answer:
      "Seasons happen because the Earth moves around the Sun during the year.",
    total_marks: 5,
  },
];

export default function EvaluateStudioPage() {
  const [question, setQuestion] = useState(SAMPLE_SCENARIOS[0].question);
  const [modelAnswer, setModelAnswer] = useState(SAMPLE_SCENARIOS[0].model_answer);
  const [studentAnswer, setStudentAnswer] = useState(SAMPLE_SCENARIOS[0].student_answer);
  const [totalMarks, setTotalMarks] = useState<number>(5);
  const [modelType, setModelType] = useState<"neural" | "rule_based" | "compare">("neural");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EvalResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadPreset = (idx: number) => {
    const s = SAMPLE_SCENARIOS[idx];
    setQuestion(s.question);
    setModelAnswer(s.model_answer);
    setStudentAnswer(s.student_answer);
    setTotalMarks(s.total_marks);
    setResults([]);
    setToast(`Loaded preset: ${s.label}`);
  };

  const wordCount = (txt: string) => txt.trim().split(/\s+/).filter(Boolean).length;

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelAnswer.trim() || !studentAnswer.trim()) {
      setError("Please provide both a Model Answer and a Student Answer.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const modelsToRun: ("neural" | "rule_based")[] =
        modelType === "compare" ? ["neural", "rule_based"] : [modelType];

      const responses = await Promise.all(
        modelsToRun.map(async (m) => {
          const res = await fetch("/api/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question,
              model_answer: modelAnswer,
              student_answer: studentAnswer,
              total_marks: totalMarks,
              model_type: m,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Evaluation failed");
          return data as EvalResult;
        })
      );

      setResults(responses);
    } catch (err: any) {
      setError(err.message || "Could not reach Flask backend.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return { text: "text-emerald-500", mui: "success" as const, badge: "success" as const, label: "Excellent Match" };
    if (pct >= 50) return { text: "text-amber-500", mui: "warning" as const, badge: "warning" as const, label: "Partial Credit" };
    return { text: "text-rose-500", mui: "error" as const, badge: "danger" as const, label: "Needs Improvement" };
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header + 1-Click Scenario Pills */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Sparkles className="h-7 w-7 text-indigo-500" /> Evaluation Studio
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Test single responses, compare NLP engines side by side, and inspect concept coverage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
            <Wand2 className="h-3.5 w-3.5 text-indigo-500" /> Quick Presets:
          </span>
          {SAMPLE_SCENARIOS.map((s, idx) => (
            <button
              key={s.label}
              type="button"
              onClick={() => loadPreset(idx)}
              className="rounded-full border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-300 transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Input Form */}
        <Card className="lg:col-span-7 p-6 sm:p-8">
          <form onSubmit={handleEvaluate} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Question Prompt
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter exam or assignment question..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Reference Model Answer
                </label>
                <span className="text-xs text-slate-400">{wordCount(modelAnswer)} words</span>
              </div>
              <textarea
                rows={3}
                value={modelAnswer}
                onChange={(e) => setModelAnswer(e.target.value)}
                placeholder="Enter ideal teacher answer key..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Student Submitted Response
                </label>
                <span className="text-xs text-slate-400">{wordCount(studentAnswer)} words</span>
              </div>
              <textarea
                rows={4}
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
                placeholder="Type or paste student answer to grade..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Marks Slider & Engine Selector */}
            <div className="grid gap-6 sm:grid-cols-2 pt-2">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase text-slate-500">Maximum Marks</span>
                  <span className="text-sm font-extrabold text-indigo-500">{totalMarks} pts</span>
                </div>
                <Slider
                  value={totalMarks}
                  min={1}
                  max={20}
                  step={1}
                  onChange={(_, v) => setTotalMarks(v as number)}
                  color="primary"
                />
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4">
                <span className="block text-xs font-bold uppercase text-slate-500 mb-2">
                  Grading Engine Mode
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "neural", label: "Semantic", icon: Cpu },
                    { id: "rule_based", label: "Rule-Based", icon: Layers },
                    { id: "compare", label: "Compare", icon: Columns2 },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setModelType(m.id as any)}
                        className={`flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1 text-xs font-semibold border transition-all ${
                          modelType === m.id
                            ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {error && <Alert severity="error">{error}</Alert>}

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1 py-3 text-base">
                {loading ? "Analyzing Response..." : "Grade Student Answer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setQuestion("");
                  setModelAnswer("");
                  setStudentAnswer("");
                  setResults([]);
                }}
              >
                <RotateCcw className="h-4 w-4" /> Clear
              </Button>
            </div>
          </form>
        </Card>

        {/* Right Live Results Panel */}
        <div className="lg:col-span-5 space-y-6">
          {results.length === 0 ? (
            <Card className="flex h-full min-h-[420px] flex-col items-center justify-center p-8 text-center border-dashed">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 mb-4">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold">Ready to Evaluate</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mt-2">
                Click <strong>Grade Student Answer</strong> to view the animated score breakdown, similarity
                index, and concept coverage chips.
              </p>
            </Card>
          ) : (
            results.map((r, i) => {
              const pct = Math.round((r.similarity_score || 0) * 100);
              const style = getScoreColor(pct);
              return (
                <Card key={i} className="p-6 space-y-6 border-indigo-500/30 shadow-lg">
                  <div className="flex items-center justify-between">
                    <Badge variant="indigo" className="uppercase">
                      {r.model_used === "neural" ? "Semantic AI Model" : "Rule-Based Keyword Engine"}
                    </Badge>
                    <Badge variant={style.badge}>{style.label}</Badge>
                  </div>

                  {/* Animated Circular Radial Gauge */}
                  <div className="flex items-center justify-around rounded-2xl bg-slate-50 dark:bg-slate-950/80 p-5 border border-slate-200/70 dark:border-slate-800">
                    <div className="relative inline-flex items-center justify-center">
                      <CircularProgress
                        variant="determinate"
                        value={pct}
                        size={96}
                        thickness={5}
                        color={style.mui}
                      />
                      <span className={`absolute text-xl font-extrabold ${style.text}`}>{pct}%</span>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Predicted Score
                      </p>
                      <p className="text-4xl font-extrabold mt-1">
                        {r.predicted_marks}
                        <span className="text-lg font-semibold text-slate-400"> / {r.total_marks}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Cosine Similarity: {r.similarity_score}</p>
                    </div>
                  </div>

                  {/* Constructive Feedback */}
                  <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-4">
                    <p className="text-xs font-bold uppercase text-indigo-500 mb-1">Automated Feedback</p>
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                      {r.feedback}
                    </p>
                  </div>

                  {/* Keyword Heatmap Chips */}
                  {(r.matched_keywords?.length || r.missing_keywords?.length) ? (
                    <div className="space-y-3">
                      {r.matched_keywords && r.matched_keywords.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-2">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Matched Core Concepts
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {r.matched_keywords.map((kw) => (
                              <span
                                key={kw}
                                className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {r.missing_keywords && r.missing_keywords.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-2">
                            <AlertTriangle className="h-3.5 w-3.5" /> Missing / Under-emphasized Terms
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {r.missing_keywords.map((kw) => (
                              <span
                                key={kw}
                                className="rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </Card>
              );
            })
          )}
        </div>
      </div>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={2500}
        onClose={() => setToast(null)}
        message={toast}
      />
    </div>
  );
}
