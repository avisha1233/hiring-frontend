import { useEffect, useState } from "react";
import { CheckSquare, Clock } from "lucide-react";
import { useLocation } from "react-router-dom";
import SearchInput from "../../components/shared/SearchInput";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import StatusBadge from "../../components/shared/StatusBadge";
import { api } from "../../services/api";

export default function Tasks() {
  const location = useLocation();
  const [search, setSearch] = useState(
    new URLSearchParams(location.search).get("search") || "",
  );
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const querySearch =
      new URLSearchParams(location.search).get("search") || "";
    setSearch(querySearch);
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      setLoading(true);
      setError("");

      try {
        const res = await api.get("/tasks", {
          params: search ? { search } : {},
        });
        const data = res?.data?.data || res?.data || res || [];

        if (!cancelled) {
          setTasks(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load tasks");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTasks();

    return () => {
      cancelled = true;
    };
  }, [search]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <p className="text-sm text-gray-600">
          Track work tasks assigned to candidates
        </p>
      </div>

      <div className="rounded-lg border border-orange-100 bg-white p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search tasks..."
          disabled={loading}
        />
      </div>

      {loading ? (
        <LoadingSkeleton rows={5} columns={4} />
      ) : error ? (
        <EmptyState title="Failed to load tasks" message={error} />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          message="Try a different search term"
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={18} className="text-orange-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {task.title || task.task_title || `Task #${task.id}`}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-600">
                    {task.description || "No description available"}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={14} />
                      {task.due_date || task.deadline || "No due date"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={task.status || "todo"} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
