import {
  ChevronRight,
  Trash2,
} from 'lucide-react';

import { getNotificationIcon } from './notificationIcons';
import { getNotificationGroupText } from './notificationText';
import './notifications.css';

import type { GroupedNotification } from './groupNotifications';

type Props = {
  group: GroupedNotification;
  onNavigate: (group: GroupedNotification) => void;
  onToggle: (group: GroupedNotification) => void;
  onDeleteGroup: (ids: string[]) => void;
  onMarkGroupAsRead: (ids: string[]) => void;
};

export function GroupedNotificationItem({
  group,
  onNavigate,
  onToggle,
  onDeleteGroup,
  onMarkGroupAsRead,
}: Props) {
  if (!group.notifications.length) {
    return null;
  }

  const { title, description } =
    getNotificationGroupText(group);

  const icon =
    getNotificationIcon(group.type);

  const unreadIds =
    group.notifications
      .filter(n => !n.read)
      .map(n => n.id);

  const allIds =
    group.notifications.map(n => n.id);

  return (
    <div className="notification-group-item">

      {/* =========================================
          CORPO
      ========================================= */}

      <div
        className="notification-group-main"
        role="button"
        tabIndex={0}
        onClick={() => {
          if (unreadIds.length > 0) {
            onMarkGroupAsRead(unreadIds);
          }

          onNavigate(group);
        }}
        onKeyDown={e => {
          if (
            e.key === 'Enter' ||
            e.key === ' '
          ) {
            e.preventDefault();

            if (unreadIds.length > 0) {
              onMarkGroupAsRead(unreadIds);
            }

            onNavigate(group);
          }
        }}
      >

        {/* Ícone */}

        <div className="notification-group-icon">
          {icon}
        </div>

        {/* Conteúdo */}

        <div className="notification-group-content">

          <div className="notification-group-title">
            <strong>
              {title}
            </strong>

            {group.count > 1 && (
              <span className="notification-count">
                {group.count}
              </span>
            )}
          </div>

          {description && (
            <p>
              {description}
            </p>
          )}

        </div>

      </div>

      {/* =========================================
          AÇÕES
      ========================================= */}

      <div className="notification-group-actions">

        {/* Expandir */}

        <button
          type="button"
          className="notification-action-button"
          title="Ver notificações"
          aria-label="Ver notificações"
          onClick={e => {
            e.stopPropagation();
            onToggle(group);
          }}
        >
          <ChevronRight
            size={18}
            strokeWidth={2}
          />
        </button>

        {/* Apagar */}

        <button
          type="button"
          className="notification-action-button notification-delete-button"
          title="Apagar grupo"
          aria-label="Apagar grupo"
          onClick={e => {
            e.stopPropagation();
            onDeleteGroup(allIds);
          }}
        >
          <Trash2
            size={17}
            strokeWidth={2}
          />
        </button>

      </div>

    </div>
  );
}