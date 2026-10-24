import { api } from './api';

export async function followStore(storeId: string) {
  const res = await api.post(`/follows/${storeId}`);
  return res.data;
}

export async function unfollowStore(storeId: string) {
  const res = await api.delete(`/follows/${storeId}`);
  return res.data;
}

export async function getMyFollows() {
  const res = await api.get('/follows/me');
  return res.data;
}