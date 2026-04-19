import { axiosClient } from "@/apis/axios-client";

function toQueryString(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  return query.toString();
}

function unwrapError(error) {
  const status = error?.response?.status;
  const message =
    error?.response?.data?.message || error?.message || "Request failed";

  const normalizedError = new Error(message);
  normalizedError.status = status;
  normalizedError.payload = error?.response?.data || null;
  throw normalizedError;
}

export async function getJobs(params = {}) {
  try {
    const query = toQueryString(params);
    const suffix = query ? `?${query}` : "";
    const response = await axiosClient.get(`/jobs${suffix}`);
    return response.data;
  } catch (error) {
    unwrapError(error);
  }
}

export async function createJob(payload) {
  try {
    const response = await axiosClient.post("/jobs", payload);
    return response.data;
  } catch (error) {
    unwrapError(error);
  }
}

export async function updateJob(jobId, payload) {
  try {
    const response = await axiosClient.patch(`/jobs/${jobId}`, payload);
    return response.data;
  } catch (error) {
    unwrapError(error);
  }
}

export async function deleteJob(jobId) {
  try {
    const response = await axiosClient.delete(`/jobs/${jobId}`);
    return response.data;
  } catch (error) {
    unwrapError(error);
  }
}
