"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid, FileText, BookOpen, Library, Settings,
  Users, BarChart2, X, Menu, LogOut, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssignmentStore } from "@/store/assignmentStore";
import { useAuthStore } from "@/store/authStore";

const schoolNavItems = [
  { href: "/home",        label: "Home",                 icon: LayoutGrid },
  { href: "/groups",      label: "My Groups",            icon: Users      },
  { href: "/assignments", label: "Assignments",          icon: FileText   },
  { href: "/toolkit",     label: "AI Teacher's Toolkit", icon: BookOpen   },
  { href: "/library",     label: "My Library",           icon: Library    },
];

const studentNavItems = [
  { href: "/home",        label: "Home",        icon: LayoutGrid },
  { href: "/groups",      label: "My Groups",   icon: Users      },
  { href: "/assignments", label: "Assignments", icon: FileText   },
  { href: "/library",     label: "My Library",  icon: Library    },
  { href: "/toolkit",     label: "AI Toolkit",  icon: BookOpen   },
];

const mobileTabsSchool = [
  { href: "/home",        label: "Home",        icon: LayoutGrid },
  { href: "/assignments", label: "Assignments", icon: FileText   },
  { href: "/library",     label: "Library",     icon: Library    },
  { href: "/toolkit",     label: "AI Toolkit",  icon: BookOpen   },
];
const mobileTabsStudent = [
  { href: "/home",        label: "Home",        icon: LayoutGrid },
  { href: "/assignments", label: "Assignments", icon: FileText   },
  { href: "/library",     label: "Library",     icon: Library    },
  { href: "/toolkit",     label: "AI Toolkit",  icon: BookOpen   },
];

export default function Sidebar() {
  const pathname   = usePathname();
  const router     = useRouter();
  const { assignments } = useAssignmentStore();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSchool   = user?.role === "school";
  const navItems   = isSchool ? schoolNavItems : studentNavItems;
  const mobileTabs = isSchool ? mobileTabsSchool : mobileTabsStudent;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    router.replace("/login");
  };

  // School name + location — always shown in user card (fallback to defaults)
  const schoolName = user?.schoolName || "Delhi Public School";
  const schoolLoc  = user?.location   || "Bokaro Steel City";

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col justify-between h-full">
      <div className="flex flex-col gap-5">

        {/* ── Logo ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-[12px] flex-shrink-0 overflow-hidden"
              style={{ background: "linear-gradient(145deg,#FF7A3D 0%,#C0392B 100%)" }}>
              <div className="w-full h-full flex items-center justify-center">
                <svg width="20" height="16" viewBox="0 0 22 18" fill="none">
                  <path d="M4 4L11 14L18 4" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <span className="text-[22px] font-bold text-[#1C1C1C] tracking-[-0.04em] leading-none">VedaAI</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full lg:hidden">
              <X size={18} className="text-[#303030]" />
            </button>
          )}
        </div>

        {/* ── Create Assignment CTA ── */}
        <Link
          href="/assignments/create"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-white text-sm font-semibold letter-tight transition-all"
          style={{
            background: "#1C1C1C",
            boxShadow: "0 0 0 1.5px #FF5623, 0 4px 20px rgba(255,86,35,0.2)",
          }}
        >
          <Sparkles size={15} />
          Create Assignment
        </Link>

        {/* ── Nav ── */}
        <nav className="flex flex-col gap-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            const isAssignments = href === "/assignments";
            return (
              <Link
                key={`${href}-${label}`}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all letter-tight",
                  active
                    ? "bg-[#F0F0F0] text-[#1C1C1C] font-semibold"
                    : "text-[#5E5E5E] hover:bg-gray-50 font-medium"
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.6} />
                <span className="flex-1 text-sm">{label}</span>
                {isAssignments && assignments.length > 0 && (
                  <span className="bg-[#FF5623] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center">
                    {assignments.length}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Bottom ── */}
      <div className="flex flex-col gap-0.5">
        {/* Settings */}
        {[{ href: "/analytics", label: "Analytics", icon: BarChart2 }, { href: "/settings", label: "Settings", icon: Settings }].map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all letter-tight",
                active ? "bg-[#F0F0F0] text-[#1C1C1C] font-semibold" : "text-[#5E5E5E] hover:bg-gray-50 font-medium"
              )}>
              <Icon size={18} strokeWidth={active ? 2.2 : 1.6} />
              <span className="text-sm">{label}</span>
            </Link>
          );
        })}

        {/* Logout */}
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all letter-tight font-medium w-full">
          <LogOut size={18} strokeWidth={1.6} />
          <span className="text-sm">Log out</span>
        </button>

        {/* ── User card — always shows school info like Figma ── */}
        <div className="mt-2 bg-[#F5F5F5] rounded-2xl p-3">
          <div className="flex items-center gap-2.5">
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt={user.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                {user?.avatar || "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1C1C1C] letter-tight truncate leading-tight">
                {schoolName}
              </p>
              <p className="text-xs text-[#8A8A8A] letter-tight truncate leading-tight">
                {schoolLoc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar — white ── */}
      <aside className="hidden lg:flex fixed left-3 top-3 bottom-3 w-[220px] bg-white rounded-2xl shadow-lg flex-col p-5 z-40 border border-gray-100">
        <SidebarContent />
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] flex-shrink-0 overflow-hidden"
              style={{ background: "linear-gradient(145deg,#FF7A3D 0%,#C0392B 100%)" }}>
              <div className="w-full h-full flex items-center justify-center">
                <svg width="14" height="11" viewBox="0 0 22 18" fill="none">
                  <path d="M4 4L11 14L18 4" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <span className="text-lg font-bold text-[#1C1C1C] tracking-[-0.04em]">VedaAI</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative w-9 h-9 bg-[#F6F6F6] rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF5623] rounded-full" />
            </button>
            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {user?.photoUrl
                ? <img src={user.photoUrl} alt={user?.name} className="w-full h-full object-cover" />
                : (user?.avatar || "?")}
            </div>
            <button onClick={() => setMobileOpen(true)} className="w-9 h-9 flex items-center justify-center">
              <Menu size={22} className="text-[#303030]" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-[260px] bg-white h-full p-5 shadow-2xl flex flex-col border-r border-gray-100">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Mobile bottom tab bar ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A1A] pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {mobileTabs.map(({ href, label, icon: Icon }, i) => {
            const active = isActive(href);
            return (
              <Link key={`${href}-${i}`} href={href}
                className={cn("flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[56px]",
                  active ? "text-white" : "text-white/40")}>
                {active ? (
                  <div className="bg-white/15 rounded-xl px-3 py-1.5 flex flex-col items-center gap-0.5">
                    <Icon size={20} strokeWidth={2.2} />
                    <span className="text-[9px] font-semibold">{label}</span>
                  </div>
                ) : (
                  <>
                    <Icon size={20} strokeWidth={1.5} />
                    <span className="text-[9px] font-medium">{label}</span>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
