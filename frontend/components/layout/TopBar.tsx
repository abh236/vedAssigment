"use client";
import { useState } from "react";
import { ArrowLeft, Bell, X, CheckCheck, Command } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useAssignmentStore } from "@/store/assignmentStore";
import { formatDate } from "@/lib/utils";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
}

export default function TopBar({ title, showBack }: TopBarProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { assignments } = useAssignmentStore();
  const [showNotifs, setShowNotifs] = useState(false);

  const notifications = assignments
    .filter((a) => a.status === "completed" || a.status === "failed")
    .slice(0, 8)
    .map((a) => ({
      id: a.id,
      title: a.status === "completed" ? `"${a.title}" is ready` : `"${a.title}" failed`,
      sub: a.status === "completed" ? `${a.subject} · ${a.className}` : "Generation failed — try again",
      time: formatDate(a.assignedOn),
      type: a.status,
    }));

  const unread = notifications.length;

  // Trigger command palette
  const openPalette = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl mb-3 relative">
      {showBack && (
        <button onClick={() => router.back()}
          className="w-9 h-9 bg-white rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0">
          <ArrowLeft size={18} className="text-[#303030]" />
        </button>
      )}

      <span className="flex-1 text-sm sm:text-base font-semibold text-[#A9A9A9] letter-tight truncate">
        {title || "Dashboard"}
      </span>

      {/* ⌘K command palette trigger */}
      <button onClick={openPalette}
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F6F6] hover:bg-gray-200 rounded-full transition-colors">
        <Command size={13} className="text-[#A9A9A9]" />
        <span className="text-xs text-[#A9A9A9] font-medium letter-tight">Search</span>
        <kbd className="text-[9px] bg-gray-200 text-[#A9A9A9] px-1 py-0.5 rounded font-mono ml-1">⌘K</kbd>
      </button>

      {/* Bell */}
      <button onClick={() => setShowNotifs(!showNotifs)}
        className="relative w-9 h-9 bg-[#F6F6F6] rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
        <Bell size={18} className="text-[#303030]" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FF5623] rounded-full flex items-center justify-center text-white text-[9px] font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* User avatar */}
      <div className="hidden sm:flex items-center gap-2 px-2 py-1.5 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => router.push("/settings")}>
        {user?.photoUrl ? (
          <img src={user.photoUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.avatar || "?"}
          </div>
        )}
        <span className="text-sm font-semibold text-[#303030] letter-tight hidden md:block">{user?.name || "Guest"}</span>
        <svg width="10" height="7" viewBox="0 0 12 8" fill="none" className="hidden md:block">
          <path d="M1 1L6 6L11 1" stroke="#303030" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Notifications panel */}
      {showNotifs && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
          <div className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-bold text-[#303030] letter-tight">Notifications</span>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <span className="text-xs bg-[#FF5623] text-white px-2 py-0.5 rounded-full font-bold">{unread}</span>
                )}
                <button onClick={() => setShowNotifs(false)} className="p-1 hover:bg-gray-100 rounded-full">
                  <X size={14} className="text-[#A9A9A9]" />
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <CheckCheck size={32} className="text-gray-200" />
                <p className="text-sm text-[#A9A9A9] letter-tight">No notifications yet</p>
                <p className="text-xs text-[#A9A9A9] letter-tight">Generate an assignment to see updates here</p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id}
                    onClick={() => { setShowNotifs(false); router.push(n.type === "completed" ? `/assignments/${n.id}/output` : "/assignments"); }}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === "completed" ? "bg-[#4BC26D]" : "bg-red-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#303030] letter-tight truncate">{n.title}</p>
                      <p className="text-xs text-[#A9A9A9] letter-tight truncate">{n.sub}</p>
                      <p className="text-xs text-[#A9A9A9] letter-tight mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
