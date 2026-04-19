import { axiosClient } from "@/apis/axios-client";

function normalizeAndThrow(error, fallbackMessage) {
  console.error("Settings API error", error);

  const message =
    error?.response?.data?.message || error?.message || fallbackMessage;
  const normalizedError = new Error(message);
  normalizedError.status = error?.response?.status;
  normalizedError.payload = error?.response?.data || null;
  throw normalizedError;
}

export async function getSettings() {
  try {
    const response = await axiosClient.get("/settings");
    return response.data;
  } catch (error) {
    normalizeAndThrow(error, "Failed to fetch settings");
  }
}

export async function updateSettings(payload) {
  try {
    const response = await axiosClient.patch("/settings", payload);
    return response.data;
  } catch (error) {
    normalizeAndThrow(error, "Failed to update settings");
  }
}
