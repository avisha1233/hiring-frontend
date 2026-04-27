import { api } from "@/services/api";

export async function getCandidateStats() {
  const response = await api.get("/candidate/stats");
  return response.data;
}

export async function getCandidateRecentApplications() {
  const response = await api.get("/candidate/applications", {
    params: {
      limit: 3,
      sort: "recent",
    },
  });

  return response.data;
}

export async function getCandidateUpcomingInterviews() {
  const response = await api.get("/candidate/interviews", {
    params: {
      upcoming: true,
      limit: 2,
    },
  });

  return response.data;
}
