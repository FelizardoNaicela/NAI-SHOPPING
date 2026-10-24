import { api } from './api';

/* =========================================================
   LISTAR PRODUTOS
   ========================================================= */

export function listProducts(params: {
  storeId?: string;
  category?: string;
  search?: string;

  country?: string;
  region?: string;
  time?: string;
  sort?: string;
  order?: string;

  cursor?: string;
  limit?: number;
}) {
  return api
    .get('/products', {
      params,
    })
    .then((res) => res.data);
}

/* =========================================================
   OBTER PRODUTO
   ========================================================= */

export async function getProduct(id: string) {
  const { data } = await api.get(`/products/${id}`);

  return data;
}

/* =========================================================
   CRIAR PRODUTO
   ========================================================= */

export async function createProduct(data: {
  storeId: string;

  name: string;
  description?: string;

  type?: 'NORMAL' | 'AUCTION';

  price: number;
  stock?: number;

  categoryId?: string;

  publishToFeed?: boolean;

  images?: any[];

  /* ===== LEILÃO ===== */

  auctionStartPrice?: number;
  minimumIncrement?: number;
  reservePrice?: number;

  auctionStartsAt?: string;
  auctionEndsAt?: string;
}) {
  const { data: product } = await api.post(
    '/products',
    data,
  );

  return product;
}

/* =========================================================
   ATUALIZAR PRODUTO
   ========================================================= */

export async function updateProduct(
  id: string,
  data: {
    name?: string;
    description?: string;

    price?: number;
    stock?: number;

    categoryId?: string | null;

    publishToFeed?: boolean;

    /* ===== LEILÃO ===== */

    auctionStartPrice?: number | null;
    minimumIncrement?: number | null;
    reservePrice?: number | null;

    auctionStartsAt?: string | null;
    auctionEndsAt?: string | null;
  },
) {
  const { data: updatedProduct } = await api.patch(
    `/products/${id}`,
    data,
  );

  return updatedProduct;
}

/* =========================================================
   APAGAR PRODUTO
   ========================================================= */

export async function deleteProduct(id: string) {
  const { data } = await api.delete(
    `/products/${id}`,
  );

  return data;
}

/* =========================================================
   FEED PÚBLICO
   ========================================================= */

export async function getProductsFeed(params?: {
  limit?: number;
  cursor?: string;
}) {
  const { data } = await api.get('/products/feed', {
    params,
  });

  return data;
}

/* =========================================================
   FEED DAS BANCAS SEGUIDAS
   ========================================================= */

export async function getFollowingProductsFeed() {
  const { data } = await api.get(
    '/products/feed/following',
  );

  return data;
}

/* =========================================================
   FAVORITOS
   ========================================================= */

/**
 * Adicionar produto aos favoritos
 */
export async function addFavorite(
  productId: string,
) {
  const { data } = await api.post(
    `/products/${productId}/favorite`,
  );

  return data;
}

/**
 * Remover produto dos favoritos
 */
export async function removeFavorite(
  productId: string,
) {
  const { data } = await api.delete(
    `/products/${productId}/favorite`,
  );

  return data;
}

/**
 * Verificar se o produto está nos favoritos
 */
export async function isFavorite(
  productId: string,
) {
  const { data } = await api.get(
    `/products/${productId}/favorite`,
  );

  return data;
}

/**
 * Listar favoritos do utilizador
 */
export async function listFavorites() {
  const { data } = await api.get(
    '/products/favorites',
  );

  return data;
}

/* =========================================================
   DESCONTOS
   ========================================================= */

/**
 * Criar desconto
 */
export async function createDiscount(data: {
  storeId: string;

  name?: string;

  discountPercent: number;

  startsAt: string;
  endsAt: string;

  productIds: string[];
}) {
  const { data: discount } =
    await api.post(
      '/products/discounts',
      data,
    );

  return discount;
}

/**
 * Ativar desconto
 */
export async function activateDiscount(
  discountId: string,
) {
  const { data } = await api.post(
    `/products/discounts/${discountId}/activate`,
  );

  return data;
}

/**
 * Pausar desconto
 */
export async function pauseDiscount(
  discountId: string,
) {
  const { data } = await api.post(
    `/products/discounts/${discountId}/pause`,
  );

  return data;
}

/**
 * Cancelar desconto
 */
export async function cancelDiscount(
  discountId: string,
) {
  const { data } = await api.post(
    `/products/discounts/${discountId}/cancel`,
  );

  return data;
}

/**
 * Listar descontos da banca
 */
export async function listStoreDiscounts(
  storeId: string,
) {
  const { data } = await api.get(
    `/products/store/${storeId}/discounts`,
  );

  return data;
}