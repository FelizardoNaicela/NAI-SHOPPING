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

    // =========================================
  // DENÚNCIAS
  // =========================================

  REPORT_RESOLVED: {
    reportId: string;
    targetType: string;
    targetId: string;
  };

  REPORT_REJECTED: {
    reportId: string;
    targetType: string;
    targetId: string;
  };

  // =========================================
  // MEDIDAS ADMINISTRATIVAS
  // =========================================

  ADMIN_WARNING: {
    reportId: string;
    administrativeActionId: string;
    targetType: string;
    targetId: string;
  };

  CONTENT_REMOVED: {
    reportId: string;
    administrativeActionId: string;
    targetType: 'PRODUCT' | 'POST';
    targetId: string;
    storeId?: string;
  };

  ADMIN_SUSPENSION: {
    reportId: string;
    administrativeActionId: string;
    targetType: 'STORE' | 'USER';
    targetId: string;
    endsAt?: string;
    permanent: boolean;
  };

  ADMIN_ACTION_REVERSED: {
    reportId: string;
    administrativeActionId: string;
    targetType: string;
    targetId: string;
  };

  ADMIN_SUSPENSION_EXPIRED: {
    reportId: string;
    administrativeActionId: string;
    targetType: 'STORE' | 'USER';
    targetId: string;
  };

  NEW_REPORT: {
  reportId: string;
  targetType: string;
};
};
