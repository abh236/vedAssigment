"use client";
import { useState } from "react";
import {
  BookOpen, FileText, ClipboardList, Lightbulb, MessageSquare,
  ChevronRight, X, Loader2, Copy, Check, Sparkles, Key, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import { useAuthStore } from "@/store/authStore";

interface Tool {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  bg: string;
  fields: { key: string; label: string; placeholder: string; required?: boolean }[];
  promptBuilder: (vals: Record<string, string>) => string;
}

const TOOLS: Tool[] = [
  {
    id: "lesson-plan",
    icon: BookOpen,
    label: "Lesson Planner",
    description: "Generate a structured lesson plan for any topic and grade.",
    color: "#3B82F6",
    bg: "#EFF6FF",
    fields: [
      { key: "subject",  label: "Subject",           placeholder: "e.g. Science",        required: true },
      { key: "topic",    label: "Topic",              placeholder: "e.g. Photosynthesis",  required: true },
      { key: "grade",    label: "Grade / Class",      placeholder: "e.g. Grade 8",         required: true },
      { key: "duration", label: "Duration (minutes)", placeholder: "e.g. 45" },
    ],
    promptBuilder: (v) =>
      `Create a detailed lesson plan for a ${v.duration || "45"}-minute class.
Subject: ${v.subject}
Topic: ${v.topic}
Grade: ${v.grade}

Structure the plan with these sections:
1. Learning Objectives (3-4 clear, measurable objectives)
2. Materials Needed
3. Introduction / Hook (5 minutes)
4. Main Teaching Activity (${Math.max(20, Number(v.duration || 45) - 20)} minutes)
5. Student Practice / Assessment (10 minutes)
6. Wrap-up and Summary (5 minutes)
7. Homework / Extension Activity

Make it practical and ready to use in a classroom.`,
  },
  {
    id: "rubric",
    icon: ClipboardList,
    label: "Rubric Generator",
    description: "Create detailed grading rubrics for any assignment type.",
    color: "#A855F7",
    bg: "#FAF5FF",
    fields: [
      { key: "assignment",  label: "Assignment Type", placeholder: "e.g. Essay, Project, Lab Report", required: true },
      { key: "subject",     label: "Subject",         placeholder: "e.g. English",                    required: true },
      { key: "grade",       label: "Grade / Class",   placeholder: "e.g. Grade 10",                   required: true },
      { key: "totalMarks",  label: "Total Marks",     placeholder: "e.g. 20",                         required: true },
    ],
    promptBuilder: (v) =>
      `Create a detailed grading rubric for a ${v.assignment} in ${v.subject} for ${v.grade}.
Total marks: ${v.totalMarks}

Create a rubric table with:
- 4-5 assessment criteria (e.g. Content, Structure, Language, Presentation)
- 4 performance levels: Excellent (4), Good (3), Satisfactory (2), Needs Improvement (1)
- Clear descriptors for each cell
- Marks allocation per criterion that totals ${v.totalMarks}

Format as a clear, easy-to-read table using plain text alignment.`,
  },
  {
    id: "quiz",
    icon: FileText,
    label: "Quick Quiz Maker",
    description: "Generate a short quiz on any topic instantly.",
    color: "#FF5623",
    bg: "#FFF7ED",
    fields: [
      { key: "topic",   label: "Topic",              placeholder: "e.g. Newton's Laws of Motion", required: true },
      { key: "subject", label: "Subject",            placeholder: "e.g. Physics",                 required: true },
      { key: "grade",   label: "Grade / Class",      placeholder: "e.g. Grade 9",                 required: true },
      { key: "count",   label: "Number of Questions", placeholder: "e.g. 10" },
    ],
    promptBuilder: (v) =>
      `Create a ${v.count || "10"}-question multiple choice quiz on "${v.topic}" for ${v.subject}, ${v.grade}.

For each question:
- Write a clear, unambiguous question
- Provide 4 options labeled A, B, C, D
- Mark the correct answer with [ANSWER: X]
- Vary difficulty: easy (30%), medium (50%), hard (20%)

Number each question. Make questions progressively more challenging.`,
  },
  {
    id: "summary",
    icon: Lightbulb,
    label: "Topic Summariser",
    description: "Get a concise, student-friendly summary of any topic.",
    color: "#F59E0B",
    bg: "#FFFBEB",
    fields: [
      { key: "topic",   label: "Topic",         placeholder: "e.g. The French Revolution", required: true },
      { key: "subject", label: "Subject",       placeholder: "e.g. History",               required: true },
      { key: "grade",   label: "Grade / Class", placeholder: "e.g. Grade 9",               required: true },
      { key: "length",  label: "Detail Level",  placeholder: "brief / standard / detailed" },
    ],
    promptBuilder: (v) =>
      `Write a ${v.length || "standard"} student-friendly summary of "${v.topic}" for ${v.subject}, ${v.grade}.

Structure the summary as:
1. Overview (2-3 sentences)
2. Key Concepts / Main Points (numbered list)
3. Important Facts, Dates, or Names
4. Cause and Effect (if applicable)
5. Key Takeaways (3 bullet points)
6. Quick Revision Questions (3 questions to test understanding)

Use simple, clear language appropriate for ${v.grade} students.`,
  },
  {
    id: "feedback",
    icon: MessageSquare,
    label: "Feedback Writer",
    description: "Generate constructive feedback comments for student work.",
    color: "#14B8A6",
    bg: "#F0FDFA",
    fields: [
      { key: "subject",     label: "Subject",             placeholder: "e.g. Mathematics",                                    required: true },
      { key: "grade",       label: "Grade / Class",       placeholder: "e.g. Grade 7",                                        required: true },
      { key: "performance", label: "Student Performance", placeholder: "e.g. struggling with fractions, good at geometry",    required: true },
      { key: "tone",        label: "Tone",                placeholder: "encouraging / formal / brief" },
    ],
    promptBuilder: (v) =>
      `Write ${v.tone || "encouraging"} teacher feedback for a ${v.grade} ${v.subject} student.
Performance notes: ${v.performance}

Structure the feedback as:
1. Opening (positive acknowledgment)
2. Strengths (3 specific things the student does well)
3. Areas for Improvement (2 specific areas with actionable suggestions)
4. Next Steps (2-3 concrete actions the student can take)
5. Closing (motivating sentence)

Keep it constructive, specific, and age-appropriate for ${v.grade}.`,
  },
];

// Simple text formatter — converts plain text with numbered lists to readable JSX
function FormattedResult({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="flex flex-col gap-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        // Numbered section heading like "1. Learning Objectives"
        if (/^\d+\.\s+[A-Z]/.test(trimmed)) {
          return (
            <p key={i} className="text-sm font-bold text-[#303030] letter-tight mt-2">
              {trimmed}
            </p>
          );
        }
        // Bullet point
        if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          return (
            <p key={i} className="text-sm text-[#303030] letter-tight pl-3">
              {trimmed}
            </p>
          );
        }
        // Answer line
        if (trimmed.startsWith("[ANSWER:")) {
          return (
            <p key={i} className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded letter-tight">
              {trimmed}
            </p>
          );
        }
        // Demo mode notice
        if (trimmed.startsWith("[Demo Mode")) {
          return (
            <p key={i} className="text-sm font-bold text-amber-700 letter-tight">
              {trimmed}
            </p>
          );
        }
        return (
          <p key={i} className="text-sm text-[#303030] letter-tight leading-relaxed">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export default function ToolkitPage() {
  const { user } = useAuthStore();
  const storedKey = typeof window !== "undefined" ? localStorage.getItem("veda-openai-key") || "" : "";
  const storedGroqKey = typeof window !== "undefined" ? localStorage.getItem("veda-groq-key") || "" : "";
  const hasAnyKey = !!(storedKey || storedGroqKey);

  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const openTool = (tool: Tool) => {
    setActiveTool(tool);
    setValues({});
    setResult("");
    setError("");
    setIsDemo(false);
  };

  const closeTool = () => {
    setActiveTool(null);
    setResult("");
    setError("");
  };

  const handleGenerate = async () => {
    if (!activeTool) return;
    const missing = activeTool.fields.find((f) => f.required && !values[f.key]?.trim());
    if (missing) { setError(`Please fill in: ${missing.label}`); return; }
    setError("");
    setLoading(true);
    setResult("");

    // Get API key — from localStorage (set via Settings) or from auth store
    const apiKey = storedKey || (user as { openAiKey?: string })?.openAiKey || "";

    try {
      const prompt = activeTool.promptBuilder(values);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/toolkit/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, apiKey, userEmail: user?.email, groqKey: storedGroqKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Generation failed. Check your OpenAI key in Settings.");
        setLoading(false);
        return;
      }

      setResult(data.result || "No result returned.");
      setIsDemo(data.demo === true);
    } catch {
      setError("Could not connect to backend. Make sure it is running on port 4000.");
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 pb-24">
      <TopBar title="AI Teacher's Toolkit" />

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#4BC26D] border-4 border-[rgba(75,194,109,0.4)]" />
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#303030] letter-tight">AI Teacher's Toolkit</h1>
            <p className="text-xs sm:text-sm text-[rgba(94,94,94,0.55)] letter-tight">
              AI-powered tools to save hours of prep work.
            </p>
          </div>
        </div>
        {/* Key status indicator */}
        <Link href="/settings"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold letter-tight transition-colors ${
            hasAnyKey ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700 hover:bg-amber-200"
          }`}>
          <Key size={12} />
          {hasAnyKey ? "Key set" : "Add API key"}
        </Link>
      </div>

      {/* No key warning */}
      {!hasAnyKey && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-3">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800 letter-tight">OpenAI key not set</p>
            <p className="text-xs text-amber-700 letter-tight mt-0.5">
              Tools will run in demo mode.{" "}
              <Link href="/settings" className="underline font-semibold">Add your OpenAI or free Groq key in Settings</Link>
              {" "}to get real AI results.
            </p>
          </div>
        </div>
      )}

      {/* Tool cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <button key={tool.id} onClick={() => openTool(tool)}
              className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col gap-4 text-left hover:shadow-md transition-all group border border-transparent hover:border-gray-100">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: tool.bg }}>
                  <Icon size={22} style={{ color: tool.color }} />
                </div>
                <ChevronRight size={18} className="text-[#A9A9A9] group-hover:text-[#303030] group-hover:translate-x-0.5 transition-all mt-1" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#303030] letter-tight">{tool.label}</h3>
                <p className="text-sm text-[rgba(94,94,94,0.8)] letter-tight mt-1">{tool.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tool modal */}
      {activeTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-[#F0F0F0] sticky top-0 bg-white rounded-t-3xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: activeTool.bg }}>
                  <activeTool.icon size={20} style={{ color: activeTool.color }} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#303030] letter-tight">{activeTool.label}</h2>
                  <p className="text-xs text-[#A9A9A9] letter-tight">{activeTool.description}</p>
                </div>
              </div>
              <button onClick={closeTool} className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
                <X size={18} className="text-[#303030]" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">

              {/* Input fields — shown when no result yet */}
              {!result && (
                <div className="flex flex-col gap-3">
                  {activeTool.fields.map((f) => (
                    <div key={f.key} className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-[#303030] letter-tight">
                        {f.label} {f.required && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        value={values[f.key] || ""}
                        onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleGenerate(); }}
                        placeholder={f.placeholder}
                        className="border border-[#DADADA] rounded-full px-4 py-2.5 text-sm text-[#303030] placeholder:text-[#A9A9A9] outline-none focus:border-[#303030] transition-colors letter-tight"
                      />
                    </div>
                  ))}

                  {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                      <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600 letter-tight">{error}</p>
                    </div>
                  )}

                  <button onClick={handleGenerate} disabled={loading}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-[#181818] text-white rounded-full text-sm font-semibold letter-tight hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 mt-1">
                    {loading
                      ? <><Loader2 size={15} className="animate-spin" /> Generating...</>
                      : <><Sparkles size={15} /> Generate</>}
                  </button>

                  {!storedKey && (
                    <p className="text-xs text-center text-amber-600 letter-tight">
                      Running in demo mode.{" "}
                      <Link href="/settings" className="underline font-semibold" onClick={closeTool}>
                        Add API key
                      </Link>{" "}for real results.
                    </p>
                  )}
                </div>
              )}

              {/* Result */}
              {result && (
                <div className="flex flex-col gap-3">
                  {/* Result header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#303030] letter-tight">Result</span>
                      {isDemo && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                          Demo
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleCopy}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F6F6] hover:bg-[#EBEBEB] rounded-full text-xs font-semibold text-[#303030] letter-tight transition-colors">
                        {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                      </button>
                      <button onClick={() => { setResult(""); setValues({}); setIsDemo(false); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F6F6] hover:bg-[#EBEBEB] rounded-full text-xs font-semibold text-[#303030] letter-tight transition-colors">
                        Try Again
                      </button>
                    </div>
                  </div>

                  {/* Formatted result */}
                  <div className="bg-[#F8F8F8] rounded-2xl p-4 max-h-[55vh] overflow-y-auto">
                    <FormattedResult text={result} />
                  </div>

                  {isDemo && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2">
                      <Key size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 letter-tight">
                        This is a demo response.{" "}
                        <Link href="/settings" className="underline font-semibold" onClick={closeTool}>
                          Add your OpenAI key in Settings
                        </Link>{" "}to get real AI-generated content.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
