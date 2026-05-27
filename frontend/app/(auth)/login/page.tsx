"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed."); setLoading(false); return; }
      login(data.user);
      router.replace("/home");
    } catch {
      setError("Cannot connect to server. Make sure the backend is running.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEEEEE] to-[#DADADA] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-[14px] overflow-hidden flex-shrink-0"
            style={{ background: "linear-gradient(145deg, #FF7A3D 0%, #C0392B 100%)" }}>
            <div className="w-full h-full flex items-center justify-center">
              <svg width="26" height="21" viewBox="0 0 22 18" fill="none">
                <path d="M4 4L11 14L18 4" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <span className="text-3xl font-bold text-[#303030] tracking-[-0.06em]">VedaAI</span>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#303030] letter-tight">Welcome back</h1>
            <p className="text-sm text-[rgba(94,94,94,0.8)] letter-tight mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-[#303030] letter-tight">Email</label>
              <div className="flex items-center gap-3 border border-[#DADADA] rounded-full px-4 py-3 focus-within:border-[#303030] transition-colors">
                <Mail size={16} className="text-[#A9A9A9] flex-shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 text-sm font-medium text-[#303030] placeholder:text-[#A9A9A9] outline-none bg-transparent letter-tight"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-[#303030] letter-tight">Password</label>
              <div className="flex items-center gap-3 border border-[#DADADA] rounded-full px-4 py-3 focus-within:border-[#303030] transition-colors">
                <Lock size={16} className="text-[#A9A9A9] flex-shrink-0" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 text-sm font-medium text-[#303030] placeholder:text-[#A9A9A9] outline-none bg-transparent letter-tight"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="text-[#A9A9A9] hover:text-[#303030] transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                <p className="text-sm text-red-600 letter-tight">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#181818] text-white rounded-full text-sm font-semibold letter-tight hover:bg-[#2a2a2a] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Sign In"}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-[rgba(94,94,94,0.8)] letter-tight">
              Don't have an account?{" "}
              <Link href="/register" className="text-[#303030] font-semibold hover:underline">Sign up</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[rgba(94,94,94,0.5)] letter-tight mt-6">
          AI-powered assessment creation for educators
        </p>
      </div>
    </div>
  );
}
