import api from "./axios";

export async function login(data) {
  const response = await api.post("/auth/login", data);
  // console.log(response.data);
  return response.data;
}

export async function register(data) {
  const response = await api.post("/auth/register", data);
  return response.data;
}
