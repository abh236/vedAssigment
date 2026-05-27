"use client";
import { useMemo } from "react";
import { BarChart2, FileText, CheckCircle, Clock, AlertCircle, TrendingUp } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import { useAssignmentStore } from "@/store/assignmentStore";

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#3B82F6", Science: "#4BC26D", English: "#F59E0B",
  History: "#A855F7", Physics: "#EC4899", Chemistry: "#FF5623",
  Biology: "#14B8A6", default: "#6366F1",
};

export default function AnalyticsPage() {
  const { assignments, library } = useAssignmentStore();

  const stats = useMemo(() => {
    const total = assignments.length;
    const completed = assignments.filter((a) => a.status === "completed").length;
    const generating = assignments.filter((a) => a.status === "generating").length;
    const failed = assignments.filter((a) => a.status === "failed").length;
    const subjectMap: Record<string, number> = {};
    assignments.forEach((a) => { const s = a.subject || "Other"; subjectMap[s] = (subjectMap[s] || 0) + 1; });
    const totalQuestions = assignments.filter((a) => a.generatedPaper)
      .reduce((sum, a) => sum + (a.generatedPaper?.sections.reduce((s, sec) => s + sec.questions.length, 0) ?? 0), 0);
    const qtMap: Record<string, number> = {};
    assignments.forEach((a) => { a.questionTypes.forEach((qt) => { qtMap[qt.type] = (qtMap[qt.type] || 0) + qt.count; }); });
    return { total, completed, generating, failed, subjectMap, totalQuestions, qtMap };
  }, [assignments]);

  const maxSubjectCount = Math.max(...Object.values(stats.subjectMap), 1);
  const maxQtCount = Math.max(...Object.values(stats.qtMap), 1);

  const statCards = [
    { label: "Total Assignments", value: stats.total, icon: FileText, color: "#3B82F6", bg: "#EFF6FF" },
    { label: "Completed", value: stats.completed, icon: CheckCircle, color: "#4BC26D", bg: "#F0FDF4" },
    { label: "Generating", value: stats.generating, icon: Clock, color: "#F59E0B", bg: "#FFFBEB" },
    { label: "Failed", value: stats.failed, icon: AlertCircle, color: "#EF4444", bg: "#FEF2F2" },
    { label: "Questions Generated", value: stats.totalQuestions, icon: TrendingUp, color: "#A855F7", bg: "#FAF5FF" },
    { label: "Saved in Library", value: library.length, icon: BarChart2, color: "#FF5623", bg: "#FFF7ED" },
  ];

  return (
    <div className="flex flex-col gap-4 pb-24">
      <TopBar title="Analytics" />
      <div className="flex items-center gap-3 px-2">
        <div className="w-3 h-3 rounded-full bg-[#4BC26D] border-4 border-[rgba(75,194,109,0.4)]" />
        <div>
          <h1 className="text-xl font-bold text-[#303030] letter-tight">Analytics</h1>
          <p className="text-sm text-[rgba(94,94,94,0.55)] letter-tight">Overview of your assessment activity.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
              <Icon size={22} style={{ color }} />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-[#303030] letter-tight leading-none">{value}</p>
              <p className="text-sm text-[rgba(94,94,94,0.8)] letter-tight mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-6 flex flex-col gap-4">
          <h2 className="text-base font-bold text-[#303030] letter-tight">Assignments by Subject</h2>
          {Object.keys(stats.subjectMap).length === 0 ? (
            <p className="text-sm text-[#A9A9A9] letter-tight">No data yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(stats.subjectMap).sort((a, b) => b[1] - a[1]).map(([subject, count]) => {
                const color = SUBJECT_COLORS[subject] || SUBJECT_COLORS.default;
                return (
                  <div key={subject} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#303030] letter-tight">{subject}</span>
                      <span className="text-sm font-bold text-[#303030] letter-tight">{count}</span>
                    </div>
                    <div className="w-full h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.round((count / maxSubjectCount) * 100)}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 flex flex-col gap-4">
          <h2 className="text-base font-bold text-[#303030] letter-tight">Questions by Type</h2>
          {Object.keys(stats.qtMap).length === 0 ? (
            <p className="text-sm text-[#A9A9A9] letter-tight">No data yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(stats.qtMap).sort((a, b) => b[1] - a[1]).map(([type, count], i) => {
                const colors = ["#FF5623", "#3B82F6", "#4BC26D", "#A855F7", "#F59E0B", "#EC4899"];
                return (
                  <div key={type} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#303030] letter-tight truncate max-w-[180px]">{type}</span>
                      <span className="text-sm font-bold text-[#303030] letter-tight">{count}</span>
                    </div>
                    <div className="w-full h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.round((count / maxQtCount) * 100)}%`, backgroundColor: colors[i % colors.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 flex flex-col gap-4">
        <h2 className="text-base font-bold text-[#303030] letter-tight">Recent Activity</h2>
        {assignments.length === 0 ? (
          <p className="text-sm text-[#A9A9A9] letter-tight">No assignments created yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {assignments.slice(0, 8).map((a) => {
              const sc: Record<string, string> = { completed: "#4BC26D", generating: "#3B82F6", failed: "#EF4444", draft: "#A9A9A9" };
              return (
                <div key={a.id} className="flex items-center gap-3 py-2 border-b border-[#F6F6F6] last:border-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sc[a.status] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#303030] letter-tight truncate">{a.title}</p>
                    <p className="text-xs text-[#A9A9A9] letter-tight">{a.subject} · {a.className}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full letter-tight capitalize"
                    style={{ backgroundColor: sc[a.status] + "22", color: sc[a.status] }}>
                    {a.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
