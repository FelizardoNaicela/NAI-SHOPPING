export interface StorePageData {
  store: {
    id: string;
    name: string;
    description?: string;
    verified: boolean;
    verificationType: true

    avatarUrl?: string;   // se ainda não tiver
    bannerUrl?: string;   // ← ADICIONA AQUI

    countryCode: string;
    region?: string;
    createdAt: string;


    owner: {
      id: string;
      name: string | null;
    };
  };
  stats: {
    followersCount: number;
    productsCount: number;
  };
  viewer: {
    isFollowing: boolean;
    isOwner: boolean;
  };
  sidebarFeeds: {
    category: {
      id: string;
      name: string;
    };
    totalInCategory: number;
    items: {
      id: string;
      name: string;
      price: number;
    }[];
  }[];
}
