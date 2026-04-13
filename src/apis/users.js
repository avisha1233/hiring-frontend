import { apiRequest } from "@/apis/client";

export async function getUsers({
  page = 1,
  limit = 10,
  search = "",
  role = "all",
  status = "all",
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
    ...(role && role !== "all" ? { role } : {}),
    ...(status && status !== "all" ? { status } : {}),
  });

  const response = await apiRequest(`/users?${params.toString()}`);
  return response;
}

export async function getUserById(id) {
  const response = await apiRequest(`/users/${id}`);
  return response;
}

export async function createUser(data) {
  const response = await apiRequest("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response;
}

export async function updateUser(id, data) {
  const response = await apiRequest(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return response;
}

export async function deleteUser(id) {
  const response = await apiRequest(`/users/${id}`, {
    method: "DELETE",
  });
  return response;
}
