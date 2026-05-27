"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, MoreVertical, Eye, Trash2, FileText, Loader2, Copy } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import { useAssignmentStore } from "@/store/assignmentStore";
import { useAuthStore } from "@/store/authStore";
import { formatDate, generateId, cn } from "@/lib/utils";

function DueBadge({ dueDate }: { dueDate: string }) {
  const diffDays = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  if (diffDays < 0) return <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Overdue</span>;
  if (diffDays === 0) return <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Due today</span>;
  if (diffDays <= 3) return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Due in {diffDays}d</span>;
  return null;
}

export default function AssignmentsPage() {
  const { assignments, deleteAssignment, addAssignment } = useAssignmentStore();
  const { user } = useAuthStore();
  const isSchool = user?.role === "school";
  const [search, setSearch] = useState("");
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const subjects = useMemo(() => {
    return Array.from(new Set(assignments.map((a) => a.subject).filter(Boolean))).slice(0, 8);
  }, [assignments]);

  const filtered = assignments.filter((a) => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.subject?.toLowerCase().includes(search.toLowerCase());
    const matchSubject = !activeSubject || a.subject === activeSubject;
    return matchSearch && matchSubject;
  });

  const statusColors: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    generating: "bg-blue-100 text-blue-700",
    failed: "bg-red-100 text-red-700",
    draft: "bg-gray-100 text-gray-600",
  };

  const handleDuplicate = (id: string) => {
    const orig = assignments.find((a) => a.id === id);
    if (!orig) return;
    addAssignment({ ...orig, id: generateId(), title: `${orig.title} (Copy)`, status: "draft", generatedPaper: undefined, jobId: undefined, assignedOn: new Date().toISOString() });
    setOpenMenu(null);
  };

  return (
    <div className="flex flex-col gap-3 pb-6">
      <TopBar title="Assignments" />

      <div className="flex items-center gap-3 px-1">
        <div className="w-3 h-3 rounded-full bg-[#4BC26D] border-4 border-[rgba(75,194,109,0.4)] shadow-lg flex-shrink-0" />
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#303030] letter-tight">Assignments</h1>
          <p className="text-xs sm:text-sm text-[rgba(94,94,94,0.55)] letter-tight">
            {isSchool ? "Manage and create assignments for your classes." : "View and download your question papers."}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 flex items-center gap-3">
        <Search size={16} className="text-[#A9A9A9] flex-shrink-0" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assignments..."
          className="bg-transparent text-sm font-medium text-[#A9A9A9] placeholder:text-[#A9A9A9] outline-none flex-1 letter-tight min-w-0" />
        {search && <button onClick={() => setSearch("")} className="text-xs text-[#A9A9A9] hover:text-[#303030]">Clear</button>}
      </div>

      {/* Subject filter chips */}
      {subjects.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setActiveSubject(null)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-semibold letter-tight transition-colors",
              !activeSubject ? "bg-[#303030] text-white" : "bg-white text-[#5E5E5E] hover:bg-gray-100")}>
            All
          </button>
          {subjects.map((s) => (
            <button key={s} onClick={() => setActiveSubject(activeSubject === s ? null : s)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-semibold letter-tight transition-colors",
                activeSubject === s ? "bg-[#FF5623] text-white" : "bg-white text-[#5E5E5E] hover:bg-gray-100")}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 sm:py-20 gap-6">
          <div className="w-44 h-44 sm:w-64 sm:h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
            <FileText size={56} className="text-gray-300 sm:hidden" />
            <FileText size={80} className="text-gray-300 hidden sm:block" />
          </div>
          <div className="text-center max-w-xs sm:max-w-md px-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#303030] letter-tight mb-2">
              {search || activeSubject ? "No matching assignments" : "No assignments yet"}
            </h2>
            <p className="text-sm sm:text-base text-[rgba(94,94,94,0.8)] letter-tight">
              {search || activeSubject ? "Try a different search or filter."
                : isSchool ? "Create your first assignment to start generating AI-powered question papers."
                : "Your teacher hasn't shared any papers yet."}
            </p>
          </div>
          {isSchool && !search && !activeSubject && (
            <Link href="/assignments/create"><Button size="md" className="gap-2"><Plus size={16} />Create Your First Assignment</Button></Link>
          )}
        </div>
      )}

      {/* Cards */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {filtered.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#303030] letter-tight leading-tight truncate">{assignment.title}</h3>
                    <p className="text-xs sm:text-sm text-[rgba(94,94,94,0.8)] letter-tight mt-0.5 truncate">{assignment.subject} • {assignment.className}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full hidden sm:inline", statusColors[assignment.status] || statusColors.draft)}>
                      {assignment.status}
                    </span>
                    <div className="relative">
                      <button onClick={() => setOpenMenu(openMenu === assignment.id ? null : assignment.id)}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                        <MoreVertical size={18} className="text-[#A9A9A9]" />
                      </button>
                      {openMenu === assignment.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                          <div className="absolute right-0 top-8 bg-white shadow-xl rounded-2xl p-2 z-50 min-w-[160px]">
                            {assignment.status === "completed" && assignment.generatedPaper && (
                              <Link href={`/assignments/${assignment.id}/output`}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-[#303030] letter-tight"
                                onClick={() => setOpenMenu(null)}>
                                <Eye size={15} /> View Paper
                              </Link>
                            )}
                            <button onClick={() => handleDuplicate(assignment.id)}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-[#303030] letter-tight w-full">
                              <Copy size={15} /> Duplicate
                            </button>
                            <button onClick={() => { deleteAssignment(assignment.id); setOpenMenu(null); }}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-[#FEF2F2] text-sm text-[#C53535] letter-tight w-full">
                              <Trash2 size={15} /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-[#303030] letter-tight">Assigned : {formatDate(assignment.assignedOn)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#303030] letter-tight">Due : {formatDate(assignment.dueDate)}</span>
                      <DueBadge dueDate={assignment.dueDate} />
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {assignment.status === "completed" && assignment.generatedPaper && (
                      <Link href={`/assignments/${assignment.id}/output`}>
                        <button className="px-3 py-1.5 border border-gray-200 rounded-full text-xs font-medium text-[#303030] hover:bg-gray-50 transition-colors letter-tight">
                          View Paper
                        </button>
                      </Link>
                    )}
                    {assignment.status === "generating" && (
                      <div className="flex items-center gap-1.5 text-blue-600 text-xs font-medium">
                        <Loader2 size={14} className="animate-spin" /> Generating...
                      </div>
                    )}
                    {assignment.status === "failed" && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-500 font-medium">Failed</span>
                        <button onClick={() => deleteAssignment(assignment.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-full text-xs font-semibold text-[#C53535] letter-tight transition-colors">
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isSchool && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-6 z-50">
          <Link href="/assignments/create">
            <button className="flex items-center gap-2 px-6 py-3 bg-[#181818] text-white rounded-full text-sm font-semibold letter-tight shadow-2xl hover:bg-[#2a2a2a] transition-colors whitespace-nowrap">
              <Plus size={18} /> Create Assignment
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
