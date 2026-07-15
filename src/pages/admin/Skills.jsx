import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import SearchInput from "../../components/shared/SearchInput";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import ErrorState from "../../components/shared/ErrorState";
import EmptyState from "../../components/shared/EmptyState";
import { useDebounce } from "../../hooks";
import * as skillService from "../../services/skillService";

const PAGE_LIMIT = 10;

export default function Skills() {
  const [skills, setSkills]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState("");
  const debouncedSearch             = useDebounce(search, 300);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, skill: null });
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [formData, setFormData]     = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchSkills = async (currentPage) => {
    const pg = currentPage ?? 1;
    try {
      setLoading(true);
      // Always send page + limit so the API honours server-side pagination
      const res = await skillService.getSkills({ search: debouncedSearch, page: pg, limit: PAGE_LIMIT });
      // API shape: { data: [...], total, totalPage, currentPage, perPage }
      const payload = res.data;
      setSkills(payload.data || []);
      setTotal(payload.total ?? 0);
      setTotalPages(payload.totalPage ?? 1);
      setPage(payload.currentPage ?? pg);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 whenever the search term changes
  useEffect(() => {
    setPage(1);
    fetchSkills(1);
  }, [debouncedSearch]);

  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) fetchSkills(p);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Skill name is required");
      return;
    }
    try {
      setSubmitting(true);
      if (editingSkill) {
        await skillService.updateSkill(editingSkill.id, formData);
        toast.success("Skill updated successfully");
      } else {
        await skillService.createSkill(formData);
        toast.success("Skill created successfully");
      }
      setFormData({ name: "", description: "" });
      setEditingSkill(null);
      setModalOpen(false);
      fetchSkills();
    } catch (err) {
      toast.error("Failed to save skill");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (skill) => {
    setEditingSkill(skill);
    setFormData({ name: skill.name, description: skill.description || "" });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await skillService.deleteSkill(deleteConfirm.skill.id);
      toast.success("Skill deleted successfully");
      setDeleteConfirm({ open: false, skill: null });
      // If we just deleted the last item on this page, step back one
      const newPage = skills.length === 1 && page > 1 ? page - 1 : page;
      fetchSkills(newPage);
    } catch (err) {
      toast.error("Failed to delete skill");
    }
  };

  const handleCloseForm = () => {
    setModalOpen(false);
    setEditingSkill(null);
    setFormData({ name: "", description: "" });
  };

  if (error) {
    return (
      <ErrorState
        title="Failed to load skills"
        message={error}
        onRetry={() => fetchSkills(page)}
      />
    );
  }

  // "Showing 11–20 of 35"
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const rangeEnd   = Math.min(page * PAGE_LIMIT, total);

  // Page chips with ellipsis compression
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("ellipsis-" + p);
      acc.push(p);
      return acc;
    }, []);

  const filteredSkills = skills;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Skills</h1>
          <p className="text-sm text-gray-600">
            Manage available skills for jobs and candidates
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          <Plus size={18} />
          Add Skill
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-4">
        {/* Table Section */}
        <div className="space-y-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search skills..."
            disabled={loading}
          />

          {loading ? (
            <LoadingSkeleton rows={5} columns={3} />
          ) : filteredSkills.length === 0 ? (
            <EmptyState
              title="No skills found"
              message="Try adjusting your search or create a new skill"
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-orange-100 bg-white shadow-sm">
                <table className="w-full">
                  <thead className="border-b border-orange-100 bg-orange-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Created At</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSkills.map((skill) => (
                      <tr key={skill.id} className="border-b border-orange-50 hover:bg-orange-50">
                        <td className="px-4 py-3"><p className="font-medium text-gray-900">{skill.name}</p></td>
                        <td className="px-4 py-3"><p className="text-gray-700">{skill.description || "-"}</p></td>
                        <td className="px-4 py-3"><p className="text-gray-500 text-sm">{new Date(skill.created_at).toLocaleDateString()}</p></td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEdit(skill)} className="text-gray-400 hover:text-orange-600"><Pencil size={18} /></button>
                            <button onClick={() => setDeleteConfirm({ open: true, skill })} className="text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination controls ── */}
              <div className="flex items-center justify-between px-1 pt-1">
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-medium text-gray-700">{rangeStart}–{rangeEnd}</span>
                  {" "}of{" "}
                  <span className="font-medium text-gray-700">{total}</span> skills
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1 || loading}
                    className="inline-flex items-center gap-1 rounded-lg border border-orange-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
                  >
                    <ChevronLeft size={15} /> Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {pageNumbers.map((p) =>
                      typeof p === "string" ? (
                        <span key={p} className="px-1 text-gray-400">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => goToPage(p)}
                          disabled={loading}
                          className={`min-w-[32px] rounded-lg border px-2 py-1.5 text-sm font-medium transition ${
                            p === page
                              ? "border-orange-500 bg-orange-500 text-white"
                              : "border-orange-200 text-gray-600 hover:bg-orange-50"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages || loading}
                    className="inline-flex items-center gap-1 rounded-lg border border-orange-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
                  >
                    Next <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-30">
            <div className="w-full max-w-lg rounded-lg border border-orange-100 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingSkill ? "Edit Skill" : "New Skill"}
                </h3>
                <button
                  onClick={handleCloseForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Skill Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., React"
                    className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Optional description"
                    className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    disabled={submitting}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:bg-gray-300"
                  >
                    {submitting
                      ? "Saving..."
                      : editingSkill
                        ? "Update"
                        : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    disabled={submitting}
                    className="flex-1 rounded-lg border border-orange-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50 disabled:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, skill: null })}
        onConfirm={handleDelete}
        title="Delete Skill"
        message={`Are you sure you want to delete "${deleteConfirm.skill?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmStyle="danger"
      />
    </div>
  );
}
