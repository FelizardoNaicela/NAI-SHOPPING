import type { Notification } from './types';

export function getNotificationLink(
  notification: Notification,
): string | null {
  if (!notification || !notification.type) {
    return null;
  }

  switch (notification.type) {
    case 'NEW_PRODUCT': {
      if (
        !notification.meta ||
        typeof notification.meta.productId !== 'string'
      ) {
        return null;
      }

      return `/product/${notification.meta.productId}`;
    }

    case 'BANCA_FOLLOWED':
    case 'STORE_FOLLOWED': {
      if (
        !notification.meta ||
        typeof notification.meta.storeId !== 'string'
      ) {
        return null;
      }

      return `/stores/${notification.meta.storeId}`;
    }

    case 'BANCA_CREATED': {
      if (
        !notification.meta ||
        typeof notification.meta.storeId !== 'string'
      ) {
        return null;
      }

      return `/stores/${notification.meta.storeId}`;
    }

    case 'NEW_REVIEW': {
      if (
        !notification.meta ||
        typeof notification.meta.storeId !== 'string'
      ) {
        return null;
      }

      return `/stores/${notification.meta.storeId}`;
    }

    case 'SYSTEM':
      return null;

    default: {
      const _never: never = notification;
      return _never;
    }
  }
}