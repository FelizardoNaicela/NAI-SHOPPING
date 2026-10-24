import { api } from "./api";

// Listar favoritos
export async function getFavorites() {
  const { data } = await api.get("/products/favorites");
  return data;
}

// Verificar favorito
export async function isFavorite(productId: string) {
  const { data } = await api.get(
    `/products/${productId}/favorite`
  );

  return data.favorite;
}

// Adicionar
export async function addFavorite(productId: string) {
  return api.post(
    `/products/${productId}/favorite`
  );
}

// Remover
export async function removeFavorite(productId: string) {
  return api.delete(
    `/products/${productId}/favorite`
  );
}