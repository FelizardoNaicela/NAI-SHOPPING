import { api } from './api';

export async function uploadImages(files: File[]) {
  const formData = new FormData();

  files.forEach(file => {
    formData.append('files', file);
  });

  const res = await api.post('/upload/images', formData);

  return res.data; // array de imagens processadas
}