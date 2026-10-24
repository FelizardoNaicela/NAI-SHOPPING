export type NewProductMeta = {
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
};

export type NotificationMetaMap = {
  NEW_PRODUCT: {
    storeId: string;
    storeName: string;
    productId: string;
    productName?: string;
  };

  SYSTEM: {
    reason?: string;
  };

  BANCA_FOLLOWED: {
    storeId: string;
  };

  BANCA_CREATED: {
    storeId: string;
    storeName: string;
  };

  // 🔥 NOVO
  STORE_FOLLOWED: {
    followerId: string;
    followerName?: string;
    storeId: string;
    storeName: string;
  };

  // 🔥 NOVO
  NEW_REVIEW: {
    storeId: string;
    storeName: string;
    reviewerId: string;
    reviewerName?: string;
    rating: number;
  };
};
