import { api } from './api';

export async function createStorePost(
  storeId: string,
  content: string,
  images: any[],
  productId?: string | null
) {

  const payload: any = {
    storeId,
    content,
    imageUrls: images.map(img => img.url)
  };

  if (productId) {
    payload.productId = productId;
  }

  return api.post("/posts", payload);

}