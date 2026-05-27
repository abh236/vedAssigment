"use client";
import Link from "next/link";
import { Plus, FileText, BookOpen, Library, Users, TrendingUp, Clock, CheckCircle } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import { useAssignmentStore } from "@/store/assignmentStore";
import { useAuthStore } from "@/store/authStore";
import { formatDate } from "@/lib/utils";

export default function HomePage() {
  const { assignments, library } = useAssignmentStore();
  const { user } = useAuthStore();
  const isSchool = user?.role === "school";

  const completed  = assignments.filter((a) => a.status === "completed").length;
  const generating = assignments.filter((a) => a.status === "generating").length;
  const recent     = assignments.slice(0, 4);

  const quickLinks = isSchool
    ? [
        { href: "/assignments/create", label: "Create Assignment", icon: Plus,     color: "#FF5623", bg: "#FFF0EB" },
        { href: "/assignments",        label: "My Assignments",    icon: FileText,  color: "#3B82F6", bg: "#EFF6FF" },
        { href: "/toolkit",            label: "AI Toolkit",        icon: BookOpen,  color: "#A855F7", bg: "#FAF5FF" },
        { href: "/groups",             label: "My Groups",         icon: Users,     color: "#4BC26D", bg: "#F0FDF4" },
        { href: "/library",            label: "My Library",        icon: Library,   color: "#F59E0B", bg: "#FFFBEB" },
      ]
    : [
        { href: "/assignments",        label: "My Papers",         icon: FileText,  color: "#3B82F6", bg: "#EFF6FF" },
        { href: "/toolkit",            label: "AI Toolkit",        icon: BookOpen,  color: "#A855F7", bg: "#FAF5FF" },
        { href: "/library",            label: "My Library",        icon: Library,   color: "#F59E0B", bg: "#FFFBEB" },
      ];

  return (
    <div className="flex flex-col gap-4 pb-24">
      <TopBar title="Home" />

      {/* Greeting */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-3 h-3 rounded-full bg-[#4BC26D] border-4 border-[rgba(75,194,109,0.4)] flex-shrink-0" />
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#303030] letter-tight">
            Welcome back, {user?.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[rgba(94,94,94,0.55)] letter-tight">
            {isSchool ? "Here's what's happening with your assignments." : "Here's your learning overview."}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",      value: assignments.length, icon: FileText,     color: "#3B82F6", bg: "#EFF6FF" },
          { label: "Completed",  value: completed,          icon: CheckCircle,  color: "#4BC26D", bg: "#F0FDF4" },
          { label: "Generating", value: generating,         icon: Clock,        color: "#F59E0B", bg: "#FFFBEB" },
          { label: "In Library", value: library.length,     icon: Library,      color: "#A855F7", bg: "#FAF5FF" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#303030] letter-tight leading-none">{value}</p>
              <p className="text-xs text-[#A9A9A9] letter-tight mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-[#303030] letter-tight">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickLinks.map(({ href, label, icon: Icon, color, bg }) => (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:scale-105 transition-transform"
              style={{ backgroundColor: bg }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm">
                <Icon size={18} style={{ color }} />
              </div>
              <span className="text-xs font-semibold text-[#303030] letter-tight text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent assignments */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#303030] letter-tight">Recent Assignments</h2>
          <Link href="/assignments" className="text-xs text-[#FF5623] font-semibold letter-tight hover:underline">
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2">
            <TrendingUp size={32} className="text-gray-200" />
            <p className="text-sm text-[#A9A9A9] letter-tight">No assignments yet</p>
            {isSchool && (
              <Link href="/assignments/create"
                className="mt-2 px-4 py-2 bg-[#181818] text-white rounded-full text-xs font-semibold letter-tight hover:bg-[#2a2a2a] transition-colors">
                Create your first
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((a) => {
              const sc: Record<string, string> = { completed: "#4BC26D", generating: "#3B82F6", failed: "#EF4444", draft: "#A9A9A9" };
              return (
                <Link key={a.id} href={a.status === "completed" && a.generatedPaper ? `/assignments/${a.id}/output` : "/assignments"}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-[#F8F8F8] transition-colors">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sc[a.status] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#303030] letter-tight truncate">{a.title}</p>
                    <p className="text-xs text-[#A9A9A9] letter-tight">{a.subject} · {a.className}</p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize letter-tight"
                      style={{ backgroundColor: sc[a.status] + "22", color: sc[a.status] }}>
                      {a.status}
                    </span>
                    <span className="text-[10px] text-[#A9A9A9] letter-tight">{formatDate(a.assignedOn)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating create button — school only */}
      {isSchool && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50">
          <Link href="/assignments/create">
            <button className="flex items-center gap-2 px-5 py-3 bg-[#181818] text-white rounded-full text-sm font-semibold letter-tight shadow-2xl hover:bg-[#2a2a2a] transition-colors"
              style={{ boxShadow: "0 0 0 1.5px #FF5623, 0 8px 32px rgba(0,0,0,0.3)" }}>
              <Plus size={18} />
              <span className="hidden sm:inline">Create Assignment</span>
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
