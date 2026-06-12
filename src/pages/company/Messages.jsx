// src/pages/company/Messages.jsx

import { useEffect, useRef, useState } from "react";
import { Clock, Loader2, MessageCircle, Send } from "lucide-react";
import Avatar from "../../components/shared/Avatar";
import EmptyState from "../../components/shared/EmptyState";
import { getCompanyJobs, getCompanyProfile } from "@/apis/company";
import axiosApi from "../../api/axios";          // ← same client every other page uses
import { apiClient } from "../../apis/api";      // ← for getCompanyProfile internally
import { getAuthUser } from "../../lib/auth";
import { timeAgo, truncate } from "../../utils/formatters";

// ─── unwrap API responses ──────────────────────────────────────────────────
// axiosApi returns { data: body } — so we unwrap .data first, then handle
// body shapes: body, body.data, body.data.data
function toArray(res) {
  // res is the full axios response — body lives at res.data
  const body = res?.data;
  if (Array.isArray(body))           return body;
  if (Array.isArray(body?.data))     return body.data;
  if (Array.isArray(body?.data?.data)) return body.data.data;
  return [];
}

function toObject(res) {
  const body = res?.data;
  if (!body) return {};
  if (body.data && !Array.isArray(body.data)) return body.data;
  if (typeof body === "object" && !Array.isArray(body)) return body;
  return {};
}


// ─── candidate name ────────────────────────────────────────────────────────
// /candidates        → { id, full_name, user_id, ... }       (full_name at top level)
// /company/candidates → { id, user_id, user: { full_name } } (name inside user object)
// we check both so this works regardless of which endpoint was used
function candidateName(c) {
  return (
    c?.user?.full_name  ||   // /company/candidates shape
    c?.user?.name       ||
    c?.full_name        ||   // /candidates shape
    c?.name             ||
    c?.candidate?.full_name ||
    null
  );
}

function candidateEmail(c) {
  return (
    c?.user?.email      ||   // /company/candidates shape
    c?.email            ||   // /candidates shape
    c?.candidate?.email ||
    ""
  );
}

// one-line sidebar preview
function previewText(lastMsg, myId) {
  if (!lastMsg?.content) return "No messages yet";
  const mine = Number(lastMsg.sender_id) === Number(myId);
  return (mine ? "You: " : "") + truncate(String(lastMsg.content), 56);
}

// ─── load every candidate using the correct endpoint ──────────────────────
// /candidates returns { data: { data: [...], totalPage: N } }
// we use this endpoint because it includes full_name at the top level
// which is what the modal needs to show names and filter by them
async function fetchAllCandidates() {
  let page = 1;
  let lastPage = 1;
  const all = [];

  while (page <= lastPage) {
    const res = await axiosApi.get("/candidates", {
      params: { page, limit: 100 },
    });

    // Backend returns: { data: [...], total, totalPage, currentPage, perPage }
    // axiosApi wraps that in res.data, so:
    //   res.data           = { data: [...], totalPage: N, ... }
    //   res.data.data      = the actual candidate array
    const body  = res?.data || {};
    const rows  = Array.isArray(body?.data) ? body.data : [];
    const total = Number(body?.totalPage ?? body?.total_page ?? 1);

    if (rows.length) all.push(...rows);
    lastPage = Number.isFinite(total) && total > 0 ? total : 1;
    if (!rows.length) break;
    page++;
  }

  return all;
}

// ─── time helpers ──────────────────────────────────────────────────────────
function shortTime(val) {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d)) return "-";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function shortDate(val) {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d)) return "-";
  return d.toLocaleString([], {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

// ─── skeletons ─────────────────────────────────────────────────────────────
function SidebarSkeleton() {
  return (
    <div className="space-y-3">
      {[1,2,3,4,5].map((n) => (
        <div key={n} className="flex items-center gap-3 rounded-xl border border-orange-100 bg-white p-3">
          <div className="h-12 w-12 animate-pulse rounded-full bg-orange-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-orange-100" />
            <div className="h-3 w-full animate-pulse rounded bg-orange-50" />
          </div>
        </div>
      ))}
    </div>
  );
}
function ChatSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-start"><div className="h-20 w-3/5 animate-pulse rounded-3xl bg-white" /></div>
      <div className="flex justify-end"><div className="h-16 w-1/2 animate-pulse rounded-3xl bg-orange-200" /></div>
      <div className="flex justify-start"><div className="h-24 w-2/3 animate-pulse rounded-3xl bg-white" /></div>
    </div>
  );
}

// ─── candidate picker modal ────────────────────────────────────────────────
// defined OUTSIDE the main component — if it's inside, React recreates it
// on every render and the search input loses focus on every keystroke
function CandidateModal({
  candidates, conversations, candidatesLoading,
  search, onSearch, onSelect, onClose,
}) {
  // filter by name OR email — using both fields so it works regardless of API shape
  const filtered = candidates.filter((c) => {
    const q    = search.toLowerCase();
    const name = (candidateName(c) || "").toLowerCase();
    const mail = (candidateEmail(c) || "").toLowerCase();
    return name.includes(q) || mail.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Select a Candidate</h2>
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
            {candidates.length} total
          </span>
        </div>

        <input
          type="text"
          placeholder="Search by name or email..."
          className="w-full rounded-xl border border-orange-200 px-4 py-2 text-sm outline-none focus:border-orange-400"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          autoFocus
        />

        <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
          {candidatesLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-orange-400" />
              <span className="ml-2 text-sm text-gray-400">Loading candidates...</span>
            </div>
          )}

          {!candidatesLoading && filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400">
              {search ? "No match found." : "No candidates available."}
            </p>
          )}

          {!candidatesLoading && filtered.map((c) => {
            const name  = candidateName(c) || `Candidate ${c.id}`;
            const email = candidateEmail(c);
            const hasConv = conversations.some(
              (conv) => Number(conv.candidate_id) === Number(c.id)
            );

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c)}
                className="flex w-full items-center gap-3 rounded-xl border border-orange-100 p-3 text-left transition hover:bg-orange-50"
              >
                <Avatar name={name} size="md" />
                <div className="min-w-0 flex-1">
                  {/* name — always shows because we resolve from both field shapes */}
                  <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
                  {/* email — shown below the name */}
                  {email && (
                    <p className="truncate text-xs text-gray-500">{email}</p>
                  )}
                </div>
                {hasConv && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-orange-200 py-2 text-sm text-gray-600 hover:bg-orange-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function Messages() {
  const me = getAuthUser();

  const [companyId, setCompanyId]                 = useState(null);
  const [conversations, setConversations]         = useState([]);
  const [previews, setPreviews]                   = useState({});
  const [openId, setOpenId]                       = useState(null);
  const [messages, setMessages]                   = useState([]);
  const [names, setNames]                         = useState({});
  const [draft, setDraft]                         = useState("");
  const [loading, setLoading]                     = useState(true);
  const [chatLoading, setChatLoading]             = useState(false);
  const [sending, setSending]                     = useState(false);
  const [pageError, setPageError]                 = useState("");
  const [chatError, setChatError]                 = useState("");
  const [candidates, setCandidates]               = useState([]);
  const [jobs, setJobs]                           = useState([]);
  const [showModal, setShowModal]                 = useState(false);
  const [search, setSearch]                       = useState("");
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  const bottomRef = useRef(null);

  const openConversation = conversations.find((c) => Number(c.id) === Number(openId));
  const openPreview      = previews[openId] || {};

  // resolve display name for a message sender
  const senderName = (senderId) => {
    const id = Number(senderId);
    if (id === Number(me?.id)) return me?.full_name || me?.name || "You";
    // find in loaded candidates list — works with both full_name and user.full_name
    const match = candidates.find(
      (c) => Number(c?.user_id) === id || Number(c?.user?.id) === id || Number(c?.id) === id
    );
    if (match) return candidateName(match) || candidateEmail(match) || `User ${id}`;
    return names[id] || `User ${id}`;
  };

  const cacheSenderNames = (msgList) => {
    const unknown = [...new Set(
      msgList
        .map((m) => Number(m.sender_id))
        .filter((id) => id !== Number(me?.id) && !names[id])
    )];
    if (!unknown.length) return;
    const resolved = {};
    unknown.forEach((id) => {
      const match = candidates.find(
        (c) => Number(c?.user_id) === id || Number(c?.user?.id) === id
      );
      resolved[id] = match
        ? candidateName(match) || candidateEmail(match) || `User ${id}`
        : `User ${id}`;
    });
    setNames((prev) => ({ ...prev, ...resolved }));
  };

  // ── on mount: load company → candidates → jobs → conversations ──────────
  useEffect(() => {
    if (!me?.id) {
      setLoading(false);
      setPageError("Please log in first.");
      return;
    }

    let gone = false;

    async function loadPage() {
      setLoading(true);
      setPageError("");
      try {
        // 1. company id
        const profile = await getCompanyProfile();
        const cid = Number(
          profile?.id         || profile?.company_id    ||
          profile?.data?.id   || profile?.data?.company_id ||
          me?.company_id
        );
        if (!cid) throw new Error("Could not find your company profile.");
        if (gone) return;
        setCompanyId(cid);

        // 2. load all candidates using /candidates (has full_name at top level)
        setCandidatesLoading(true);
        const loadedCandidates = await fetchAllCandidates();
        if (gone) return;
        setCandidates(loadedCandidates);
        setCandidatesLoading(false);

        // 3. load jobs — needed because POST /conversations requires job_id
        try {
          const jobsRes = await getCompanyJobs({ limit: 100 });
          const jobList = toArray({ data: jobsRes?.data || jobsRes });
          if (!gone) setJobs(Array.isArray(jobList) ? jobList : []);
        } catch {
          if (!gone) setJobs([]);
        }

        // 4. load conversations for this company
        const convRes  = await axiosApi.get("/conversations", {
          params: { company_id: cid },
        });
        const convList = toArray(convRes);
        if (gone) return;
        setConversations(convList);

        // 5. get latest message per conversation for the sidebar preview
        const byId = new Map(loadedCandidates.map((c) => [Number(c.id), c]));
        const entries = await Promise.all(
          convList.map(async (conv) => {
            try {
              const msgRes = await axiosApi.get("/messages", {
                params: {
                  conversation_id: conv.id,
                  limit: 1,
                  sort: "created_at",
                  sortDirection: "DESC",
                },
              });
              const last = toArray(msgRes)[0] || null;
              const cand = byId.get(Number(conv.candidate_id)) || {};
              return [conv.id, {
                name:    candidateName(cand) || `Candidate ${conv.candidate_id}`,
                preview: previewText(last, me?.id),
                time:    last?.created_at || conv.created_at || null,
                lastMsg: last,
              }];
            } catch {
              return [conv.id, {
                name:    `Candidate ${conv.candidate_id}`,
                preview: "No messages yet",
                time: null, lastMsg: null,
              }];
            }
          })
        );

        if (gone) return;
        const previewMap = {};
        entries.forEach(([id, info]) => { previewMap[id] = info; });
        setPreviews(previewMap);

        setOpenId((prev) => {
          if (prev && convList.some((c) => Number(c.id) === Number(prev))) return prev;
          return convList[0]?.id || null;
        });

      } catch (err) {
        if (!gone) setPageError(err?.message || "Failed to load messages.");
      } finally {
        if (!gone) { setCandidatesLoading(false); setLoading(false); }
      }
    }

    loadPage();
    return () => { gone = true; };
  }, [me?.id]);

  // ── load messages when conversation changes ─────────────────────────────
  useEffect(() => {
    if (!openId) { setMessages([]); setChatError(""); return; }
    let gone = false;

    async function loadMessages() {
      setChatLoading(true);
      setChatError("");
      try {
        const res    = await axiosApi.get("/messages", {
          params: { conversation_id: openId },
        });
        const sorted = toArray(res).sort(
          (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)
        );
        if (gone) return;
        setMessages(sorted);

        const unread = sorted
          .filter((m) => !m.is_read && Number(m.sender_id) !== Number(me?.id))
          .map((m) => m.id);
        if (unread.length) {
          await Promise.allSettled(
            unread.map((id) => axiosApi.patch(`/messages/${id}`, { is_read: true }))
          );
          if (!gone) {
            setMessages((prev) =>
              prev.map((m) => (unread.includes(m.id) ? { ...m, is_read: true } : m))
            );
          }
        }
        cacheSenderNames(sorted);
      } catch (err) {
        if (!gone) { setMessages([]); setChatError(err?.message || "Could not load messages."); }
      } finally {
        if (!gone) setChatLoading(false);
      }
    }

    loadMessages();
    return () => { gone = true; };
  }, [openId, me?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, openId, chatLoading]);

  // ── send a message ──────────────────────────────────────────────────────
  async function sendMessage() {
    const text = draft.trim();
    if (!text || !openId || !companyId) return;
    setSending(true);
    try {
      const res  = await axiosApi.post("/messages", {
        conversation_id: openId,
        sender_id:       me?.id,
        message_type:    "text",
        content:         text,
        is_read:         false,
      });
      const sent = toObject(res);
      setDraft("");
      setMessages((prev) => [...prev, sent]);
      setPreviews((prev) => ({
        ...prev,
        [openId]: {
          ...(prev[openId] || {}),
          preview: previewText(sent, me?.id),
          time:    sent?.created_at || new Date().toISOString(),
          lastMsg: sent,
        },
      }));
    } catch (err) {
      setChatError(err?.message || "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter") { e.preventDefault(); sendMessage(); }
  }

  // ── start a new conversation ────────────────────────────────────────────
  async function startConversation(candidate) {
    try {
      const jobId = jobs[0]?.id || null;

      const res  = await axiosApi.post("/conversations", {
        job_id:       jobId,
        company_id:   companyId,
        candidate_id: candidate.id,
      });
      const body   = res?.data?.data || res?.data || res?.data || {};
      const convId = body?.id || body?.conversation_id;

      if (!convId) {
        console.error("[Messages] no id in response:", res?.data);
        setShowModal(false);
        return;
      }

      const newConv = {
        id:           convId,
        job_id:       jobId,
        company_id:   companyId,
        candidate_id: candidate.id,
        ...body,
      };

      setConversations((prev) =>
        prev.some((c) => Number(c.id) === Number(convId)) ? prev : [newConv, ...prev]
      );
      setPreviews((prev) => ({
        ...prev,
        [convId]: {
          name:    candidateName(candidate) || `Candidate ${candidate.id}`,
          preview: "No messages yet",
          time:    null,
          lastMsg: null,
        },
      }));

      setOpenId(convId);
      setShowModal(false);
      setSearch("");

    } catch (err) {
      console.error("[Messages] startConversation:", err);
      const existing = conversations.find(
        (c) => Number(c.candidate_id) === Number(candidate.id)
      );
      if (existing) setOpenId(existing.id);
      setShowModal(false);
    }
  }

  // ── render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <div className="h-8 w-40 animate-pulse rounded bg-orange-100" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-orange-50" />
        </div>
        <div className="grid gap-4 xl:grid-cols-[360px,1fr]">
          <div className="rounded-2xl border border-orange-100 bg-white p-4"><SidebarSkeleton /></div>
          <div className="rounded-2xl border border-orange-100 bg-white"><ChatSkeleton /></div>
        </div>
      </div>
    );
  }

  if (pageError) {
    return <EmptyState title="Could not load messages" message={pageError} icon={MessageCircle} />;
  }

  if (conversations.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-600">Keep conversations with candidates in one place.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <MessageCircle size={16} /> New Conversation
          </button>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-white p-12 shadow-sm">
          <EmptyState
            title="No conversations yet"
            message='Click "New Conversation" to start messaging a candidate.'
            icon={MessageCircle}
          />
        </div>
        {showModal && (
          <CandidateModal
            candidates={candidates}
            conversations={conversations}
            candidatesLoading={candidatesLoading}
            search={search}
            onSearch={setSearch}
            onSelect={startConversation}
            onClose={() => { setShowModal(false); setSearch(""); }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-600">Keep conversations with candidates in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-orange-100 bg-white px-4 py-2 text-xs font-medium text-orange-700 shadow-sm">
            {conversations.length} conversation{conversations.length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <MessageCircle size={16} /> New Conversation
          </button>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[360px,1fr]">

        {/* sidebar */}
        <aside className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
          <div className="border-b border-orange-100 bg-orange-50 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Conversations</p>
            <p className="text-xs text-gray-500">{companyId ? `Company #${companyId}` : ""}</p>
          </div>
          <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-3 space-y-2">
            {conversations.map((conv) => {
              const info   = previews[conv.id] || {};
              const isOpen = Number(conv.id) === Number(openId);
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setOpenId(conv.id)}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${
                    isOpen
                      ? "border-orange-500 bg-orange-500 shadow-md"
                      : "border-orange-100 bg-white hover:bg-orange-50"
                  }`}
                >
                  <Avatar
                    name={info.name || `Candidate ${conv.candidate_id}`}
                    size="md"
                    className={isOpen ? "ring-2 ring-white" : ""}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`truncate text-sm font-semibold ${isOpen ? "text-white" : "text-gray-900"}`}>
                        {info.name || `Candidate ${conv.candidate_id}`}
                      </p>
                      <span className={`shrink-0 text-[11px] ${isOpen ? "text-orange-100" : "text-gray-400"}`}>
                        {info.time ? timeAgo(info.time) : "-"}
                      </span>
                    </div>
                    <p className={`mt-0.5 line-clamp-1 text-xs ${isOpen ? "text-orange-100" : "text-gray-500"}`}>
                      {info.preview || "No messages yet"}
                    </p>
                    <div className={`mt-1.5 flex items-center gap-1.5 text-[11px] ${isOpen ? "text-orange-100" : "text-gray-400"}`}>
                      <Clock size={11} />
                      <span>
                        {info.lastMsg?.created_at
                          ? shortDate(info.lastMsg.created_at)
                          : "No recent activity"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* chat panel */}
        <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
          {!openId || !openConversation ? (
            <div className="flex h-full min-h-[540px] items-center justify-center">
              <EmptyState
                title="No conversation selected"
                message="Pick one from the list or start a new one."
                icon={MessageCircle}
              />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={openPreview.name || `Candidate ${openConversation.candidate_id}`} size="md" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {openPreview.name || `Candidate ${openConversation.candidate_id}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {openPreview.lastMsg?.created_at
                        ? `Last active ${timeAgo(openPreview.lastMsg.created_at)}`
                        : "No messages yet — say hi!"}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                  Company chat
                </span>
              </div>

              <div className="flex h-[calc(100vh-15.5rem)] min-h-[540px] flex-col">
                <div className="flex-1 overflow-y-auto bg-gradient-to-b from-orange-50/60 to-white px-4 py-5">
                  {chatLoading ? (
                    <ChatSkeleton />
                  ) : chatError ? (
                    <div className="flex h-full items-center justify-center">
                      <EmptyState title="Could not load messages" message={chatError} icon={MessageCircle} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <EmptyState
                        title="No messages yet"
                        message="Type something below to start the conversation."
                        icon={MessageCircle}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => {
                        const mine = Number(msg.sender_id) === Number(me?.id);
                        return (
                          <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div className="max-w-[78%]">
                              <div className={`rounded-3xl px-4 py-3 shadow-sm ${
                                mine
                                  ? "bg-orange-500 text-white"
                                  : "border border-orange-100 bg-white text-gray-800"
                              }`}>
                                <p className="whitespace-pre-wrap text-sm leading-6">{msg.content}</p>
                              </div>
                              <div className={`mt-1 flex items-center gap-2 text-[11px] ${
                                mine ? "justify-end text-orange-700" : "text-gray-500"
                              }`}>
                                <span className="font-semibold">{senderName(msg.sender_id)}</span>
                                <span>·</span>
                                <span>{shortTime(msg.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="border-t border-orange-100 bg-white px-4 py-4">
                  {chatError && !chatLoading && (
                    <p className="mb-2 text-xs text-red-500">{chatError}</p>
                  )}
                  <div className="flex items-end gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-3">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder="Type a message and press Enter to send"
                      rows={2}
                      className="min-h-[52px] flex-1 resize-none rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-orange-300"
                    />
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={sending || !draft.trim()}
                      className="inline-flex h-12 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                    >
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {showModal && (
        <CandidateModal
          candidates={candidates}
          conversations={conversations}
          candidatesLoading={candidatesLoading}
          search={search}
          onSearch={setSearch}
          onSelect={startConversation}
          onClose={() => { setShowModal(false); setSearch(""); }}
        />
      )}
    </div>
  );
}