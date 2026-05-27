"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, Key, School, MapPin, Mail, Check, Eye, EyeOff,
  LogOut, Shield, Camera, Trash2, ExternalLink,
} from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import { useAuthStore } from "@/store/authStore";

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    schoolName: user?.schoolName || "",
    location: user?.location || "",
    className: user?.className || "",
    rollNumber: user?.rollNumber || "",
    openAiKey: "",
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [storedKeyHint, setStoredKeyHint] = useState("");
  const [storedGroqHint, setStoredGroqHint] = useState("");
  const [removingKey, setRemovingKey] = useState(false);
  const [removingGroq, setRemovingGroq] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [groqKeyInput, setGroqKeyInput] = useState("");

  const isSchool = user?.role === "school";

  // Load stored key hints from localStorage on mount
  useEffect(() => {
    const k = localStorage.getItem("veda-openai-key") || "";
    if (k) setStoredKeyHint(`${k.slice(0, 7)}...${k.slice(-4)}`);
    const g = localStorage.getItem("veda-groq-key") || "";
    if (g) setStoredGroqHint(`${g.slice(0, 8)}...${g.slice(-4)}`);
  }, []);

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhotoPreview(result);
      setPhotoBase64(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSave = async () => {
    const newAvatar = form.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
    const photoUrl = photoBase64 || user?.photoUrl;

    updateUser({
      name: form.name, email: form.email,
      schoolName: form.schoolName || undefined,
      location: form.location || undefined,
      className: form.className || undefined,
      rollNumber: form.rollNumber || undefined,
      avatar: newAvatar,
      photoUrl: photoUrl || undefined,
    });

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email, name: form.name,
          schoolName: form.schoolName || undefined,
          location: form.location || undefined,
          className: form.className || undefined,
          rollNumber: form.rollNumber || undefined,
          photoUrl: photoUrl || undefined,
        }),
      });
    } catch { /* ignore */ }

    if (form.openAiKey.trim()) {
      const key = form.openAiKey.trim();
      localStorage.setItem("veda-openai-key", key);
      setStoredKeyHint(`${key.slice(0, 7)}...${key.slice(-4)}`);
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/api-key`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user?.email, key }),
        });
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/openai-key`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key }),
        });
      } catch { /* ignore */ }
      setForm((f) => ({ ...f, openAiKey: "" }));
    }

    if (groqKeyInput.trim()) {
      const key = groqKeyInput.trim();
      localStorage.setItem("veda-groq-key", key);
      setStoredGroqHint(`${key.slice(0, 8)}...${key.slice(-4)}`);
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/groq-key`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key }),
        });
      } catch { /* ignore */ }
      setGroqKeyInput("");
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRemoveKey = async () => {
    setRemovingKey(true);
    localStorage.removeItem("veda-openai-key");
    setStoredKeyHint("");
    setForm((f) => ({ ...f, openAiKey: "" }));
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/api-key`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email, key: "" }),
      });
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/openai-key`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "" }),
      });
    } catch { /* ignore */ }
    setRemovingKey(false);
  };

  const handleRemoveGroq = async () => {
    setRemovingGroq(true);
    localStorage.removeItem("veda-groq-key");
    setStoredGroqHint("");
    setGroqKeyInput("");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/groq-key`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "" }),
      });
    } catch { /* ignore */ }
    setRemovingGroq(false);
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const inputCls = "flex-1 text-sm font-medium text-[#303030] placeholder:text-[#A9A9A9] outline-none bg-transparent letter-tight";
  const wrapCls = "flex items-center gap-3 border border-[#DADADA] rounded-full px-4 py-2.5 focus-within:border-[#303030] transition-colors bg-white";
  const labelCls = "text-sm font-bold text-[#303030] letter-tight";

  return (
    <div className="flex flex-col gap-3 pb-6">
      <TopBar title="Settings" />

      <div className="flex items-center gap-3 px-1">
        <div className="w-3 h-3 rounded-full bg-[#4BC26D] border-4 border-[rgba(75,194,109,0.4)]" />
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#303030] letter-tight">Settings</h1>
          <p className="text-xs sm:text-sm text-[rgba(94,94,94,0.55)] letter-tight">Manage your profile and preferences.</p>
        </div>
      </div>

      <div className="max-w-2xl flex flex-col gap-4">

        {/* Account type badge — only show for school/teacher */}
        {isSchool && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-orange-50 border border-orange-100">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-100">
            <School size={20} className="text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-bold letter-tight text-orange-700">School / Teacher Account</p>
            <p className="text-xs letter-tight text-orange-600">You can create and manage assignments</p>
          </div>
        </div>
        )}

        {/* Profile */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col gap-4">
          <h2 className="text-base font-bold text-[#303030] letter-tight">Profile</h2>

          {/* Avatar with photo upload */}
          <div className="flex items-center gap-4">
            <label htmlFor="settings-photo" className="cursor-pointer group relative">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0 border-4 border-white shadow-md">
                {photoPreview || user?.photoUrl ? (
                  <img src={photoPreview || user?.photoUrl || ""} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  form.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "?"
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                  <Camera size={18} className="text-white" />
                </div>
              </div>
            </label>
            <input id="settings-photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            <div>
              <p className="text-base font-bold text-[#303030] letter-tight">{form.name || "Your Name"}</p>
              <p className="text-sm text-[rgba(94,94,94,0.8)] letter-tight">{form.email || "your@email.com"}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {/* Common */}
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Full Name</label>
              <div className={wrapCls}>
                <User size={15} className="text-[#A9A9A9] flex-shrink-0" />
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" className={inputCls} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Email</label>
              <div className={wrapCls}>
                <Mail size={15} className="text-[#A9A9A9] flex-shrink-0" />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" className={inputCls} />
              </div>
            </div>

            {/* School-specific */}
            {isSchool && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>School Name</label>
                  <div className={wrapCls}>
                    <School size={15} className="text-[#A9A9A9] flex-shrink-0" />
                    <input value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} placeholder="e.g. Delhi Public School" className={inputCls} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Location</label>
                  <div className={wrapCls}>
                    <MapPin size={15} className="text-[#A9A9A9] flex-shrink-0" />
                    <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. New Delhi" className={inputCls} />
                  </div>
                </div>
              </>
            )}

            {/* Student-specific — school name and location only */}
            {!isSchool && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>School Name</label>
                  <div className={wrapCls}>
                    <School size={15} className="text-[#A9A9A9] flex-shrink-0" />
                    <input value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} placeholder="e.g. Delhi Public School" className={inputCls} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Location</label>
                  <div className={wrapCls}>
                    <MapPin size={15} className="text-[#A9A9A9] flex-shrink-0" />
                    <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Bokaro Steel City" className={inputCls} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* OpenAI Key — ALL users (school + student) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#303030] letter-tight">OpenAI API Key</h2>
              <p className="text-xs sm:text-sm text-[rgba(94,94,94,0.8)] letter-tight mt-0.5">
                Powers AI Toolkit and question generation.
              </p>
            </div>
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[#FF5623] font-semibold letter-tight hover:underline flex-shrink-0 mt-0.5">
              Get key <ExternalLink size={11} />
            </a>
          </div>

          {/* Currently saved key */}
          {storedKeyHint && (
            <div className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-green-800 letter-tight">Key saved</p>
                  <p className="text-xs text-green-700 font-mono letter-tight truncate">{storedKeyHint}</p>
                </div>
              </div>
              <button
                onClick={handleRemoveKey}
                disabled={removingKey}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-full text-xs font-semibold text-[#C53535] letter-tight transition-colors flex-shrink-0 disabled:opacity-50"
              >
                <Trash2 size={12} />
                {removingKey ? "Removing..." : "Remove"}
              </button>
            </div>
          )}

          {/* Quota error explanation */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex flex-col gap-1.5">
            <p className="text-xs font-bold text-amber-800 letter-tight">Why "quota exceeded"?</p>
            <p className="text-xs text-amber-700 letter-tight leading-relaxed">
              Your OpenAI account has run out of free credits or your paid plan limit is reached.
              Visit <a href="https://platform.openai.com/usage" target="_blank" rel="noopener noreferrer"
                className="underline font-semibold">platform.openai.com/usage</a> to check usage and add credits.
              Free accounts get $5 credit — after that you need a paid plan.
            </p>
          </div>

          {/* Add / update key */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{storedKeyHint ? "Replace key" : "Add key"}</label>
            <div className={wrapCls}>
              <Key size={15} className="text-[#A9A9A9] flex-shrink-0" />
              <input
                type={showKey ? "text" : "password"}
                value={form.openAiKey}
                onChange={(e) => setForm({ ...form, openAiKey: e.target.value })}
                placeholder="sk-..."
                className={`${inputCls} font-mono`}
              />
              <button type="button" onClick={() => setShowKey(!showKey)} className="text-[#A9A9A9] hover:text-[#303030] transition-colors">
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="bg-[#F8F8F8] border border-gray-200 rounded-2xl p-3 flex items-start gap-2">
            <Shield size={13} className="text-[#A9A9A9] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#5E5E5E] letter-tight">
              Stored in your browser and synced to your account. Never shared with third parties.
            </p>
          </div>
        </div>

        {/* Groq key — free alternative */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#303030] letter-tight">Groq API Key</h2>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">FREE</span>
              </div>
              <p className="text-xs sm:text-sm text-[rgba(94,94,94,0.8)] letter-tight mt-0.5">
                Use AI Toolkit for free — no credit card needed. Powered by Llama 3.
              </p>
            </div>
            <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-green-600 font-semibold letter-tight hover:underline flex-shrink-0 mt-0.5">
              Get free key <ExternalLink size={11} />
            </a>
          </div>

          {/* Steps */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-3 flex flex-col gap-1.5">
            <p className="text-xs font-bold text-green-800 letter-tight">How to get a free Groq key:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li className="text-xs text-green-700 letter-tight">Go to <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">console.groq.com</a></li>
              <li className="text-xs text-green-700 letter-tight">Sign up with Google or email (free)</li>
              <li className="text-xs text-green-700 letter-tight">Click "API Keys" → "Create API Key"</li>
              <li className="text-xs text-green-700 letter-tight">Copy the key (starts with gsk_) and paste below</li>
            </ol>
          </div>

          {/* Saved Groq key */}
          {storedGroqHint && (
            <div className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-green-800 letter-tight">Groq key saved</p>
                  <p className="text-xs text-green-700 font-mono letter-tight truncate">{storedGroqHint}</p>
                </div>
              </div>
              <button onClick={handleRemoveGroq} disabled={removingGroq}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-full text-xs font-semibold text-[#C53535] letter-tight transition-colors flex-shrink-0 disabled:opacity-50">
                <Trash2 size={12} />
                {removingGroq ? "Removing..." : "Remove"}
              </button>
            </div>
          )}

          {/* Add Groq key */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{storedGroqHint ? "Replace Groq key" : "Add Groq key"}</label>
            <div className={wrapCls}>
              <Key size={15} className="text-[#A9A9A9] flex-shrink-0" />
              <input
                type={showGroqKey ? "text" : "password"}
                value={groqKeyInput}
                onChange={(e) => setGroqKeyInput(e.target.value)}
                placeholder="gsk_..."
                className={`${inputCls} font-mono`}
              />
              <button type="button" onClick={() => setShowGroqKey(!showGroqKey)} className="text-[#A9A9A9] hover:text-[#303030] transition-colors">
                {showGroqKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave}
          className="flex items-center justify-center gap-2 w-full py-3 bg-[#181818] text-white rounded-full text-sm font-semibold letter-tight hover:bg-[#2a2a2a] transition-colors">
          {saved ? <><Check size={16} /> Saved!</> : "Save Changes"}
        </button>

        {/* Logout */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-[#303030] letter-tight">Account</h2>
            <p className="text-xs sm:text-sm text-[rgba(94,94,94,0.8)] letter-tight mt-0.5">
              Signed in as <span className="font-semibold text-[#303030]">{user?.email}</span>
            </p>
          </div>

          {!showLogoutConfirm ? (
            <button onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 px-5 py-2.5 border border-red-200 text-[#C53535] rounded-full text-sm font-semibold letter-tight hover:bg-red-50 transition-colors w-fit">
              <LogOut size={16} />
              Log out
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-[#303030] letter-tight">Are you sure you want to log out?</p>
              <div className="flex gap-3">
                <button onClick={handleLogout}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#C53535] text-white rounded-full text-sm font-semibold letter-tight hover:bg-red-700 transition-colors">
                  <LogOut size={15} /> Yes, log out
                </button>
                <button onClick={() => setShowLogoutConfirm(false)}
                  className="px-5 py-2.5 bg-[#F6F6F6] text-[#303030] rounded-full text-sm font-semibold letter-tight hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
