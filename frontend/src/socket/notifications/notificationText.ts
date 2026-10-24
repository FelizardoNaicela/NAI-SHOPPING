import type { GroupedNotification } from './groupNotifications';
import type { Notification } from './types';

import {
  isNewProductNotification,
  isSystemNotification,
  isBancaFollowedNotification,
} from './notificationGuards';

type GroupText = {
  title: string;
  description?: string;
};

export function getNotificationGroupText(
  group: GroupedNotification,
): GroupText {
  if (
    !group ||
    !Array.isArray(group.notifications) ||
    group.notifications.length === 0
  ) {
    return {
      title: 'Notificação',
      description: 'Conteúdo indisponível',
    };
  }

  const first: Notification = group.notifications[0];

  /* ==========================
     NEW PRODUCT
     ========================== */
  if (isNewProductNotification(first)) {
    const bancaName =
  typeof first.meta.storeName === 'string'
    ? first.meta.storeName
    : 'banca';

    return {
      title: `Novos produtos na ${bancaName}`,
      description:
        group.count === 1
          ? 'Um novo produto foi adicionado'
          : `${group.count} novos produtos foram adicionados`,
    };
  }

  /* ==========================
     BANCA FOLLOWED
     ========================== */
  if (isBancaFollowedNotification(first)) {
    return {
      title: 'Nova banca seguida',
      description:
        group.count === 1
          ? 'Começou a seguir uma nova banca'
          : `Começou a seguir ${group.count} bancas`,
    };
  }

  /* ==========================
     SYSTEM
     ========================== */
  if (isSystemNotification(first)) {
    return {
      title: 'Notificação do sistema',
      description:
        group.count === 1
          ? 'Mensagem do sistema'
          : `${group.count} mensagens do sistema`,
    };
  }

  if (group.type === 'STORE_FOLLOWED') {
  return {
    title: 'Novo seguidor',
    description:
      group.count === 1
        ? 'Alguém começou a seguir tua banca'
        : `${group.count} pessoas começaram a seguir tua banca`,
  };
}

  /* ==========================
     FALLBACK ABSOLUTO
     ========================== */
  return {
    title: 'Notificação',
    description:
      group.count === 1
        ? 'Nova atualização'
        : `${group.count} novas atualizações`,
  };
}
