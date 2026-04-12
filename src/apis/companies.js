import { apiClient } from "@/apis/api";

export function getCompanies(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiClient.get(`/companies${suffix}`);
}

export function createCompany(payload) {
  return apiClient.post("/companies", payload);
}

export function updateCompany(companyId, payload) {
  return apiClient.patch(`/companies/${companyId}`, payload);
}

export function deleteCompany(companyId) {
  return apiClient.delete(`/companies/${companyId}`);
}
