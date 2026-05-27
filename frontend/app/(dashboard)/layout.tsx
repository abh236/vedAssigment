import Sidebar from "@/components/layout/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import CommandPalette from "@/components/CommandPalette";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-[#EEEEEE] to-[#DADADA] relative">
        <div className="hidden lg:block absolute bottom-0 right-0 w-[800px] h-[400px] bg-[rgba(76,76,76,0.4)] blur-[200px] pointer-events-none" />
        <Sidebar />
        <main className="lg:ml-[232px] lg:p-3 pt-[64px] pb-[72px] px-3 min-h-screen relative z-10">
          {children}
        </main>
        <CommandPalette />
      </div>
    </AuthGuard>
  );
}
