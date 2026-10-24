import { api } from './api';
import type { StorePageData } from '../pages/StorePage/storePage.types';

export async function getStorePage(storeId: string) {
  const { data } = await api.get<StorePageData>(`/stores/${storeId}/page`);
  return data;
}

export async function followStore(storeId: string) {
  const { data } = await api.post(`/stores/${storeId}/follow`);
  return data;
}

export async function unfollowStore(storeId: string) {
  const { data } = await api.post(`/stores/${storeId}/unfollow`);
  return data;
}
