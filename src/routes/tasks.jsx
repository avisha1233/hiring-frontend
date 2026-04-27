/* eslint-disable react-refresh/only-export-components */

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CandidateLayout } from "@/components/candidate/CandidateLayout";
import { candidateApi } from "@/apis/candidate";

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
});

const FILTERS = ["all", "todo", "in_progress", "completed"];

function toDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "MMM d, yyyy");
}

function TasksPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("all");
  const [newTask, setNewTask] = useState("");
  const [dueDate, setDueDate] = useState("");

  const tasksQuery = useQuery({
    queryKey: ["candidate", "tasks", status],
    queryFn: () => candidateApi.getTasks({ status }),
    retry: false,
    staleTime: 15_000,
  });

  const createTaskMutation = useMutation({
    mutationFn: () =>
      candidateApi.createTask({ title: newTask.trim(), dueDate }),
    onSuccess: () => {
      setNewTask("");
      setDueDate("");
      queryClient.invalidateQueries({ queryKey: ["candidate", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "stats"] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, nextStatus }) =>
      candidateApi.updateTaskStatus(id, nextStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "stats"] });
    },
  });

  const rows = useMemo(
    () => tasksQuery.data?.data || [],
    [tasksQuery.data?.data],
  );

  return (
    <CandidateLayout title="Tasks" subtitle="Track your pending tasks">
      <section className="space-y-4">
        <div className="rounded-xl border border-(--dash-border) bg-(--dash-surface) p-3 shadow-(--dash-shadow)">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatus(item)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold ${status === item ? "bg-(--dash-accent-soft) text-(--dash-accent)" : "text-(--dash-muted) hover:bg-(--dash-accent-soft)"}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={newTask}
              onChange={(event) => setNewTask(event.target.value)}
              placeholder="New task title"
              className="h-10 min-w-64 flex-1 rounded-lg border border-(--dash-border) bg-white px-3 text-sm text-(--dash-text) outline-none"
            />
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="h-10 rounded-lg border border-(--dash-border) bg-white px-3 text-sm text-(--dash-muted)"
            />
            <button
              type="button"
              onClick={() => {
                if (!newTask.trim()) return;
                createTaskMutation.mutate();
              }}
              className="rounded-lg bg-(--dash-accent) px-4 py-2 text-sm font-semibold text-white"
            >
              Add Task
            </button>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-(--dash-border) bg-(--dash-surface) p-3 shadow-(--dash-shadow)">
          {tasksQuery.isPending ? (
            <>
              <div className="h-12 animate-pulse rounded-lg bg-(--dash-accent-soft)" />
              <div className="h-12 animate-pulse rounded-lg bg-(--dash-accent-soft)" />
            </>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-(--dash-border) bg-(--dash-bg-elevated) p-8 text-center text-sm text-(--dash-muted)">
              No tasks found.
            </div>
          ) : (
            rows.map((task) => (
              <article
                key={task.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-(--dash-border) bg-(--dash-bg-elevated) p-3"
              >
                <input
                  type="checkbox"
                  checked={task.status === "completed"}
                  onChange={(event) => {
                    const nextStatus = event.target.checked
                      ? "completed"
                      : "todo";
                    updateTaskMutation.mutate({ id: task.id, nextStatus });
                  }}
                />
                <p className="m-0 flex-1 text-sm text-(--dash-text)">
                  {task.title}
                </p>
                <span className="rounded-md border border-(--dash-border) bg-white px-2 py-1 text-xs text-(--dash-muted)">
                  {task.status}
                </span>
                <span className="text-xs text-(--dash-muted)">
                  Due {toDate(task.deadline)}
                </span>
                <select
                  value={task.status}
                  onChange={(event) =>
                    updateTaskMutation.mutate({
                      id: task.id,
                      nextStatus: event.target.value,
                    })
                  }
                  className="rounded-md border border-(--dash-border) bg-white px-2 py-1 text-xs text-(--dash-muted)"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </article>
            ))
          )}
        </div>
      </section>
    </CandidateLayout>
  );
}
