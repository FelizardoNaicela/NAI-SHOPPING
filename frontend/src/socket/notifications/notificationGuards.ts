import type { Notification } from './types';

/* ======================================================
   Guards base (genéricos)
   ====================================================== */

export function hasMeta(
  notification: Notification,
): notification is Notification & { meta: object } {
  return (
    typeof notification.meta === 'object' &&
    notification.meta !== null
  );
}

/* ======================================================
   Guards por tipo
   ====================================================== */

export function isNewProductNotification(
  notification: Notification,
): notification is Extract<
  Notification,
  { type: 'NEW_PRODUCT' }
> {
  return (
    notification.type === 'NEW_PRODUCT' &&
    hasMeta(notification)
  );
}

export function isBancaFollowedNotification(
  notification: Notification,
): notification is Extract<
  Notification,
  { type: 'BANCA_FOLLOWED' }
> {
  return notification.type === 'BANCA_FOLLOWED';
}

export function isBancaCreatedNotification(
  notification: Notification,
): notification is Extract<
  Notification,
  { type: 'BANCA_CREATED' }
> {
  return notification.type === 'BANCA_CREATED';
}

export function isSystemNotification(
  notification: Notification,
): notification is Extract<
  Notification,
  { type: 'SYSTEM' }
> {
  return notification.type === 'SYSTEM';
}
