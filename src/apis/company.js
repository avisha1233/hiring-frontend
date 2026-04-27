import { apiClient } from "@/apis/api";

export async function getCurrentUser() {
  const response = await apiClient.get("/auth/me");
  return response?.data || response;
}

export async function getOverviewMetrics() {
  const response = await apiClient.get("/company/stats");
  return response?.data?.data || response?.data || response;
}

export async function getTopMatchedCandidates() {
  const response = await apiClient.get("/company/candidates?limit=5");
  return (
    response?.data?.data?.data ||
    response?.data?.data ||
    response?.data ||
    response
  );
}

export async function getHiringFunnel() {
  const response = await apiClient.get("/company/stats");
  return (
    response?.data?.data?.funnel ||
    response?.data?.funnel ||
    response?.data ||
    response
  );
}

export async function getWeeklyApplications() {
  const response = await apiClient.get("/company/proposals?limit=7");
  return (
    response?.data?.data?.data ||
    response?.data?.data ||
    response?.data ||
    response
  );
}

export async function getRecentActivity() {
  // For now, return empty array as company activity is not implemented
  return [];
}

export async function getUpcomingInterviews() {
  const response = await apiClient.get("/company/interviews?limit=5");
  return (
    response?.data?.data?.data ||
    response?.data?.data ||
    response?.data ||
    response
  );
}

export async function getCompanyJobs({
  search = "",
  status = "",
  page = 1,
  limit = 20,
} = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const response = await apiClient.get(`/company/jobs?${params.toString()}`);
  return response?.data || response;
}

export async function getCompanyCandidates({
  search = "",
  status = "",
  page = 1,
  limit = 20,
} = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const response = await apiClient.get(
    `/company/candidates?${params.toString()}`,
  );
  return (
    response?.data?.data?.data ||
    response?.data?.data ||
    response?.data ||
    response
  );
}

export async function getProposals({ page = 1, limit = 20, status = "" } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (status) params.set("status", status);
  const response = await apiClient.get(
    `/company/proposals?${params.toString()}`,
  );
  return (
    response?.data?.data?.data ||
    response?.data?.data ||
    response?.data ||
    response
  );
}

export async function getInterviews({
  status = "",
  page = 1,
  limit = 20,
} = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("limit", String(limit));
  const response = await apiClient.get(`/interviews?${params.toString()}`);
  return response?.data || response;
}

export async function getSubmissions({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const response = await apiClient.get(`/submissions?${params.toString()}`);
  return response?.data || response;
}

export async function getMessageThreads({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const response = await apiClient.get(`/conversations?${params.toString()}`);
  return response?.data?.data || response?.data || response;
}

export async function getMessageThreadById(conversationId) {
  const response = await apiClient.get(`/messages/${conversationId}`);
  return response?.data?.data || response?.data || response;
}

export async function sendMessage(conversationId, payload) {
  const response = await apiClient.post(
    `/messages/${conversationId}/send`,
    payload,
  );
  return response?.data || response;
}

export async function getCompanyProfile() {
  const user = await getCurrentUser();
  if (!user.company_id) throw new Error("User has no company");
  const response = await apiClient.get(`/companies/${user.company_id}`);
  return response?.data || response;
}

export async function updateCompanyProfile(data) {
  const user = await getCurrentUser();
  if (!user.company_id) throw new Error("User has no company");
  const response = await apiClient.patch(`/companies/${user.company_id}`, data);
  return response?.data || response;
}
