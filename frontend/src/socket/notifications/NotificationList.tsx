import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useNotifications } from './NotificationContext';
import { groupNotifications } from './groupNotifications';
import { getNotificationLink } from './notificationLinks';

import { GroupedNotificationItem } from './GroupedNotificationItem';
import { SingleNotificationItem } from './SingleNotificationItem';
import { NotificationSkeleton } from './NotificationSkeleton';

import { useUndo } from './UndoContext';
import { getSocket } from '../../socket/socket';

import type { Notification } from './types';
import type { GroupedNotification } from './groupNotifications';
import styles from "./NotificationList.module.css";

export function NotificationList() {
  const {
    notifications,
    loading,
    markAsRead,
    markGroupAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    reinsertNotifications,
    fetchNotifications,
  } = useNotifications();

  const { showUndo } = useUndo();
  const navigate = useNavigate();

  const [showRead, setShowRead] = useState(false);
  const [busy, setBusy] = useState(false);

  // grupo atualmente expandido
  const [openGroupKey, setOpenGroupKey] =
    useState<string | null>(null);

  /* ==============================
     REST → estado inicial
     ============================== */
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /* ==============================
     SOCKET → realtime
     ============================== */
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function onNewNotification(notification: Notification) {
      reinsertNotifications([notification]);
    }

    socket.on('notification', onNewNotification);

    return () => {
      socket.off('notification', onNewNotification);
    };
  }, [reinsertNotifications]);

  /* ==============================
     Derived state
     ============================== */
  const unreadNotifications = notifications.filter(
    n => !n.read,
  );
  const readNotifications = notifications.filter(
    n => n.read,
  );

  const groupedUnread =
    groupNotifications(unreadNotifications);

  /* ==============================
     Handlers
     ============================== */
  function handleGroupToggle(group: GroupedNotification) {
    setOpenGroupKey(prev =>
      prev === group.key ? null : group.key,
    );
  }

  async function handleSingleNotificationClick(
    notification: Notification,
  ) {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    const link = getNotificationLink(notification);
if (link) navigate(link);

  }

  async function handleDeleteAllRead() {
    if (busy || !readNotifications.length) return;

    const ok = window.confirm(
      'Apagar todas as notificações lidas?',
    );
    if (!ok) return;

    setBusy(true);

    const snapshot = readNotifications;

    await deleteAllRead();

    showUndo({
      message: 'Notificações lidas apagadas',
      undo: () => reinsertNotifications(snapshot),
      timeout: 6000,
    });

    setBusy(false);
  }

  /* ==============================
     Render
     ============================== */
  return (
  <div className={styles.container}>

    <div className={styles.header}>
      <div>
        <h2 className={styles.title}>
          Notificações
        </h2>

        <p className={styles.subtitle}>
          {unreadNotifications.length > 0
            ? `${unreadNotifications.length} não lida${unreadNotifications.length > 1 ? "s" : ""}`
            : "Tudo em dia"}
        </p>
      </div>
    </div>

      {loading && (
        <>
          <h3 className={styles.loadingTitle}>
  A carregar…
</h3>
          <NotificationSkeleton lines={4} />
        </>
      )}

      {!loading && (
        <>
          {/* Barra de ações */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 16,
              flexWrap: 'wrap',
            }}
          >

          </div>

          {!notifications.length && (
            <p>Sem notificações</p>
          )}

         <div className={styles.actions}>
  <button
    className={styles.actionButton}
    onClick={markAllAsRead}
    disabled={!unreadNotifications.length}
  >
    Marcar todas como lidas
  </button>
</div>
          {/* 🔔 NÃO LIDAS (AGRUPADAS) */}
{groupedUnread.map(group => (
  <div
    key={group.key}
    className={styles.group}
  >
    <GroupedNotificationItem
  group={group}
  onNavigate={group => {
    const first = group.notifications[0];
    const link = getNotificationLink(first);
    if (link) navigate(link);
  }}
  onToggle={handleGroupToggle}
  onMarkGroupAsRead={markGroupAsRead}
  onDeleteGroup={ids => {
  const snapshot = group.notifications;

  ids.forEach(deleteNotification);

  showUndo({
    message: `Grupo de ${ids.length} notificações apagado`,
    undo: () => reinsertNotifications(snapshot),
    timeout: 6000,
  });
}}

/>


    {/* itens do grupo (expandido) */}
    {openGroupKey === group.key && (
      <div className={styles.groupItems}>
        {group.notifications.map(n => (
          <SingleNotificationItem
            key={n.id}
            notification={n}
            onClick={() =>
              handleSingleNotificationClick(n)
            }
            onDelete={() => {
  const snapshot = [n];

  deleteNotification(n.id);

  showUndo({
    message: 'Notificação apagada',
    undo: () => reinsertNotifications(snapshot),
    timeout: 5000,
  });
}}
          />
        ))}
      </div>
    )}
  </div>
))}
           <div className={styles.readSection}>

  <div className={styles.actions}>

    <button
      className={styles.actionButton}
      onClick={() => setShowRead(v => !v)}
    >
      {showRead
        ? "Ocultar lidas"
        : "Mostrar lidas"}
    </button>

    <button
      className={`${styles.actionButton} ${styles.dangerButton}`}
      onClick={handleDeleteAllRead}
      disabled={!readNotifications.length}
    >
      Apagar lidas
    </button>

  </div>
          {/* 📂 LIDAS */}
          {showRead && (
  <div className={styles.readItems}>
    {readNotifications.map(n => (
      <SingleNotificationItem
        key={n.id}
        notification={n}
        onClick={() =>
          handleSingleNotificationClick(n)
        }
        onDelete={() => {
          const snapshot = [n];

          deleteNotification(n.id);

          showUndo({
            message: "Notificação apagada",
            undo: () =>
              reinsertNotifications(snapshot),
            timeout: 5000,
          });
        }}
      />
    ))}
  </div>
)}
</div>
        </>
      )}
    </div>
  );
}
