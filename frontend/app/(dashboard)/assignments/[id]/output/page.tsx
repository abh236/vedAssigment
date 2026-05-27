"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download, RefreshCw, BookmarkPlus, Check, ArrowLeft,
  FileText, Clock, Award, LayoutList, Eye, EyeOff, Copy,
} from "lucide-react";
import { useAssignmentStore } from "@/store/assignmentStore";
import { generateId } from "@/lib/utils";
import type { Difficulty } from "@/store/assignmentStore";

// ── Difficulty badge — always visible, colour-coded ──────────────────────
function DiffBadge({ difficulty }: { difficulty: Difficulty }) {
  const map: Record<Difficulty, { label: string; screen: string; print: string }> = {
    easy:   { label: "Easy",     screen: "bg-emerald-100 text-emerald-700 border border-emerald-200", print: "text-emerald-700" },
    medium: { label: "Moderate", screen: "bg-amber-100  text-amber-700  border border-amber-200",    print: "text-amber-700"   },
    hard:   { label: "Hard",     screen: "bg-red-100    text-red-700    border border-red-200",       print: "text-red-700"     },
  };
  const d = map[difficulty] ?? map.medium;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold letter-tight whitespace-nowrap ${d.screen}`}>
      {d.label}
    </span>
  );
}

// ── Section letter helper ─────────────────────────────────────────────────
const SEC = ["A","B","C","D","E","F","G","H"];

export default function OutputPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const assignment = useAssignmentStore((s) => s.assignments.find((a) => a.id === params.id));
  const { updateAssignment, saveToLibrary, library } = useAssignmentStore();
  const paperRef = useRef<HTMLDivElement>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [savedToLib, setSavedToLib] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [teacherView, setTeacherView] = useState(true); // true = show difficulty badges
  const [copiedQ, setCopiedQ] = useState<string | null>(null);

  const copyQuestion = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQ(id);
    setTimeout(() => setCopiedQ(null), 1500);
  };

  if (!assignment || !assignment.generatedPaper) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center px-4 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText size={28} className="text-gray-300" />
          </div>
          <p className="text-base text-[rgba(94,94,94,0.8)] letter-tight">No generated paper found.</p>
          <button onClick={() => router.push("/assignments")}
            className="px-5 py-2.5 bg-[#181818] text-white rounded-full text-sm font-semibold letter-tight hover:bg-[#2a2a2a] transition-colors">
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  const paper = assignment.generatedPaper;
  const alreadySaved = library.some((l) => l.assignmentId === params.id);
  const totalQuestions = paper.sections.reduce((s, sec) => s + sec.questions.length, 0);
  const diffCount = (level: string) =>
    paper.sections.reduce((s, sec) => s + sec.questions.filter((q) => q.difficulty === level).length, 0);

  const handleDownloadPDF = async () => {
    if (typeof window === "undefined" || !paperRef.current) return;
    setDownloading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf().set({
        margin: [12, 12, 12, 12],
        filename: `${paper.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2.5, useCORS: true, letterRendering: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }).from(paperRef.current).save();
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveToLibrary = () => {
    saveToLibrary({
      id: generateId(), assignmentId: params.id,
      title: paper.title, subject: paper.subject, className: paper.className,
      savedAt: new Date().toISOString(), paper,
      tags: [paper.subject, paper.className].filter(Boolean),
    });
    setSavedToLib(true);
    setTimeout(() => setSavedToLib(false), 2500);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assignments/${params.id}/regenerate`, { method: "POST" });
      if (res.ok) {
        const { jobId } = await res.json();
        updateAssignment(params.id, { status: "generating", jobId });
        router.push(`/assignments/${params.id}/generating?jobId=${jobId}`);
      }
    } catch { /* ignore */ }
    setIsRegenerating(false);
  };

  return (
    <div className="flex flex-col gap-4 pb-8">

      {/* ══════════════════════════════════════════════════════════════════
          ACTION BAR — sticky dark bar with all controls
      ══════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-30 bg-[#111111] rounded-2xl shadow-2xl overflow-hidden">
        {/* Top row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <button onClick={() => router.back()}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 transition-colors">
            <ArrowLeft size={15} className="text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white letter-tight truncate">{paper.title}</p>
            <p className="text-xs text-white/40 letter-tight">{paper.subject} · {paper.className}</p>
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button onClick={handleRegenerate} disabled={isRegenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white text-xs font-semibold letter-tight transition-colors disabled:opacity-40">
              <RefreshCw size={12} className={isRegenerating ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Regenerate</span>
            </button>
            {/* Teacher / Exam view toggle */}
            <button onClick={() => setTeacherView(!teacherView)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white text-xs font-semibold letter-tight transition-colors"
              title={teacherView ? "Switch to exam view (hide difficulty)" : "Switch to teacher view (show difficulty)"}>
              {teacherView ? <Eye size={12} /> : <EyeOff size={12} />}
              <span className="hidden sm:inline">{teacherView ? "Teacher" : "Exam"}</span>
            </button>
            <button onClick={handleSaveToLibrary} disabled={alreadySaved || savedToLib}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white text-xs font-semibold letter-tight transition-colors disabled:opacity-40">
              {savedToLib || alreadySaved ? <Check size={12} /> : <BookmarkPlus size={12} />}
              <span className="hidden sm:inline">{savedToLib ? "Saved!" : alreadySaved ? "Saved" : "Save"}</span>
            </button>
            <button onClick={handleDownloadPDF} disabled={downloading}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-[#FF5623] hover:bg-[#e04d1f] rounded-full text-white text-xs font-bold letter-tight transition-colors disabled:opacity-60">
              <Download size={12} className={downloading ? "animate-bounce" : ""} />
              <span>{downloading ? "Preparing..." : "Download PDF"}</span>
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center divide-x divide-white/10">
          {[
            { icon: FileText,   label: "Questions", value: totalQuestions },
            { icon: Award,      label: "Marks",     value: paper.totalMarks },
            { icon: LayoutList, label: "Sections",  value: paper.sections.length },
            { icon: Clock,      label: "Duration",  value: `${paper.timeAllowed}m` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex-1 flex items-center gap-2 px-3 py-2">
              <Icon size={13} className="text-white/40 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-white letter-tight leading-none">{value}</p>
                <p className="text-[10px] text-white/40 letter-tight leading-none mt-0.5">{label}</p>
              </div>
            </div>
          ))}
          {/* Difficulty summary */}
          <div className="flex items-center gap-1.5 px-3 py-2">
            <span className="text-[10px] font-bold text-emerald-400">{diffCount("easy")}E</span>
            <span className="text-white/20">·</span>
            <span className="text-[10px] font-bold text-amber-400">{diffCount("medium")}M</span>
            <span className="text-white/20">·</span>
            <span className="text-[10px] font-bold text-red-400">{diffCount("hard")}H</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          PAPER — the printable content
      ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-b from-[#4A4A4A] to-[#3A3A3A] rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl">
        <div
          ref={paperRef}
          className="bg-white rounded-xl sm:rounded-2xl overflow-hidden"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
        >

          {/* ── Header band ── */}
          <div className="bg-[#1A1A1A] px-6 sm:px-10 py-5 sm:py-7 text-center">
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-widest uppercase letter-tight">
              {paper.schoolName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span className="text-xs sm:text-sm text-white/70 font-medium">Subject: <span className="text-white font-bold">{paper.subject}</span></span>
              <span className="text-white/30">|</span>
              <span className="text-xs sm:text-sm text-white/70 font-medium">Class: <span className="text-white font-bold">{paper.className}</span></span>
            </div>
          </div>

          {/* ── Meta strip ── */}
          <div className="flex items-center justify-between px-6 sm:px-10 py-3 bg-[#F8F8F8] border-b border-gray-200">
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-[#FF5623]" />
              <span className="text-xs sm:text-sm font-semibold text-[#303030] letter-tight">
                Time: <span className="font-bold">{paper.timeAllowed} min</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award size={13} className="text-[#FF5623]" />
              <span className="text-xs sm:text-sm font-semibold text-[#303030] letter-tight">
                Max Marks: <span className="font-bold">{paper.totalMarks}</span>
              </span>
            </div>
          </div>

          <div className="px-5 sm:px-10 py-5 sm:py-7 flex flex-col gap-6">

            {/* ── General instructions ── */}
            {paper.generalInstructions?.length > 0 && (
              <div className="border-l-4 border-[#FF5623] bg-orange-50 rounded-r-xl px-4 py-3">
                <p className="text-xs font-bold text-[#FF5623] uppercase tracking-wider mb-2 letter-tight">
                  General Instructions
                </p>
                <ol className="space-y-1">
                  {paper.generalInstructions.map((inst, i) => (
                    <li key={i} className="text-xs sm:text-sm text-[#303030] leading-relaxed flex gap-2">
                      <span className="font-bold text-[#FF5623] flex-shrink-0">{i + 1}.</span>
                      <span>{inst}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* ── Student info ── */}
            <div className="border border-gray-200 rounded-xl p-4 bg-[#FAFAFA]">
              <p className="text-[10px] font-bold text-[#A9A9A9] uppercase tracking-widest mb-3 letter-tight">
                Candidate Information
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { label: "Name" },
                  { label: "Roll Number" },
                  { label: "Section" },
                ].map(({ label }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#A9A9A9] uppercase tracking-wider letter-tight">{label}</span>
                    <div className="border-b-2 border-[#303030] pb-1 min-h-[24px]" />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Sections ── */}
            {paper.sections.map((section, sIdx) => (
              <div key={section.id} className="flex flex-col gap-4">

                {/* Section header */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
                    <span className="text-sm sm:text-base font-bold text-white">{SEC[sIdx] || String(sIdx + 1)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm sm:text-base font-bold text-[#1A1A1A] letter-tight">
                        Section {SEC[sIdx] || String(sIdx + 1)}
                      </h2>
                      <span className="text-xs text-[#A9A9A9] font-medium letter-tight">— {section.questionType}</span>
                    </div>
                    <p className="text-xs text-[#5E5E5E] italic letter-tight mt-0.5">{section.instruction}</p>
                  </div>
                  <div className="flex-shrink-0 text-right hidden sm:block">
                    <p className="text-xs font-bold text-[#303030] letter-tight">{section.totalMarks} marks</p>
                    <p className="text-[10px] text-[#A9A9A9] letter-tight">{section.questions.length} questions</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-[#1A1A1A] via-gray-300 to-transparent" />

                {/* Questions */}
                <div className="flex flex-col gap-4 sm:gap-5">
                  {section.questions.map((q, qIdx) => (
                    <div key={q.id} className="flex gap-3 sm:gap-4">

                      {/* Question number bubble */}
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-[#303030] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] sm:text-xs font-bold text-[#303030]">{qIdx + 1}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Question text + marks + difficulty */}
                        <div className="flex items-start justify-between gap-2 sm:gap-4">
                          <p className="text-sm sm:text-base text-[#1A1A1A] leading-relaxed flex-1 font-medium">
                            {q.text}
                          </p>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0 pt-0.5">
                            {teacherView && <DiffBadge difficulty={q.difficulty} />}
                            <span className="text-xs font-bold text-[#303030] letter-tight whitespace-nowrap bg-gray-100 border border-gray-300 px-2 py-0.5 rounded-full">
                              {q.marks} {q.marks === 1 ? "mark" : "marks"}
                            </span>
                            {/* Copy question */}
                            <button onClick={() => copyQuestion(q.text, q.id)}
                              className="text-[#A9A9A9] hover:text-[#303030] transition-colors"
                              title="Copy question text">
                              {copiedQ === q.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>

                        {/* MCQ / T-F options */}
                        {q.options && q.options.length > 0 && (
                          <div className={`mt-3 grid gap-2 ${q.options.length === 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-start gap-2 bg-[#F8F8F8] border border-gray-200 rounded-lg px-3 py-2">
                                <span className="text-xs font-bold text-[#FF5623] flex-shrink-0 mt-0.5">
                                  {String.fromCharCode(65 + oIdx)}.
                                </span>
                                <span className="text-xs sm:text-sm text-[#303030] leading-relaxed">{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Answer space for non-MCQ */}
                        {(!q.options || q.options.length === 0) && (
                          <div className="mt-3 space-y-2">
                            {Array.from({ length: q.marks > 4 ? 4 : q.marks > 1 ? 2 : 1 }).map((_, i) => (
                              <div key={i} className="border-b border-dashed border-gray-300 h-5" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* ── End of paper ── */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex-1 h-px bg-gray-300" />
              <p className="text-xs font-bold text-[#A9A9A9] tracking-widest uppercase letter-tight whitespace-nowrap">
                ✦ End of Question Paper ✦
              </p>
              <div className="flex-1 h-px bg-gray-300" />
            </div>

          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          STATS CARDS — screen only
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Questions", value: totalQuestions,       icon: FileText,   color: "#3B82F6", bg: "#EFF6FF" },
          { label: "Total Marks", value: paper.totalMarks,   icon: Award,      color: "#FF5623", bg: "#FFF7ED" },
          { label: "Sections",  value: paper.sections.length, icon: LayoutList, color: "#A855F7", bg: "#FAF5FF" },
          { label: "Duration",  value: `${paper.timeAllowed}m`, icon: Clock,   color: "#4BC26D", bg: "#F0FDF4" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-extrabold text-[#303030] letter-tight leading-none">{value}</p>
              <p className="text-xs text-[#A9A9A9] letter-tight mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Difficulty breakdown */}
      <div className="bg-white rounded-2xl p-4 flex items-center gap-4">
        <p className="text-xs font-bold text-[#A9A9A9] uppercase tracking-wider letter-tight flex-shrink-0">Difficulty</p>
        <div className="flex-1 flex items-center gap-3">
          {[
            { level: "easy",   label: "Easy",     color: "#10B981", bg: "#D1FAE5" },
            { level: "medium", label: "Moderate", color: "#F59E0B", bg: "#FEF3C7" },
            { level: "hard",   label: "Hard",     color: "#EF4444", bg: "#FEE2E2" },
          ].map(({ level, label, color, bg }) => {
            const count = diffCount(level);
            const pct = totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 0;
            return (
              <div key={level} className="flex items-center gap-2 flex-1">
                <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-100">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
                <span className="text-xs font-bold letter-tight whitespace-nowrap" style={{ color }}>
                  {count} {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
