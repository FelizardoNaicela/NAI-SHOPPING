import { api } from './api';

export async function listCategories() {
  const { data } = await api.get('/categories');
  return data;
}
