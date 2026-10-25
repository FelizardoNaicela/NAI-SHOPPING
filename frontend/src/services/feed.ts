import { api } from './api';
const API = import.meta.env.VITE_API_URL;
export type BackendPost = {
  id: string;
  type: 'GENERAL' | 'PRODUCT_PROMOTION' | 'ANNOUNCEMENT';
  content?: string | null;
  createdAt: string;

 store?: {
  id: string;
  name: string;
  avatarUrl?: string | null;
  verified?: boolean;
  verificationType?: "BASIC" | "PREMIUM" | null;
  type?: string | null;
};

  images: {
    id: string;
    url: string;
    order: number;
  }[];

  product?: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string | null;

    images?: {
      id: string;
      url: string;
      order?: number;
    }[];
  } | null;
};

export type FeedResponse = {
  items: BackendPost[];
  nextCursor: string | null;
};

export async function listStoreFeed(
  storeId: string,
  params: { cursor?: string; limit?: number }
) {
  const query = new URLSearchParams({
    storeId,
    limit: String(params.limit ?? 10),
  });

  if (params.cursor) {
    query.append('cursor', params.cursor);
  }

  const res = await fetch(`${API}/posts/store?${query}`);

  if (!res.ok) throw new Error('Erro ao carregar feed');

  const json = await res.json();

  return {
    data: json.data,
    nextCursor: json.nextCursor,
  };
}


export async function listGlobalFeed(params: {
  cursor?: string;
  limit: number;
}) {
  const { data } = await api.get("/posts/feed", {
    params: {
      limit: params.limit,
      ...(params.cursor ? { cursor: params.cursor } : {}),
      ...(localStorage.getItem("feed_country")
        ? { countryCode: localStorage.getItem("feed_country") }
        : {}),
      ...(localStorage.getItem("feed_region") !== null
        ? { region: localStorage.getItem("feed_region") ?? "" }
        : {}),
    },
  });

  return data;
}


export async function listFollowingFeed(params: {
  cursor?: string;
  limit: number;
}) {
  const { data } = await api.get("/posts/following", {
    params,
  });

  return {
    data: data.data,
    nextCursor: data.nextCursor,
  };
}
