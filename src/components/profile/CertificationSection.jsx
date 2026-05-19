import { useState } from "react";
import { toast } from "react-toastify";
import { Award, Pencil, Trash2 } from "lucide-react";
import { candidateApi } from "@/apis/candidate";

const inputClass = "h-10 w-full rounded-lg border border-orange-100 px-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100";

const EMPTY = {
  name: "", issuer: "", issued_date: "", expiry_date: "", credential_url: "",
};

export default function CertificationsSection({ items, onUpdate }) {
  const [form, setForm]         = useState(EMPTY);
  const [editId, setEditId]     = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);

  function openAdd() {
    setForm(EMPTY);
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(item) {
    setForm({
      ...item,
      issued_date: item.issued_date?.slice(0, 7) ?? "",
      expiry_date: item.expiry_date?.slice(0, 7) ?? "",
    });
    setEditId(item.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.issuer.trim())
      return toast.error("Name and issuer are required");

    setSaving(true);
    try {
      if (editId) {
        const res = await candidateApi.updateCert(editId, form);
        onUpdate(items.map((i) => (i.id === editId ? res.data : i)));
        toast.success("Certification updated");
      } else {
        const res = await candidateApi.addCert(form);
        onUpdate([res.data, ...items]);
        toast.success("Certification added");
      }
      setShowForm(false);
    } catch {
      toast.error("Failed to save certification");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this certification?")) return;
    try {
      await candidateApi.deleteCert(id);
      onUpdate(items.filter((i) => i.id !== id));
      toast.success("Certification removed");
    } catch {
      toast.error("Failed to delete");
    }
  }

  const isExpired = (date) => date && new Date(date) < new Date();

  return (
    <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Certifications</h2>
        <button type="button" onClick={openAdd}
          className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700">
          + Add
        </button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-lg border border-purple-100 bg-purple-50/30 p-3 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {editId ? "Edit certification" : "New certification"}
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Certification name</span>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Issuing organisation</span>
              <input value={form.issuer} onChange={(e) => setForm((p) => ({ ...p, issuer: e.target.value }))}
                placeholder="" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Issue date</span>
              <input type="month" value={form.issued_date}
                onChange={(e) => setForm((p) => ({ ...p, issued_date: e.target.value }))}
                className={inputClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Expiry date (optional)</span>
              <input type="month" value={form.expiry_date}
                onChange={(e) => setForm((p) => ({ ...p, expiry_date: e.target.value }))}
                className={inputClass} />
            </label>
          </div>
         
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} disabled={saving}
              className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {items.length === 0 && !showForm ? (
        <p className="text-sm text-gray-400">No certifications added yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                <Award size={16} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.issuer}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Issued {item.issued_date?.slice(0, 7)}
                  {item.expiry_date && ` · Expires ${item.expiry_date?.slice(0, 7)}`}
                  {isExpired(item.expiry_date) && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-700">
                      Expired
                    </span>
                  )}
                </p>
               
              </div>
              <div className="flex gap-1 shrink-0">
                <button type="button" onClick={() => openEdit(item)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-purple-50 hover:text-purple-600">
                  <Pencil size={13} />
                </button>
                <button type="button" onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}