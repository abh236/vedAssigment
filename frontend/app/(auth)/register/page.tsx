"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, Camera } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ name:"", email:"", password:"", confirmPassword:"" });
  const [photoPreview, setPhotoPreview] = useState<string|null>(null);
  const [photoBase64, setPhotoBase64] = useState<string|null>(null);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handlePhoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const r = ev.target?.result as string; setPhotoPreview(r); setPhotoBase64(r); };
    reader.readAsDataURL(file);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) { setError("Please fill in all required fields."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), password: form.password,
          role: "student", photoUrl: photoBase64||undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed."); setLoading(false); return; }
      login(data.user);
      router.replace("/home");
    } catch { setError("Cannot connect to server. Make sure the backend is running."); setLoading(false); }
  };

  const ic = "flex-1 text-sm font-medium text-[#303030] placeholder:text-[#A9A9A9] outline-none bg-transparent letter-tight";
  const wc = "flex items-center gap-3 border border-[#DADADA] rounded-full px-4 py-3 focus-within:border-[#303030] transition-colors";
  const lc = "text-sm font-bold text-[#303030] letter-tight";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEEEEE] to-[#DADADA] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-[14px] overflow-hidden flex-shrink-0" style={{ background:"linear-gradient(145deg,#FF7A3D 0%,#C0392B 100%)" }}>
            <div className="w-full h-full flex items-center justify-center">
              <svg width="26" height="21" viewBox="0 0 22 18" fill="none"><path d="M4 4L11 14L18 4" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
          <span className="text-3xl font-bold text-[#303030] tracking-[-0.06em]">VedaAI</span>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-5">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#303030] letter-tight">Create account</h1>
            <p className="text-sm text-[rgba(94,94,94,0.8)] letter-tight mt-1">Join VedaAI today</p>
          </div>

          {/* Profile photo */}
          <div className="flex flex-col items-center gap-2">
            <label htmlFor="photo-upload" className="cursor-pointer group">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center overflow-hidden relative border-4 border-white shadow-md">
                {photoPreview ? <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" /> : (
                  <span className="text-white text-2xl font-bold">
                    {form.name ? form.name.split(" ").map((w)=>w[0]).join("").toUpperCase().slice(0,2) : "?"}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={20} className="text-white" />
                </div>
              </div>
            </label>
            <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <p className="text-xs text-[#A9A9A9] letter-tight">Click to add profile photo</p>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={lc}>Full Name *</label>
              <div className={wc}><User size={15} className="text-[#A9A9A9] flex-shrink-0" /><input value={form.name} onChange={setField("name")} placeholder="e.g. Rahul Kumar" className={ic} /></div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={lc}>Email *</label>
              <div className={wc}><Mail size={15} className="text-[#A9A9A9] flex-shrink-0" /><input type="email" value={form.email} onChange={setField("email")} placeholder="your@email.com" className={ic} autoComplete="email" /></div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={lc}>Password *</label>
              <div className={wc}>
                <Lock size={15} className="text-[#A9A9A9] flex-shrink-0" />
                <input type={showPass?"text":"password"} value={form.password} onChange={setField("password")} placeholder="Min. 6 characters" className={ic} autoComplete="new-password" />
                <button type="button" onClick={()=>setShowPass(!showPass)} className="text-[#A9A9A9] hover:text-[#303030] transition-colors">
                  {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={lc}>Confirm Password *</label>
              <div className={wc}><Lock size={15} className="text-[#A9A9A9] flex-shrink-0" /><input type="password" value={form.confirmPassword} onChange={setField("confirmPassword")} placeholder="Repeat password" className={ic} autoComplete="new-password" /></div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3"><p className="text-sm text-red-600 letter-tight">{error}</p></div>}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#181818] text-white rounded-full text-sm font-semibold letter-tight hover:bg-[#2a2a2a] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : "Create Account"}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-[rgba(94,94,94,0.8)] letter-tight">
              Already have an account?{" "}
              <Link href="/login" className="text-[#303030] font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
