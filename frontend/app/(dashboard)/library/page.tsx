"use client";
import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Search, Tag, Trash2, Eye, Download, X, Plus,
  FileText, Link2, BookMarked, Image, File, Sparkles, Upload,
} from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import { useAssignmentStore, StudyMaterial, MaterialType } from "@/store/assignmentStore";
import { formatDate, generateId } from "@/lib/utils";

const MATERIAL_COLORS = ["#FF5623","#3B82F6","#4BC26D","#A855F7","#F59E0B","#14B8A6","#EC4899","#6366F1"];

const TYPE_CONFIG: Record<MaterialType, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  pdf:   { icon: FileText,   label: "PDF",   color: "#EF4444", bg: "#FEF2F2" },
  note:  { icon: BookMarked, label: "Note",  color: "#3B82F6", bg: "#EFF6FF" },
  book:  { icon: BookOpen,   label: "Book",  color: "#A855F7", bg: "#FAF5FF" },
  link:  { icon: Link2,      label: "Link",  color: "#14B8A6", bg: "#F0FDFA" },
  image: { icon: Image,      label: "Image", color: "#F59E0B", bg: "#FFFBEB" },
  other: { icon: File,       label: "Other", color: "#6366F1", bg: "#EEF2FF" },
};

function AddMaterialModal({ onClose, onAdd }: { onClose: () => void; onAdd: (m: StudyMaterial) => void }) {
  const [form, setForm] = useState({ title: "", description: "", subject: "", type: "pdf" as MaterialType, url: "", color: MATERIAL_COLORS[0] });
  const [file, setFile] = useState<{ name: string; content: string; size: number } | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { setError("File too large. Max 10MB."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFile({ name: f.name, content: ev.target?.result as string, size: f.size });
      if (!form.title) setForm((p) => ({ ...p, title: f.name.replace(/\.[^.]+$/, "") }));
      const ext = f.name.split(".").pop()?.toLowerCase();
      if (ext === "pdf") setForm((p) => ({ ...p, type: "pdf" }));
      else if (["jpg","jpeg","png","gif","webp"].includes(ext || "")) setForm((p) => ({ ...p, type: "image" }));
    };
    reader.readAsDataURL(f);
  }, [form.title]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const handleSubmit = () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (form.type === "link" && !form.url.trim()) { setError("URL is required for links."); return; }
    if (form.type !== "link" && !file) { setError("Please upload a file."); return; }
    onAdd({
      id: generateId(), title: form.title.trim(), description: form.description.trim(),
      type: form.type, subject: form.subject.trim(), tags,
      fileContent: file?.content, fileName: file?.name, fileSize: file?.size,
      url: form.url.trim() || undefined, addedAt: new Date().toISOString(), color: form.color,
    });
    onClose();
  };

  const ic = "flex-1 text-sm font-medium text-[#303030] placeholder:text-[#A9A9A9] outline-none bg-transparent letter-tight";
  const wc = "flex items-center gap-3 border border-[#DADADA] rounded-full px-4 py-2.5 focus-within:border-[#303030] transition-colors bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-[#303030] letter-tight">Add to Library</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={18} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {/* Type selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-[#303030] letter-tight">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TYPE_CONFIG) as MaterialType[]).map((t) => {
                const { icon: Icon, label, color, bg } = TYPE_CONFIG[t];
                return (
                  <button key={t} type="button" onClick={() => setForm((p) => ({ ...p, type: t }))}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${form.type === t ? "border-[#303030]" : "border-transparent bg-[#F8F8F8]"}`}
                    style={form.type === t ? { backgroundColor: bg, borderColor: color } : {}}>
                    <Icon size={18} style={{ color }} />
                    <span className="text-xs font-semibold letter-tight" style={{ color }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* File upload (not for links) */}
          {form.type !== "link" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-[#303030] letter-tight">File</label>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-[#DADADA] rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-[#303030] transition-colors">
                {file ? (
                  <>
                    <FileText size={24} className="text-[#FF5623]" />
                    <p className="text-sm font-medium text-[#303030] letter-tight truncate max-w-full">{file.name}</p>
                    <p className="text-xs text-[#A9A9A9]">{(file.size / 1024).toFixed(0)} KB</p>
                  </>
                ) : (
                  <>
                    <Upload size={24} className="text-[#A9A9A9]" />
                    <p className="text-sm text-[#A9A9A9] letter-tight">Click to upload file</p>
                    <p className="text-xs text-[#A9A9A9]">PDF, TXT, Images up to 10MB</p>
                  </>
                )}
              </button>
              <input ref={fileRef} type="file" className="hidden"
                accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                onChange={handleFile} />
            </div>
          )}

          {/* URL for links */}
          {form.type === "link" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-[#303030] letter-tight">URL</label>
              <div className={wc}><Link2 size={15} className="text-[#A9A9A9]" /><input value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://..." className={ic} /></div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-[#303030] letter-tight">Title *</label>
            <div className={wc}><input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. NCERT Physics Chapter 5" className={ic} /></div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-[#303030] letter-tight">Subject</label>
            <div className={wc}><input value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} placeholder="e.g. Physics" className={ic} /></div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-[#303030] letter-tight">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Brief description..." rows={2}
              className="border border-[#DADADA] rounded-2xl px-4 py-2.5 text-sm text-[#303030] placeholder:text-[#A9A9A9] outline-none focus:border-[#303030] resize-none letter-tight" />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-[#303030] letter-tight">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-1">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 bg-[#F0F0F0] text-[#303030] text-xs font-medium px-2.5 py-1 rounded-full">
                  {t}<button onClick={() => setTags(tags.filter((x) => x !== t))}><X size={10} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <div className={`${wc} flex-1`}><Tag size={14} className="text-[#A9A9A9]" /><input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Add tag..." className={ic} /></div>
              <button type="button" onClick={addTag} className="px-3 py-2 bg-[#F0F0F0] rounded-full text-xs font-semibold text-[#303030] hover:bg-gray-200 transition-colors">Add</button>
            </div>
          </div>

          {/* Color */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-[#303030] letter-tight">Color</label>
            <div className="flex gap-2 flex-wrap">
              {MATERIAL_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm((p) => ({ ...p, color: c }))}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c, outline: form.color === c ? `3px solid ${c}` : "none", outlineOffset: 2 }} />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500 letter-tight">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 bg-[#F6F6F6] text-[#303030] rounded-full text-sm font-semibold letter-tight hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={handleSubmit} className="flex-1 py-2.5 bg-[#181818] text-white rounded-full text-sm font-semibold letter-tight hover:bg-[#2a2a2a] transition-colors">Add to Library</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const router = useRouter();
  const { library, removeFromLibrary, updateLibraryTags, materials, addMaterial, removeMaterial, updateMaterialTags } = useAssignmentStore();
  const [tab, setTab] = useState<"papers" | "materials">("materials");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  const filteredPapers = library.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.subject.toLowerCase().includes(search.toLowerCase()) ||
    l.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredMaterials = materials.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.subject.toLowerCase().includes(search.toLowerCase()) ||
    m.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDownloadPaper = async (item: typeof library[0]) => {
    const el = document.getElementById(`paper-preview-${item.id}`);
    if (!el) return;
    const html2pdf = (await import("html2pdf.js")).default;
    html2pdf().set({ margin: [10,10,10,10], filename: `${item.title.replace(/\s+/g,"_")}.pdf`, html2canvas: { scale: 2 }, jsPDF: { unit:"mm", format:"a4", orientation:"portrait" } }).from(el).save();
  };

  const handleOpenMaterial = (m: StudyMaterial) => {
    if (m.type === "link" && m.url) { window.open(m.url, "_blank"); return; }
    if (m.fileContent) {
      const a = document.createElement("a");
      a.href = m.fileContent;
      a.download = m.fileName || m.title;
      a.click();
    }
  };

  return (
    <div className="flex flex-col gap-3 pb-24">
      <TopBar title="My Library" />

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#4BC26D] border-4 border-[rgba(75,194,109,0.4)]" />
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#303030] letter-tight">My Library</h1>
            <p className="text-xs sm:text-sm text-[rgba(94,94,94,0.55)] letter-tight">Books, notes, PDFs and saved question papers.</p>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#181818] text-white rounded-full text-sm font-semibold letter-tight hover:bg-[#2a2a2a] transition-colors">
          <Plus size={15} /> Add Material
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-2xl p-1 gap-1">
        {([["materials", "Study Materials", materials.length], ["papers", "Question Papers", library.length]] as const).map(([key, label, count]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold letter-tight transition-all ${tab === key ? "bg-[#1A1A1A] text-white shadow-sm" : "text-[#5E5E5E] hover:bg-gray-50"}`}>
            {label}
            {count > 0 && <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tab === key ? "bg-white/20 text-white" : "bg-[#F0F0F0] text-[#5E5E5E]"}`}>{count}</span>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl px-4 py-2.5 flex items-center gap-3">
        <Search size={16} className="text-[#A9A9A9] flex-shrink-0" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, subject or tag..."
          className="bg-transparent text-sm font-medium text-[#303030] placeholder:text-[#A9A9A9] outline-none flex-1 letter-tight" />
        {search && <button onClick={() => setSearch("")} className="text-xs text-[#A9A9A9] hover:text-[#303030]">Clear</button>}
      </div>

      {/* ── STUDY MATERIALS TAB ── */}
      {tab === "materials" && (
        <>
          {filteredMaterials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-5">
              <div className="w-48 h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <BookOpen size={64} className="text-gray-300" />
              </div>
              <div className="text-center max-w-sm">
                <h2 className="text-lg font-bold text-[#303030] letter-tight mb-2">No materials yet</h2>
                <p className="text-sm text-[rgba(94,94,94,0.8)] letter-tight">Add books, notes, PDFs, links and other study resources here.</p>
              </div>
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[#181818] text-white rounded-full text-sm font-semibold letter-tight hover:bg-[#2a2a2a] transition-colors">
                <Plus size={16} /> Add Your First Material
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map((m) => {
                const { icon: Icon, label, color, bg } = TYPE_CONFIG[m.type];
                return (
                  <div key={m.id} className="bg-white rounded-2xl p-5 flex flex-col gap-3 group">
                    {/* Color bar */}
                    <div className="h-1.5 rounded-full" style={{ backgroundColor: m.color }} />

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
                          <Icon size={18} style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-[#303030] letter-tight truncate">{m.title}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full letter-tight" style={{ backgroundColor: bg, color }}>{label}</span>
                            {m.subject && <span className="text-[10px] text-[#A9A9A9] letter-tight truncate">{m.subject}</span>}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => removeMaterial(m.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                        <Trash2 size={14} className="text-[#C53535]" />
                      </button>
                    </div>

                    {m.description && <p className="text-xs text-[#5E5E5E] letter-tight leading-relaxed line-clamp-2">{m.description}</p>}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {m.tags.map((t) => (
                        <span key={t} className="flex items-center gap-0.5 bg-[#F0F0F0] text-[#303030] text-[10px] font-medium px-2 py-0.5 rounded-full letter-tight">
                          {t}<button onClick={() => updateMaterialTags(m.id, m.tags.filter((x) => x !== t))}><X size={8} /></button>
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <p className="text-[10px] text-[#A9A9A9] letter-tight">{formatDate(m.addedAt)}</p>
                      <button onClick={() => handleOpenMaterial(m)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#2a2a2a] rounded-full text-xs font-semibold text-white letter-tight transition-colors">
                        {m.type === "link" ? <><Link2 size={12} /> Open</> : <><Download size={12} /> Download</>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── QUESTION PAPERS TAB ── */}
      {tab === "papers" && (
        <>
          {filteredPapers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-5">
              <div className="w-48 h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <Sparkles size={64} className="text-gray-300" />
              </div>
              <div className="text-center max-w-sm">
                <h2 className="text-lg font-bold text-[#303030] letter-tight mb-2">No saved papers yet</h2>
                <p className="text-sm text-[rgba(94,94,94,0.8)] letter-tight">Generate a question paper and click "Save to Library" on the output page.</p>
              </div>
              <button onClick={() => router.push("/assignments/create")}
                className="flex items-center gap-2 px-6 py-3 bg-[#181818] text-white rounded-full text-sm font-semibold letter-tight hover:bg-[#2a2a2a] transition-colors">
                <Plus size={16} /> Create Assignment
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredPapers.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-[#303030] letter-tight truncate">{item.title}</h3>
                      <p className="text-xs text-[rgba(94,94,94,0.8)] letter-tight mt-0.5">{item.subject} · {item.className}</p>
                    </div>
                    <button onClick={() => removeFromLibrary(item.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                      <Trash2 size={14} className="text-[#C53535]" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {[["Questions", item.paper.sections.reduce((s,sec)=>s+sec.questions.length,0)], ["Marks", item.paper.totalMarks], ["Time", `${item.paper.timeAllowed}m`]].map(([l,v]) => (
                      <div key={String(l)} className="bg-[#F6F6F6] rounded-xl px-3 py-1.5 text-center flex-1">
                        <p className="text-[10px] text-[#A9A9A9] letter-tight">{l}</p>
                        <p className="text-sm font-bold text-[#303030] letter-tight">{v}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((t) => (
                      <span key={t} className="flex items-center gap-0.5 bg-[#F0F0F0] text-[#303030] text-[10px] font-medium px-2 py-0.5 rounded-full letter-tight">
                        {t}<button onClick={() => updateLibraryTags(item.id, item.tags.filter((x)=>x!==t))}><X size={8}/></button>
                      </span>
                    ))}
                    {editingTags === item.id ? (
                      <input autoFocus value={tagInput} onChange={(e)=>setTagInput(e.target.value)}
                        onKeyDown={(e)=>{ if(e.key==="Enter"){const t=tagInput.trim();if(t&&!item.tags.includes(t))updateLibraryTags(item.id,[...item.tags,t]);setTagInput("");} if(e.key==="Escape")setEditingTags(null); }}
                        onBlur={()=>{const t=tagInput.trim();if(t&&!item.tags.includes(t))updateLibraryTags(item.id,[...item.tags,t]);setTagInput("");setEditingTags(null);}}
                        placeholder="Add tag..." className="text-[10px] border border-[#DADADA] rounded-full px-2 py-0.5 outline-none w-20 letter-tight" />
                    ) : (
                      <button onClick={()=>{setEditingTags(item.id);setTagInput("");}}
                        className="flex items-center gap-0.5 border border-dashed border-[#DADADA] text-[#A9A9A9] text-[10px] px-2 py-0.5 rounded-full hover:border-[#303030] transition-colors letter-tight">
                        <Tag size={8}/> Add tag
                      </button>
                    )}
                  </div>

                  <p className="text-[10px] text-[#A9A9A9] letter-tight">Saved {formatDate(item.savedAt)}</p>

                  <div className="flex gap-2">
                    <button onClick={()=>router.push(`/assignments/${item.assignmentId}/output`)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#F6F6F6] hover:bg-[#EBEBEB] rounded-full text-xs font-semibold text-[#303030] letter-tight transition-colors">
                      <Eye size={13}/> View
                    </button>
                    <button onClick={()=>handleDownloadPaper(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#181818] hover:bg-[#2a2a2a] rounded-full text-xs font-semibold text-white letter-tight transition-colors">
                      <Download size={13}/> Download
                    </button>
                  </div>

                  <div id={`paper-preview-${item.id}`} className="hidden">
                    <div style={{fontFamily:"serif",padding:20}}>
                      <h1 style={{textAlign:"center"}}>{item.paper.schoolName}</h1>
                      <p style={{textAlign:"center"}}>{item.paper.subject} | {item.paper.className}</p>
                      <p>Time: {item.paper.timeAllowed} min | Max Marks: {item.paper.totalMarks}</p>
                      {item.paper.sections.map((sec,si)=>(
                        <div key={si}><h3>Section {String.fromCharCode(65+si)} — {sec.questionType}</h3>
                          {sec.questions.map((q,qi)=><p key={qi}>{qi+1}. {q.text} [{q.marks}M]</p>)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showAddModal && <AddMaterialModal onClose={() => setShowAddModal(false)} onAdd={addMaterial} />}
    </div>
  );
}
