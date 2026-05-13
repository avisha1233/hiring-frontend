import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { toast } from "react-toastify";
import SearchInput from "../../components/shared/SearchInput";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import ErrorState from "../../components/shared/ErrorState";
import EmptyState from "../../components/shared/EmptyState";
import { useDebounce } from "../../hooks";
import * as skillService from "../../services/skillService";

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    skill: null,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [formData, setFormData] = useState({ name: "", category: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearch,
      };
      const res = await skillService.getSkills(params);
      setSkills(res.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, [debouncedSearch]);

  const handleCreate = async (e) => {
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
      setFormData({ name: "", category: "" });
      setEditingSkill(null);
      setFormOpen(false);
      fetchSkills();
    } catch (err) {
      toast.error("Failed to save skill");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (skill) => {
    setEditingSkill(skill);
    setFormData({ name: skill.name, category: skill.category || "" });
    setFormOpen(true);
  };

  const handleDelete = async () => {
    try {
      await skillService.deleteSkill(deleteConfirm.skill.id);
      toast.success("Skill deleted successfully");
      setDeleteConfirm({ open: false, skill: null });
      fetchSkills();
    } catch (err) {
      toast.error("Failed to delete skill");
    }
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingSkill(null);
    setFormData({ name: "", category: "" });
  };

  if (error) {
    return (
      <ErrorState
        title="Failed to load skills"
        message={error}
        onRetry={fetchSkills}
      />
    );
  }

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
        {!formOpen && (
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            <Plus size={18} />
            Add Skill
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Table Section - 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
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
            <div className="overflow-x-auto rounded-lg border border-orange-100 bg-white shadow-sm">
              <table className="w-full">
                <thead className="border-b border-orange-100 bg-orange-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSkills.map((skill) => (
                    <tr
                      key={skill.id}
                      className="border-b border-orange-50 hover:bg-orange-50"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {skill.name}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {skill.category || "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(skill)}
                            className="text-gray-400 hover:text-orange-600"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({ open: true, skill })
                            }
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form Section - 1/3 width */}
        {formOpen && (
          <div className="rounded-lg border border-orange-100 bg-white p-6 shadow-sm h-fit">
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

            <form onSubmit={handleCreate} className="space-y-4">
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
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  disabled={submitting}
                >
                  <option value="">Select Category</option>
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="fullstack">Fullstack</option>
                  <option value="devops">DevOps</option>
                  <option value="mobile">Mobile</option>
                  <option value="data">Data Science</option>
                  <option value="design">Design</option>
                  <option value="other">Other</option>
                </select>
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
