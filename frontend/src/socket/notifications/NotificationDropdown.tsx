import { useNavigate } from 'react-router-dom';
import { useNotifications } from './NotificationContext';
import { groupNotifications } from './groupNotifications';
import { getNotificationLink } from './notificationLinks';
import { getNotificationGroupText } from './notificationText';
import { NotificationSkeleton } from './NotificationSkeleton';

type Props = {
  onClose: () => void;
};

export function NotificationDropdown({ onClose }: Props) {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    loading,
  } = useNotifications();

  const navigate = useNavigate();

  const unread = notifications.filter(n => !n.read);
  const grouped = groupNotifications(unread);

  const handleGroupClick = (group: typeof grouped[number]) => {
    const first = group.notifications[0];
    if (!first) return;

    const link = getNotificationLink(first);

    group.notifications.forEach(n => {
      if (!n.read) markAsRead(n.id);
    });

    if (link) navigate(link);
    onClose();
  };

  return (
    <div
      className="notification-dropdown"
      style={{
        position: 'absolute',
        top: 35,
        right: 0,
        width: 300,
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: 6,
        padding: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
      }}
    >
      <strong>Notificações</strong>

      {/* 🦴 Skeleton */}
      {loading && <NotificationSkeleton lines={3} />}

      {/* 📭 Vazio */}
      {!loading && grouped.length === 0 && (
        <p style={{ marginTop: 10, opacity: 0.6 }}>
          📭 Nenhuma notificação nova
        </p>
      )}

      {/* ✔️ Ações */}
      {!loading && grouped.length > 0 && (
        <button
          onClick={markAllAsRead}
          style={{ marginTop: 10, width: '100%' }}
        >
          Marcar todas como lidas
        </button>
      )}

      {/* 📦 Lista */}
      {!loading &&
        grouped.map(group => {
          if (!group.notifications.length) return null;

          const text = getNotificationGroupText(group);

          return (
            <div
              key={group.key}
              role="button"
              tabIndex={0}
              onClick={() => handleGroupClick(group)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleGroupClick(group);
                }
              }}
              style={{
                padding: 8,
                marginTop: 8,
                background: '#e6f0ff',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              <strong>
                {text.title}
                {group.count > 1 && ` (${group.count})`}
              </strong>

              {text.description && (
                <p style={{ margin: '4px 0 0', fontSize: 13 }}>
                  {text.description}
                </p>
              )}
            </div>
          );
        })}
    </div>
  );
}
