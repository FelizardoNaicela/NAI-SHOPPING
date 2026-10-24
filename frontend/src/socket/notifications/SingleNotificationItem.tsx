import {
  Trash2,
} from 'lucide-react';

import type { Notification } from './types';

import { getNotificationIcon } from './notificationIcons';

import './notifications.css';

type Props = {
  notification: Notification;
  onClick?: () => void;
  onDelete?: () => void;
};

export function SingleNotificationItem({
  notification,
  onClick,
  onDelete,
}: Props) {
  const icon =
    getNotificationIcon(notification.type);

  const formattedDate =
    new Date(
      notification.createdAt,
    ).toLocaleString();

  return (
    <div
      className={`notification-item ${
        notification.read
          ? 'read'
          : 'unread'
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={e => {
        if (
          onClick &&
          (
            e.key === 'Enter' ||
            e.key === ' '
          )
        ) {
          e.preventDefault();
          onClick();
        }
      }}
    >

      {/* =========================================
          ÍCONE
      ========================================= */}

      <div className="notification-icon">
        {icon}
      </div>

      {/* =========================================
          CONTEÚDO
      ========================================= */}

      <div className="notification-content">

        <div className="notification-single-header">

          <strong>
            {notification.type}
          </strong>

          {!notification.read && (
            <span
              className="notification-unread-dot"
              aria-label="Não lida"
            />
          )}

        </div>

        <p>
          {notification.message}
        </p>

        <small>
          {formattedDate}
        </small>

      </div>

      {/* =========================================
          APAGAR
      ========================================= */}

      {onDelete && (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onDelete();
          }}
          className="notification-delete"
          title="Apagar notificação"
          aria-label="Apagar notificação"
        >
          <Trash2
            size={16}
            strokeWidth={2}
          />
        </button>
      )}

    </div>
  );
}