"use client";
import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Database,
  BarChart3,
  Cpu,
  CheckCircle2,
  ArrowRight,
  Layers,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui/primitives";

export default function HomePage() {
  return (
    <div className="space-y-12 pb-10">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 p-8 sm:p-12 text-white shadow-2xl">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <Badge variant="indigo" className="!bg-indigo-500/20 !text-indigo-200 !border-indigo-400/30">
            <Sparkles className="h-3.5 w-3.5" /> 100% Free Open-Source NLP Grading Engine
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Grade Short Answers with{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-emerald-300 bg-clip-text text-transparent">
              Semantic Precision
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            SmartGrader combines deterministic keyword coverage with NLP vector similarity to deliver
            instant, transparent, and unbiased scores—benchmarked against 4,000+ real teacher-graded responses.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link href="/evaluate">
              <Button className="px-6 py-3 text-base">
                Launch Evaluation Studio <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dataset">
              <Button
                variant="outline"
                className="!border-white/25 !text-white hover:!bg-white/10 px-6 py-3 text-base"
              >
                Explore ASAG Dataset
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Feature Cards */}
      <section className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 hover:-translate-y-1 hover:border-indigo-500/40 duration-200 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-500">
            <Cpu className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">Dual NLP Grading Engines</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Switch between or compare <strong>Rule-Based Keyword Coverage</strong> and{" "}
            <strong>Semantic Vector Similarity</strong> side by side in real time.
          </p>
          <Link
            href="/evaluate"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Try live evaluator <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Card>

        <Card className="p-6 hover:-translate-y-1 hover:border-emerald-500/40 duration-200 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500">
            <Database className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">4,000+ Record Benchmarking</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Upload CSV or Excel datasets with automatic 4,000 train / 275 test leakage-free split
            validation and instant MAE accuracy scoring.
          </p>
          <Link
            href="/dataset"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Manage datasets <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Card>

        <Card className="p-6 hover:-translate-y-1 hover:border-violet-500/40 duration-200 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-500">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">Visual Marks Analytics</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Inspect Mean Absolute Error (MAE), audit evaluation logs, and compare AI-predicted scores
            directly against human teacher marks.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline"
          >
            Open analytics dashboard <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </section>

      {/* How It Works Pipeline */}
      <Card className="p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold">Evaluation Pipeline Architecture</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              End-to-end automated scoring workflow built with Next.js, Material UI, shadcn/ui & Flask
            </p>
          </div>
          <Badge variant="success">
            <ShieldCheck className="h-3.5 w-3.5" /> Zero Paid API Keys
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          {[
            {
              step: "01",
              title: "Text Preprocessing",
              desc: "Tokenization, stop-word removal & spaCy lemmatization.",
              icon: Layers,
            },
            {
              step: "02",
              title: "Feature Extraction",
              desc: "Key concept extraction & TF-IDF / semantic vectorization.",
              icon: Cpu,
            },
            {
              step: "03",
              title: "Similarity Scoring",
              desc: "Cosine similarity & concept coverage weighted mapping.",
              icon: Zap,
            },
            {
              step: "04",
              title: "Actionable Feedback",
              desc: "Predicted score + matched & missing concept highlights.",
              icon: CheckCircle2,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-indigo-500">STEP {item.step}</span>
                  <Icon className="h-4 w-4 text-slate-400" />
                </div>
                <h4 className="font-bold text-sm">{item.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
