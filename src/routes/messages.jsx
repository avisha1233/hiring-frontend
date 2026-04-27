/* eslint-disable react-refresh/only-export-components */

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CandidateLayout } from "@/components/candidate/CandidateLayout";
import { messageApi } from "@/apis/candidate";
import { getAuthUser } from "@/lib/auth";

export const Route = createFileRoute("/messages")({
  component: MessagesPage,
});

function formatTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "MMM d, h:mm a");
}

function MessagesPage() {
  const queryClient = useQueryClient();
  const authUser = getAuthUser();
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [input, setInput] = useState("");

  const conversationsQuery = useQuery({
    queryKey: ["candidate", "messages", "conversations"],
    queryFn: () => messageApi.getConversations(),
    retry: false,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const conversations = useMemo(
    () => conversationsQuery.data?.data || [],
    [conversationsQuery.data?.data],
  );

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [activeConversationId, conversations]);

  const messagesQuery = useQuery({
    queryKey: ["candidate", "messages", activeConversationId],
    queryFn: () => messageApi.getConversationMessages(activeConversationId),
    enabled: Boolean(activeConversationId),
    retry: false,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      messageApi.sendMessage(activeConversationId, {
        sender_id: authUser?.id,
        content: input.trim(),
      }),
    onSuccess: () => {
      setInput("");
      queryClient.invalidateQueries({
        queryKey: ["candidate", "messages", activeConversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["candidate", "messages", "conversations"],
      });
    },
  });

  const messages = messagesQuery.data?.messages || [];

  return (
    <CandidateLayout title="Messages" subtitle="Communicate with recruiters">
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[320px,1fr]">
        <aside className="rounded-xl border border-(--dash-border) bg-(--dash-surface) p-3 shadow-(--dash-shadow)">
          <h3 className="m-0 px-1 pb-2 text-sm font-semibold text-(--dash-text)">
            Conversations
          </h3>
          <div className="space-y-2">
            {conversations.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setActiveConversationId(item.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left ${activeConversationId === item.id ? "border-(--dash-accent) bg-(--dash-accent-soft)" : "border-(--dash-border) bg-(--dash-bg-elevated)"}`}
              >
                <p className="m-0 text-sm font-semibold text-(--dash-text)">
                  Company #{item.company_id}
                </p>
                <p className="m-0 mt-1 text-xs text-(--dash-muted)">
                  Conversation #{item.id}
                </p>
              </button>
            ))}

            {!conversationsQuery.isPending && conversations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-(--dash-border) bg-(--dash-bg-elevated) p-4 text-center text-sm text-(--dash-muted)">
                No conversations yet.
              </div>
            ) : null}
          </div>
        </aside>

        <div className="rounded-xl border border-(--dash-border) bg-(--dash-surface) shadow-(--dash-shadow)">
          <div className="border-b border-(--dash-border) px-4 py-3">
            <p className="m-0 text-sm font-semibold text-(--dash-text)">Chat</p>
          </div>

          <div className="h-[420px] space-y-2 overflow-y-auto px-4 py-3">
            {messages.map((msg) => {
              const isMe = Number(msg.sender_id) === Number(authUser?.id);
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <article
                    className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${isMe ? "bg-(--dash-accent) text-white" : "border border-(--dash-border) bg-(--dash-bg-elevated) text-(--dash-text)"}`}
                  >
                    <p className="m-0">{msg.content}</p>
                    <p
                      className={`m-0 mt-1 text-[11px] ${isMe ? "text-white/80" : "text-(--dash-muted)"}`}
                    >
                      {formatTime(msg.created_at)}
                    </p>
                  </article>
                </div>
              );
            })}

            {!messagesQuery.isPending && messages.length === 0 ? (
              <div className="rounded-lg border border-dashed border-(--dash-border) bg-(--dash-bg-elevated) p-4 text-center text-sm text-(--dash-muted)">
                Select a conversation to start messaging.
              </div>
            ) : null}
          </div>

          <div className="border-t border-(--dash-border) p-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type a message..."
                className="h-10 flex-1 rounded-lg border border-(--dash-border) bg-white px-3 text-sm text-(--dash-text) outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!input.trim() || !activeConversationId) return;
                  sendMutation.mutate();
                }}
                className="rounded-lg bg-(--dash-accent) px-4 py-2 text-sm font-semibold text-white"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </section>
    </CandidateLayout>
  );
}
