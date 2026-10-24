import { api } from '../services/api';

export async function login(email: string, password: string) {
  const response = await api.post('/auth/login', {
    email,
    password,
  });

  const { accessToken, user } = response.data;

  localStorage.setItem('token', accessToken);
  localStorage.setItem('user', JSON.stringify(user));

  if (user.storeId) {
    localStorage.setItem('storeId', user.storeId);
  }

  return response.data;
}
