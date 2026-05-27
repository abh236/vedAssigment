"use client";
import { useState } from "react";
import { Users, Plus, Trash2, Edit2, X, Check } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import { useAssignmentStore, Group } from "@/store/assignmentStore";
import { formatDate } from "@/lib/utils";

const GROUP_COLORS = [
  "#FF5623", "#4BC26D", "#3B82F6", "#A855F7", "#F59E0B", "#EC4899", "#14B8A6", "#6366F1",
];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

const SUBJECTS = ["Mathematics", "Science", "English", "History", "Geography", "Physics", "Chemistry", "Biology", "Computer Science", "Economics"];

export default function GroupsPage() {
  const { groups, addGroup, updateGroup, deleteGroup } = useAssignmentStore();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", subject: "", studentCount: 30, color: GROUP_COLORS[0] });
  const [editForm, setEditForm] = useState<Partial<Group>>({});

  const handleCreate = () => {
    if (!form.name.trim()) return;
    addGroup({
      id: generateId(),
      name: form.name.trim(),
      subject: form.subject || "General",
      studentCount: form.studentCount,
      createdAt: new Date().toISOString(),
      color: form.color,
    });
    setForm({ name: "", subject: "", studentCount: 30, color: GROUP_COLORS[0] });
    setShowModal(false);
  };

  const startEdit = (g: Group) => {
    setEditingId(g.id);
    setEditForm({ name: g.name, subject: g.subject, studentCount: g.studentCount });
  };

  const saveEdit = (id: string) => {
    updateGroup(id, editForm);
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-3 pb-24">
      <TopBar title="My Groups" />

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#4BC26D] border-4 border-[rgba(75,194,109,0.4)]" />
          <div>
            <h1 className="text-xl font-bold text-[#303030] letter-tight">My Groups</h1>
            <p className="text-sm text-[rgba(94,94,94,0.55)] letter-tight">Manage your classes and student groups.</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#181818] text-white rounded-full text-sm font-medium letter-tight hover:bg-[#2a2a2a] transition-colors"
        >
          <Plus size={16} /> New Group
        </button>
      </div>

      {/* Empty state */}
      {groups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <div className="w-56 h-56 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
            <Users size={72} className="text-gray-300" />
          </div>
          <div className="text-center max-w-sm">
            <h2 className="text-xl font-bold text-[#303030] letter-tight mb-2">No groups yet</h2>
            <p className="text-base text-[rgba(94,94,94,0.8)] letter-tight">
              Create groups to organise your classes and assign papers to specific student sets.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#181818] text-white rounded-full text-base font-medium letter-tight hover:bg-[#2a2a2a] transition-colors"
          >
            <Plus size={18} /> Create First Group
          </button>
        </div>
      )}

      {/* Groups grid */}
      {groups.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => (
            <div key={g.id} className="bg-white rounded-3xl p-6 flex flex-col gap-4">
              {/* Color bar */}
              <div className="w-full h-2 rounded-full" style={{ backgroundColor: g.color }} />

              {editingId === g.id ? (
                <div className="flex flex-col gap-2">
                  <input
                    value={editForm.name ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="border border-[#DADADA] rounded-full px-3 py-1.5 text-sm outline-none"
                    placeholder="Group name"
                  />
                  <input
                    value={editForm.subject ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    className="border border-[#DADADA] rounded-full px-3 py-1.5 text-sm outline-none"
                    placeholder="Subject"
                  />
                  <input
                    type="number"
                    value={editForm.studentCount ?? 30}
                    onChange={(e) => setEditForm({ ...editForm, studentCount: Number(e.target.value) })}
                    className="border border-[#DADADA] rounded-full px-3 py-1.5 text-sm outline-none"
                    placeholder="Students"
                    min={1}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(g.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#181818] text-white rounded-full text-sm">
                      <Check size={14} /> Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#F6F6F6] text-[#303030] rounded-full text-sm">
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-extrabold text-[#303030] letter-tight">{g.name}</h3>
                      <p className="text-sm text-[rgba(94,94,94,0.8)] letter-tight">{g.subject}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(g)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit2 size={15} className="text-[#A9A9A9]" />
                      </button>
                      <button onClick={() => deleteGroup(g.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={15} className="text-[#C53535]" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: g.color + "22" }}>
                      <Users size={16} style={{ color: g.color }} />
                    </div>
                    <span className="text-2xl font-extrabold text-[#303030] letter-tight">{g.studentCount}</span>
                    <span className="text-sm text-[rgba(94,94,94,0.8)] letter-tight">students</span>
                  </div>

                  <p className="text-xs text-[#A9A9A9] letter-tight">Created {formatDate(g.createdAt)}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#303030] letter-tight">Create Group</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-[#303030]" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-[#303030] letter-tight">Group Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Grade 8 - Section A"
                  className="border border-[#DADADA] rounded-full px-4 py-2.5 text-sm outline-none focus:border-[#303030] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-[#303030] letter-tight">Subject</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="border border-[#DADADA] rounded-full px-4 py-2.5 text-sm outline-none focus:border-[#303030] transition-colors bg-white"
                >
                  <option value="">Select subject</option>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-[#303030] letter-tight">Number of Students</label>
                <input
                  type="number"
                  value={form.studentCount}
                  onChange={(e) => setForm({ ...form, studentCount: Number(e.target.value) })}
                  min={1}
                  max={200}
                  className="border border-[#DADADA] rounded-full px-4 py-2.5 text-sm outline-none focus:border-[#303030] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-[#303030] letter-tight">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {GROUP_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        outline: form.color === c ? `3px solid ${c}` : "none",
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 bg-[#F6F6F6] text-[#303030] rounded-full text-sm font-medium letter-tight hover:bg-[#EBEBEB] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.name.trim()}
                className="flex-1 py-2.5 bg-[#181818] text-white rounded-full text-sm font-medium letter-tight hover:bg-[#2a2a2a] transition-colors disabled:opacity-40"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
