// src/pages/company/Messages.jsx

import { useEffect, useRef, useState } from "react";
import { Clock, Loader2, MessageCircle, Send } from "lucide-react";
import Avatar from "../../components/shared/Avatar";
import EmptyState from "../../components/shared/EmptyState";
import { getCompanyProfile } from "@/apis/company";
import { api } from "../../services/api";
import { getAuthUser } from "../../lib/auth";
import { timeAgo, truncate } from "../../utils/formatters";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function unwrapObject(payload) {
  if (!payload) return {};
  if (
    payload.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
  ) {
    return payload.data;
  }
  if (typeof payload === "object" && !Array.isArray(payload)) {
    return payload;
  }
  return {};
}

function getConversationList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function getMessageList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.messages)) return payload.messages;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function getPagedRows(response) {
  const payload = response?.data?.data || response?.data || {};
  const rows = payload?.data || payload?.rows || [];
  const totalPage = Number(payload?.totalPage || payload?.total_page || 1);

  return {
    rows: Array.isArray(rows) ? rows : [],
    totalPage: Number.isFinite(totalPage) && totalPage > 0 ? totalPage : 1,
  };
}

function getCandidateName(candidate) {
  return (
    candidate?.full_name ||
    candidate?.name ||
    candidate?.user?.full_name ||
    candidate?.user?.name ||
    null
  );
}

function getCandidateEmail(candidate) {
  return candidate?.email || candidate?.user?.email || "";
}

async function loadAllCompanyCandidates() {
  let page = 1;
  let totalPage = 1;
  const rows = [];

  while (page <= totalPage) {
    const response = await api.get("/company/candidates", {
      params: { page, limit: 100 },
    });
    const pageData = getPagedRows(response);
    rows.push(...pageData.rows);
    totalPage = pageData.totalPage;

    if (pageData.rows.length === 0) {
      break;
    }

    page += 1;
  }

  return rows;
}

function formatMessageTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildPreview(message, currentUserId) {
  if (!message?.content) return "No messages yet";
  const isMine = Number(message.sender_id) === Number(currentUserId);
  const prefix = isMine ? "You: " : "";
  return `${prefix}${truncate(String(message.content), 56)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeletons
// ─────────────────────────────────────────────────────────────────────────────

function ConversationSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-xl border border-orange-100 bg-white p-3 shadow-sm"
        >
          <div className="h-12 w-12 animate-pulse rounded-full bg-orange-100" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-orange-100" />
            <div className="h-3 w-full animate-pulse rounded bg-orange-50" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-orange-50" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-start">
        <div className="h-24 w-3/5 animate-pulse rounded-3xl bg-white" />
      </div>
      <div className="flex justify-end">
        <div className="h-20 w-1/2 animate-pulse rounded-3xl bg-orange-200" />
      </div>
      <div className="flex justify-start">
        <div className="h-28 w-2/3 animate-pulse rounded-3xl bg-white" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function Messages() {
  const authUser = getAuthUser();

  const [companyId, setCompanyId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [conversationMeta, setConversationMeta] = useState({});
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [senderNames, setSenderNames] = useState({});
  const [composer, setComposer] = useState("");
  const [bootLoading, setBootLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [messageError, setMessageError] = useState("");
  const bottomRef = useRef(null);

  // ── modal state ────────────────────────────────────────────────────────────
  const [showNewConversationModal, setShowNewConversationModal] =
    useState(false);
  const [allCandidates, setAllCandidates] = useState([]); // full list loaded on mount
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [filterQuery, setFilterQuery] = useState(""); // local filter, no API call
  // ──────────────────────────────────────────────────────────────────────────

  const activeConversation = conversations.find(
    (c) => Number(c.id) === Number(activeConversationId),
  );

  const activeSummary = activeConversation
    ? conversationMeta[activeConversation.id] || {}
    : {};

  // filtered list — just client-side string match, instant
  const filteredCandidates = allCandidates.filter((c) => {
    const q = filterQuery.toLowerCase();
    return (
      (c.full_name || c.name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  });

  const resolveSenderName = (senderId) => {
    const numericSenderId = Number(senderId);
    if (Number(authUser?.id) === numericSenderId) {
      return authUser?.full_name || authUser?.name || "You";
    }

    const candidate = allCandidates.find(
      (row) => Number(row?.user_id || row?.user?.id) === numericSenderId,
    );

    if (candidate) {
      return (
        getCandidateName(candidate) ||
        getCandidateEmail(candidate) ||
        `User ${senderId}`
      );
    }

    return senderNames[numericSenderId] || `User ${senderId}`;
  };

  const hydrateSenderNames = async (messageList) => {
    const uniqueSenderIds = Array.from(
      new Set(
        messageList
          .map((m) => Number(m.sender_id))
          .filter((id) => Number.isFinite(id) && id !== Number(authUser?.id)),
      ),
    );
    const missingIds = uniqueSenderIds.filter((id) => !senderNames[id]);
    if (missingIds.length === 0) return;

    const resolved = {};
    missingIds.forEach((id) => {
      const candidate = allCandidates.find(
        (row) => Number(row?.user_id || row?.user?.id) === id,
      );
      if (candidate) {
        resolved[id] =
          getCandidateName(candidate) ||
          getCandidateEmail(candidate) ||
          `User ${id}`;
      } else {
        resolved[id] = `User ${id}`;
      }
    });

    if (Object.keys(resolved).length > 0) {
      setSenderNames((prev) => ({ ...prev, ...resolved }));
    }
  };

  // ── boot: load company profile → conversations ────────────────────────────
  useEffect(() => {
    if (!authUser?.id) {
      setBootLoading(false);
      setError("No authenticated user found.");
      return;
    }

    let cancelled = false;

    async function loadConversations() {
      setBootLoading(true);
      setError("");
      try {
        const profile = await getCompanyProfile();
        const company = unwrapObject(profile);
        const resolvedCompanyId = Number(
          company?.id || company?.company_id || authUser?.company_id,
        );
        if (!resolvedCompanyId) throw new Error("Company profile not found.");
        if (cancelled) return;

        setCompanyId(resolvedCompanyId);

        setCandidatesLoading(true);
        const loadedCandidates = await loadAllCompanyCandidates();
        if (cancelled) return;
        setAllCandidates(loadedCandidates);
        setCandidatesLoading(false);

        const conversationsResponse = await api.get("/conversations", {
          params: { company_id: resolvedCompanyId },
        });
        const conversationList = getConversationList(
          conversationsResponse.data,
        );
        if (cancelled) return;
        setConversations(conversationList);

        const candidateById = new Map(
          loadedCandidates.map((candidate) => [
            Number(candidate.id),
            candidate,
          ]),
        );

        const summaries = await Promise.all(
          conversationList.map(async (conversation) => {
            const [latestMessageResult] = await Promise.allSettled([
              api.get("/messages", {
                params: {
                  conversation_id: conversation.id,
                  limit: 1,
                  sort: "created_at",
                  sortDirection: "DESC",
                },
              }),
            ]);

            const candidate =
              candidateById.get(Number(conversation.candidate_id)) || {};
            const latestMessages =
              latestMessageResult.status === "fulfilled"
                ? getMessageList(latestMessageResult.value.data)
                : [];
            const latestMessage = latestMessages[0] || null;

            return [
              conversation.id,
              {
                candidateName:
                  getCandidateName(candidate) ||
                  `Candidate ${conversation.candidate_id}`,
                candidateAvatar:
                  candidate?.avatar_url || candidate?.user?.avatar_url || "",
                preview: buildPreview(latestMessage, authUser?.id),
                previewAt:
                  latestMessage?.created_at || conversation.created_at || null,
                latestMessage,
              },
            ];
          }),
        );

        if (cancelled) return;
        const nextMeta = {};
        summaries.forEach(([id, summary]) => {
          nextMeta[id] = summary;
        });
        setConversationMeta(nextMeta);

        setActiveConversationId((prev) => {
          if (
            prev &&
            conversationList.some((c) => Number(c.id) === Number(prev))
          )
            return prev;
          return conversationList[0]?.id || null;
        });
      } catch (loadError) {
        if (!cancelled)
          setError(loadError?.message || "Failed to load conversations.");
      } finally {
        if (!cancelled) setCandidatesLoading(false);
        if (!cancelled) setBootLoading(false);
      }
    }

    loadConversations();
    return () => {
      cancelled = true;
    };
  }, [authUser?.id]);

  // ── load messages when active conversation changes ────────────────────────
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      setMessageError("");
      return;
    }

    let cancelled = false;

    async function loadMessages() {
      setMessagesLoading(true);
      setMessageError("");
      try {
        const response = await api.get("/messages", {
          params: { conversation_id: activeConversationId },
        });
        const messageList = getMessageList(response.data).sort(
          (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0),
        );
        if (cancelled) return;
        setMessages(messageList);

        const unreadIds = messageList
          .filter(
            (m) => !m.is_read && Number(m.sender_id) !== Number(authUser?.id),
          )
          .map((m) => m.id);

        if (unreadIds.length > 0) {
          await Promise.allSettled(
            unreadIds.map((id) =>
              api.patch(`/messages/${id}`, { is_read: true }),
            ),
          );
          if (cancelled) return;
          setMessages((prev) =>
            prev.map((m) =>
              unreadIds.includes(m.id) ? { ...m, is_read: true } : m,
            ),
          );
        }
        await hydrateSenderNames(messageList);
      } catch (loadError) {
        if (!cancelled) {
          setMessages([]);
          setMessageError(loadError?.message || "Failed to load messages.");
        }
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    }

    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [activeConversationId, authUser?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, activeConversationId, messagesLoading]);

  const updateActivePreview = (message) => {
    setConversationMeta((prev) => ({
      ...prev,
      [activeConversationId]: {
        ...(prev[activeConversationId] || activeSummary),
        preview: buildPreview(message, authUser?.id),
        previewAt: message?.created_at || new Date().toISOString(),
        latestMessage: message,
      },
    }));
  };

  const handleSend = async () => {
    const content = composer.trim();
    if (!content || !activeConversationId || !companyId) return;
    setSending(true);
    try {
      const response = await api.post("/messages", {
        conversation_id: activeConversationId,
        sender_id: authUser?.id,
        message_type: "text",
        content,
        is_read: false,
      });
      const createdMessage = unwrapObject(response.data);
      setComposer("");
      setMessages((prev) => [...prev, createdMessage]);
      setSenderNames((prev) => ({
        ...prev,
        [Number(authUser?.id)]: authUser?.full_name || authUser?.name || "You",
      }));
      updateActivePreview(createdMessage);
    } catch (sendError) {
      setMessageError(sendError?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleComposerKeyDown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    handleSend();
  };

  // ── handler: candidate clicked in modal ──────────────────────────────────
  const handleSelectCandidate = async (candidate) => {
    try {
      const res = await api.post("/conversations", {
        company_id: companyId,
        candidate_id: candidate.id,
      });
      const newConv = unwrapObject(res.data);
      setConversations((prev) => {
        if (prev.some((c) => Number(c.id) === Number(newConv.id))) return prev;
        return [newConv, ...prev];
      });
      setActiveConversationId(newConv.id);
      setShowNewConversationModal(false);
      setFilterQuery("");
    } catch {
      // optionally show error
    }
  };

  // ── New Conversation Modal (shared, reused in both empty + main render) ───
  const NewConversationModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Select a Candidate
          </h2>
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
            {allCandidates.length} candidates
          </span>
        </div>

        {/* filter input — client side, no API call */}
        <input
          type="text"
          placeholder="Filter by name or email..."
          className="w-full rounded-xl border border-orange-200 px-4 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          autoFocus
        />

        {/* candidate list */}
        <div className="mt-3 max-h-72 overflow-y-auto space-y-2 pr-1">
          {candidatesLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-orange-400" />
              <span className="ml-2 text-sm text-gray-400">
                Loading candidates...
              </span>
            </div>
          )}

          {!candidatesLoading && filteredCandidates.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400">
              {filterQuery
                ? "No candidates match your filter."
                : "No candidates found."}
            </p>
          )}

          {!candidatesLoading &&
            filteredCandidates.map((candidate) => {
              // highlight if already has a conversation
              const alreadyExists = conversations.some(
                (c) => Number(c.candidate_id) === Number(candidate.id),
              );

              return (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => handleSelectCandidate(candidate)}
                  className="flex w-full items-center gap-3 rounded-xl border border-orange-100 p-3 text-left transition hover:border-orange-300 hover:bg-orange-50"
                >
                  <Avatar
                    name={candidate.full_name || candidate.name}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {getCandidateName(candidate)}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {getCandidateEmail(candidate)}
                    </p>
                  </div>
                  {alreadyExists && (
                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                      Active
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        <button
          type="button"
          onClick={() => {
            setShowNewConversationModal(false);
            setFilterQuery("");
          }}
          className="mt-4 w-full rounded-xl border border-orange-200 py-2 text-sm text-gray-600 transition hover:bg-orange-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // ── boot loading ──────────────────────────────────────────────────────────
  if (bootLoading) {
    return (
      <div className="space-y-4">
        <div>
          <div className="h-8 w-40 animate-pulse rounded bg-orange-100" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-orange-50" />
        </div>
        <div className="grid gap-4 xl:grid-cols-[360px,1fr]">
          <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
            <ConversationSkeleton />
          </div>
          <div className="rounded-2xl border border-orange-100 bg-white shadow-sm">
            <MessageSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load messages"
        message={error}
        icon={MessageCircle}
      />
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-600">
              Keep conversations with candidates in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewConversationModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <MessageCircle size={16} /> New Conversation
          </button>
        </div>
        <EmptyState
          title="No conversations yet"
          message="Conversations with candidates will appear here."
          icon={MessageCircle}
        />
        {showNewConversationModal && <NewConversationModal />}
      </div>
    );
  }

  // ── main render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-600">
            Keep conversations with candidates in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-orange-100 bg-white px-4 py-2 text-xs font-medium text-orange-700 shadow-sm">
            {conversations.length} active conversation
            {conversations.length === 1 ? "" : "s"}
          </div>
          <button
            type="button"
            onClick={() => setShowNewConversationModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <MessageCircle size={16} /> New Conversation
          </button>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[360px,1fr]">
        {/* ── left panel: conversation list ── */}
        <aside className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
          <div className="border-b border-orange-100 bg-orange-50 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Conversations</p>
            <p className="text-xs text-gray-600">
              {companyId ? `Company #${companyId}` : "Company messages"}
            </p>
          </div>

          <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-3">
            <div className="space-y-2">
              {conversations.map((conversation) => {
                const summary = conversationMeta[conversation.id] || {};
                const isActive =
                  Number(conversation.id) === Number(activeConversationId);

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActiveConversationId(conversation.id)}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${
                      isActive
                        ? "border-orange-500 bg-orange-500 text-white shadow-md"
                        : "border-orange-100 bg-white hover:border-orange-200 hover:bg-orange-50"
                    }`}
                  >
                    <Avatar
                      name={
                        summary.candidateName ||
                        `Candidate ${conversation.candidate_id}`
                      }
                      size="md"
                      className={isActive ? "ring-2 ring-white" : ""}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p
                            className={`truncate text-sm font-semibold ${isActive ? "text-white" : "text-gray-900"}`}
                          >
                            {summary.candidateName ||
                              `Candidate ${conversation.candidate_id}`}
                          </p>
                          <p
                            className={`mt-0.5 line-clamp-1 text-xs ${isActive ? "text-orange-50" : "text-gray-500"}`}
                          >
                            {summary.preview || "No messages yet"}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-[11px] ${isActive ? "text-orange-50" : "text-gray-400"}`}
                        >
                          {summary.previewAt ? timeAgo(summary.previewAt) : "-"}
                        </span>
                      </div>
                      <div
                        className={`mt-2 flex items-center gap-2 text-[11px] ${isActive ? "text-orange-50" : "text-gray-500"}`}
                      >
                        <Clock size={12} />
                        <span>
                          {summary.latestMessage?.created_at
                            ? formatDateTime(summary.latestMessage.created_at)
                            : "No recent activity"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ── right panel: chat bubbles ── */}
        <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white px-5 py-4">
            <div className="flex items-center gap-3">
              <Avatar
                name={
                  activeSummary.candidateName ||
                  `Candidate ${activeConversation?.candidate_id}`
                }
                size="md"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {activeSummary.candidateName ||
                    `Candidate ${activeConversation?.candidate_id}`}
                </p>
                <p className="text-xs text-gray-500">
                  {activeSummary.latestMessage?.created_at
                    ? `Last activity ${timeAgo(activeSummary.latestMessage.created_at)}`
                    : "Start the conversation"}
                </p>
              </div>
            </div>
            <div className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
              Company chat
            </div>
          </div>

          <div className="flex h-[calc(100vh-15.5rem)] min-h-[540px] flex-col">
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-orange-50/60 to-white px-4 py-5">
              {messagesLoading ? (
                <MessageSkeleton />
              ) : messageError ? (
                <div className="flex h-full items-center justify-center">
                  <EmptyState
                    title="Unable to load chat"
                    message={messageError}
                    icon={MessageCircle}
                  />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <EmptyState
                    title="No messages yet"
                    message="Send the first message to start the conversation."
                    icon={MessageCircle}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isMine =
                      Number(message.sender_id) === Number(authUser?.id);
                    const senderName = resolveSenderName(message.sender_id);
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[78%] ${isMine ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`rounded-3xl px-4 py-3 shadow-sm ${
                              isMine
                                ? "bg-orange-500 text-white"
                                : "border border-orange-100 bg-white text-gray-800"
                            }`}
                          >
                            <p className="whitespace-pre-wrap text-sm leading-6">
                              {message.content}
                            </p>
                          </div>
                          <div
                            className={`mt-1 flex items-center gap-2 text-[11px] ${
                              isMine
                                ? "justify-end text-orange-700"
                                : "text-gray-500"
                            }`}
                          >
                            <span className="font-semibold">{senderName}</span>
                            <span>•</span>
                            <span>{formatMessageTime(message.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* composer */}
            <div className="border-t border-orange-100 bg-white px-4 py-4">
              {messageError && !messagesLoading ? (
                <p className="mb-3 text-xs text-red-600">{messageError}</p>
              ) : null}
              <div className="flex items-end gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-3">
                <textarea
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Type your message and press Enter"
                  rows={2}
                  className="min-h-[52px] flex-1 resize-none rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={
                    sending || !composer.trim() || !activeConversationId
                  }
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── New Conversation Modal ── */}
      {showNewConversationModal && <NewConversationModal />}
    </div>
  );
}
