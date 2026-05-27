"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, FileText, Plus, BookOpen, Library, Users,
  BarChart2, Settings, Home, X, ArrowRight,
} from "lucide-react";
import { useAssignmentStore } from "@/store/assignmentStore";

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  keywords: string[];
}

export default function CommandPalette() {
  const router = useRouter();
  const { assignments } = useAssignmentStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const close = useCallback(() => { setOpen(false); setQuery(""); }, []);

  // Ctrl+K / Cmd+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [close]);

  const staticCommands: Command[] = [
    { id: "home",       label: "Go to Home",              icon: Home,     action: () => router.push("/home"),               keywords: ["home", "dashboard"] },
    { id: "create",     label: "Create Assignment",        icon: Plus,     action: () => router.push("/assignments/create"), keywords: ["create", "new", "assignment"] },
    { id: "assignments",label: "View Assignments",         icon: FileText, action: () => router.push("/assignments"),        keywords: ["assignments", "list"] },
    { id: "toolkit",    label: "AI Teacher's Toolkit",     icon: BookOpen, action: () => router.push("/toolkit"),            keywords: ["toolkit", "ai", "tools"] },
    { id: "library",    label: "My Library",               icon: Library,  action: () => router.push("/library"),            keywords: ["library", "saved"] },
    { id: "groups",     label: "My Groups",                icon: Users,    action: () => router.push("/groups"),             keywords: ["groups", "classes"] },
    { id: "analytics",  label: "Analytics",                icon: BarChart2,action: () => router.push("/analytics"),         keywords: ["analytics", "stats"] },
    { id: "settings",   label: "Settings",                 icon: Settings, action: () => router.push("/settings"),          keywords: ["settings", "profile"] },
  ];

  // Dynamic: recent assignments
  const assignmentCommands: Command[] = assignments
    .filter((a) => a.status === "completed" && a.generatedPaper)
    .slice(0, 5)
    .map((a) => ({
      id: `a-${a.id}`,
      label: a.title,
      description: `${a.subject} · ${a.className}`,
      icon: FileText,
      action: () => router.push(`/assignments/${a.id}/output`),
      keywords: [a.title.toLowerCase(), a.subject?.toLowerCase() || ""],
    }));

  const allCommands = [...staticCommands, ...assignmentCommands];

  const filtered = query.trim()
    ? allCommands.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.keywords.some((k) => k.includes(query.toLowerCase()))
      )
    : allCommands;

  const run = (cmd: Command) => { cmd.action(); close(); };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search size={18} className="text-[#A9A9A9] flex-shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, assignments..."
            className="flex-1 text-sm font-medium text-[#303030] placeholder:text-[#A9A9A9] outline-none bg-transparent letter-tight"
          />
          <div className="flex items-center gap-1">
            <kbd className="text-[10px] bg-gray-100 text-[#A9A9A9] px-1.5 py-0.5 rounded font-mono">ESC</kbd>
            <button onClick={close} className="p-1 hover:bg-gray-100 rounded-full">
              <X size={14} className="text-[#A9A9A9]" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-[#A9A9A9] text-center py-8 letter-tight">No results for "{query}"</p>
          ) : (
            <>
              {query === "" && (
                <p className="text-[10px] font-bold text-[#A9A9A9] uppercase tracking-wider px-4 py-1.5 letter-tight">
                  Navigation
                </p>
              )}
              {filtered.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <button key={cmd.id} onClick={() => run(cmd)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F8F8F8] transition-colors text-left group">
                    <div className="w-8 h-8 rounded-lg bg-[#F0F0F0] group-hover:bg-[#E8E8E8] flex items-center justify-center flex-shrink-0 transition-colors">
                      <Icon size={15} className="text-[#303030]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#303030] letter-tight truncate">{cmd.label}</p>
                      {cmd.description && (
                        <p className="text-xs text-[#A9A9A9] letter-tight truncate">{cmd.description}</p>
                      )}
                    </div>
                    <ArrowRight size={14} className="text-[#A9A9A9] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-gray-100 bg-[#FAFAFA]">
          <span className="text-[10px] text-[#A9A9A9] letter-tight flex items-center gap-1">
            <kbd className="bg-gray-200 px-1 py-0.5 rounded text-[9px] font-mono">↑↓</kbd> navigate
          </span>
          <span className="text-[10px] text-[#A9A9A9] letter-tight flex items-center gap-1">
            <kbd className="bg-gray-200 px-1 py-0.5 rounded text-[9px] font-mono">↵</kbd> select
          </span>
          <span className="text-[10px] text-[#A9A9A9] letter-tight ml-auto flex items-center gap-1">
            <kbd className="bg-gray-200 px-1 py-0.5 rounded text-[9px] font-mono">⌘K</kbd> toggle
          </span>
        </div>
      </div>
    </div>
  );
}
