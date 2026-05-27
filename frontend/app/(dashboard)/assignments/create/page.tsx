"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, Upload, Mic, ArrowLeft, ArrowRight } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import CounterInput from "@/components/ui/CounterInput";
import { useAssignmentStore, QuestionType, QuestionTypeConfig } from "@/store/assignmentStore";
import { useAuthStore } from "@/store/authStore";
import { generateId } from "@/lib/utils";

const QUESTION_TYPES: QuestionType[] = [
  "Multiple Choice Questions","Short Questions","Long Questions",
  "Diagram/Graph-Based Questions","Numerical Problems","True/False",
];

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  subject: z.string().min(1, "Subject is required"),
  className: z.string().min(1, "Class is required"),
  dueDate: z.string().min(1, "Due date is required"),
  additionalInstructions: z.string().optional(),
  schoolName: z.string().optional(),
  timeAllowed: z.number().min(1).max(300).optional(),
});
type FormValues = z.infer<typeof schema>;

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { addAssignment } = useAssignmentStore();
  const { user } = useAuthStore();
  const [questionTypes, setQuestionTypes] = useState<QuestionTypeConfig[]>([
    { id: generateId(), type: "Multiple Choice Questions", count: 5, marksPerQuestion: 1 },
  ]);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; content: string; type: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      timeAllowed: 45,
      schoolName: user?.schoolName || "Delhi Public School",
      className: user?.className || "",
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    // Warn if file is very large
    if (file.size > 5 * 1024 * 1024) {
      alert(`File "${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)}MB. Large files may be truncated. For best results, use files under 5MB.`);
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const fullContent = e.target?.result as string;
      // Truncate base64 to ~4MB to avoid payload issues (backend extracts text anyway)
      const MAX_CHARS = 4 * 1024 * 1024;
      const content = fullContent.length > MAX_CHARS
        ? fullContent.slice(0, MAX_CHARS)
        : fullContent;
      setUploadedFile({ name: file.name, content, type: file.type });
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "text/plain": [".txt"], "image/*": [".jpg",".jpeg",".png"] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB hard limit
    onDropRejected: (files) => {
      const f = files[0];
      if (f?.errors?.[0]?.code === "file-too-large") {
        alert("File is too large. Maximum size is 20MB.");
      }
    },
  });

  const addQuestionType = () => {
    const used = questionTypes.map((q) => q.type);
    const available = QUESTION_TYPES.find((t) => !used.includes(t));
    if (available) setQuestionTypes([...questionTypes, { id: generateId(), type: available, count: 5, marksPerQuestion: 2 }]);
  };
  const removeQuestionType = (id: string) => {
    if (questionTypes.length > 1) setQuestionTypes(questionTypes.filter((q) => q.id !== id));
  };
  const updateQuestionType = (id: string, updates: Partial<QuestionTypeConfig>) =>
    setQuestionTypes(questionTypes.map((q) => (q.id === id ? { ...q, ...updates } : q)));

  const totalQuestions = questionTypes.reduce((s, q) => s + q.count, 0);
  const totalMarks = questionTypes.reduce((s, q) => s + q.count * q.marksPerQuestion, 0);

  const onSubmit = async (data: FormValues) => {
    if (!questionTypes.length) return;
    setIsSubmitting(true);
    try {
      const assignmentId = generateId();
      const assignment = {
        id: assignmentId, title: data.title, subject: data.subject,
        className: data.className, dueDate: data.dueDate,
        assignedOn: new Date().toISOString(), questionTypes,
        additionalInstructions: data.additionalInstructions || "",
        status: "generating" as const,
      };
      addAssignment(assignment);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...assignment, schoolName: data.schoolName || user?.schoolName || "Delhi Public School", timeAllowed: data.timeAllowed || 45, uploadedFile, userId: user?.id }),
      });
      if (res.ok) {
        const { jobId } = await res.json();
        useAssignmentStore.getState().updateAssignment(assignmentId, { jobId });
        router.push(`/assignments/${assignmentId}/generating?jobId=${jobId}`);
      } else {
        useAssignmentStore.getState().updateAssignment(assignmentId, { status: "failed" });
        router.push("/assignments");
      }
    } catch { setIsSubmitting(false); }
  };

  const inputCls = "border border-[#DADADA] rounded-full px-4 py-2.5 text-sm font-medium text-[#303030] placeholder:text-[#A9A9A9] outline-none focus:border-[#303030] transition-colors letter-tight w-full bg-white";
  const labelCls = "text-sm font-bold text-[#303030] letter-tight";

  return (
    <div className="flex flex-col gap-3 pb-6">
      <TopBar title="Create Assignment" showBack />

      <div className="flex items-center gap-3 px-1">
        <div className="w-3 h-3 rounded-full bg-[#4BC26D] border-4 border-[rgba(75,194,109,0.4)] flex-shrink-0" />
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#303030] letter-tight">Create Assignment</h1>
          <p className="text-xs sm:text-sm text-[rgba(94,94,94,0.55)] letter-tight">Set up a new assignment for your students</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#303030] letter-tight">Assignment Details</h2>
            <p className="text-xs sm:text-sm text-[rgba(94,94,94,0.8)] letter-tight">Basic information about your assignment</p>
          </div>

          {/* File upload */}
          <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center gap-3 cursor-pointer transition-colors ${isDragActive ? "border-[#303030] bg-white/80" : "border-black/15 bg-white"}`}>
            <input {...getInputProps()} />
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Upload size={20} className="text-[#1E1E1E]" />
            </div>
            <div className="text-center">
              {uploadedFile ? (
                <p className="text-sm font-medium text-[#303030] letter-tight">{uploadedFile.name}</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-[#303030] letter-tight">Choose a file or drag & drop it here</p>
                  <p className="text-xs text-[#A9A9A9] letter-tight mt-0.5">PDF, TXT, JPEG, PNG up to 10MB</p>
                </>
              )}
            </div>
            <button type="button" className="bg-[#F6F6F6] text-[#303030] text-xs font-medium px-5 py-2 rounded-full hover:bg-gray-200 transition-colors letter-tight">
              Browse Files
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Assignment Title</label>
              <input {...register("title")} placeholder="e.g. Quiz on Electricity" className={inputCls} />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Subject</label>
              <input {...register("subject")} placeholder="e.g. Science" className={inputCls} />
              {errors.subject && <p className="text-xs text-red-500">{errors.subject.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Class</label>
              <input {...register("className")} placeholder="e.g. Grade 8" className={inputCls} />
              {errors.className && <p className="text-xs text-red-500">{errors.className.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>School Name</label>
              <input {...register("schoolName")} placeholder="e.g. Delhi Public School" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Due Date</label>
              <input type="date" {...register("dueDate")} className={inputCls} />
              {errors.dueDate && <p className="text-xs text-red-500">{errors.dueDate.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Time Allowed (minutes)</label>
              <Controller name="timeAllowed" control={control} render={({ field }) => (
                <input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} min={1} max={300} className={inputCls} />
              )} />
            </div>
          </div>

          {/* Question Types */}
          <div className="flex flex-col gap-3">
            <label className={labelCls}>Question Types</label>
            {questionTypes.map((qt) => (
              <div key={qt.id} className="bg-white rounded-2xl p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={qt.type}
                    onChange={(e) => updateQuestionType(qt.id, { type: e.target.value as QuestionType })}
                    className="text-sm font-medium text-[#303030] letter-tight bg-transparent outline-none cursor-pointer flex-1 min-w-0"
                  >
                    {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {questionTypes.length > 1 && (
                    <button type="button" onClick={() => removeQuestionType(qt.id)} className="text-[#303030] hover:text-red-500 transition-colors flex-shrink-0">
                      <X size={15} />
                    </button>
                  )}
                </div>
                <div className="bg-[#F0F0F0] rounded-2xl p-2 flex gap-2">
                  <CounterInput label="No. of Questions" value={qt.count} onChange={(v) => updateQuestionType(qt.id, { count: v })} min={1} max={30} className="flex-1" />
                  <CounterInput label="Marks" value={qt.marksPerQuestion} onChange={(v) => updateQuestionType(qt.id, { marksPerQuestion: v })} min={1} max={20} className="flex-1" />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <button type="button" onClick={addQuestionType} className="flex items-center gap-2 text-sm font-bold text-[#303030] letter-tight">
                <div className="w-8 h-8 bg-[#2B2B2B] rounded-full flex items-center justify-center flex-shrink-0">
                  <Plus size={15} className="text-white" />
                </div>
                Add Question Type
              </button>
              <div className="text-right">
                <p className="text-xs sm:text-sm font-medium text-[#303030] letter-tight">Total Questions : {totalQuestions}</p>
                <p className="text-xs sm:text-sm font-medium text-[#303030] letter-tight">Total Marks : {totalMarks}</p>
              </div>
            </div>
          </div>

          {/* Additional Instructions */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>
              Additional Information <span className="font-normal text-[rgba(94,94,94,0.8)]">(For better output)</span>
            </label>
            <div className="bg-white/25 border border-dashed border-[#DADADA] rounded-2xl p-3 flex flex-col gap-2">
              <textarea
                {...register("additionalInstructions")}
                placeholder="e.g. Focus on NCERT chapters 1-5, include diagram questions..."
                rows={3}
                className="bg-transparent text-sm font-medium text-[rgba(48,48,48,0.6)] placeholder:text-[rgba(48,48,48,0.6)] outline-none resize-none letter-tight w-full"
              />
              <div className="flex justify-end">
                <button type="button" className="w-8 h-8 bg-[#F0F0F0] rounded-full flex items-center justify-center">
                  <Mic size={14} className="text-[#303030]" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <Button type="button" variant="white" size="sm" onClick={() => router.back()} className="gap-2 border border-gray-200">
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Generate Paper <ArrowRight size={15} /></>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
