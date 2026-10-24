// 1️⃣ Tipos possíveis de notificação
export type NotificationType =
  | 'NEW_PRODUCT'
  | 'SYSTEM'
  | 'BANCA_FOLLOWED'
  | 'BANCA_CREATED'
  | 'STORE_FOLLOWED' // 🔥 novo (alguém seguiu tua banca)
  | 'NEW_REVIEW';    // 🔥 reservado para avaliações
// 2️⃣ Base comum a todas
export type BaseNotification = {
  id: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
};

// 3️⃣ Metas específicas por tipo
export type NewProductMeta = {
  storeId: string;
  storeName: string; // 🔥 corrigido
  productId: string;
  productName?: string;
};

export type SystemMeta = {
  reason?: string;
};

export type BancaFollowedMeta = {
  storeId: string;
};

export type BancaCreatedMeta = {
  storeId: string;
  storeName: string; // 🔥 consistência
};

export type StoreFollowedMeta = {
  followerId: string;
  followerName?: string;
  storeId: string;
  storeName: string;
};

export type NewReviewMeta = {
  storeId: string;
  storeName: string;
  reviewerId: string;
  reviewerName?: string;
  rating: number;
};

// 4️⃣ Mapa tipo → meta
export type NotificationMetaMap = {
  NEW_PRODUCT: NewProductMeta;
  SYSTEM: SystemMeta;
  BANCA_FOLLOWED: BancaFollowedMeta;
  BANCA_CREATED: BancaCreatedMeta;

  STORE_FOLLOWED: StoreFollowedMeta; // 🔥 novo
  NEW_REVIEW: NewReviewMeta;         // 🔥 preparado
};



// 5️⃣ Notificação final (discriminated union)
export type Notification =
  | (BaseNotification & {
      type: 'NEW_PRODUCT';
      meta: NotificationMetaMap['NEW_PRODUCT'];
    })
  | (BaseNotification & {
      type: 'SYSTEM';
      meta: NotificationMetaMap['SYSTEM'] | null;
    })
  | (BaseNotification & {
      type: 'BANCA_FOLLOWED';
      meta: NotificationMetaMap['BANCA_FOLLOWED'];
    })
  | (BaseNotification & {
      type: 'BANCA_CREATED';
      meta: NotificationMetaMap['BANCA_CREATED'];
    })
  | (BaseNotification & {
    type: 'STORE_FOLLOWED';
    meta: NotificationMetaMap['STORE_FOLLOWED'];
  })
  | (BaseNotification & {
    type: 'NEW_REVIEW';
    meta: NotificationMetaMap['NEW_REVIEW'];
  });
