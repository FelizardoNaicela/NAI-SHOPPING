import { api } from "./api";

export async function createStore(data: {
  name: string;
  description?: string;
}) {
  const res = await api.post("/stores", data);
  return res.data;
}