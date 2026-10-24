import type {
  Notification,
  NotificationType,
} from './types';

export type GroupedNotification = {
  key: string;
  type: NotificationType;
  count: number;
  notifications: Notification[];
};

export function groupNotifications(
  notifications: Notification[],
): GroupedNotification[] {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return [];
  }

  const map = new Map<string, GroupedNotification>();

  for (const n of notifications) {
    if (!n || !n.type) continue;

    // NEW_PRODUCT exige storeId
    if (n.type === 'NEW_PRODUCT' && !n.meta?.storeId) {
      continue;
    }

    // 🔑 chave de agrupamento estável (sem texto)
    const groupKey =
      n.type === 'NEW_PRODUCT'
        ? `NEW_PRODUCT|store:${n.meta.storeId}`
        : `${n.type}`;

    const existing = map.get(groupKey);

    if (!existing) {
      map.set(groupKey, {
        key: groupKey,
        type: n.type,
        count: 1,
        notifications: [n],
      });
    } else {
      existing.count += 1;
      existing.notifications.push(n);
    }
  }

  // 🧠 ordenar notificações dentro de cada grupo (mais recente primeiro)
  for (const group of map.values()) {
    group.notifications.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    );
  }

  return Array.from(map.values());
}
