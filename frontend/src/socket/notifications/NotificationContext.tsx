import {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';

import { api } from '../../services/api';
import type { Notification } from './types';
import { useEffect } from "react";
import { getSocket } from "../../socket/socket";

type NotificationContextType = {
  unreadCount: number;
  notifications: Notification[];
  loading: boolean;

  markAsRead: (id: string) => Promise<void>;
  markGroupAsRead: (ids: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;

  deleteNotification: (id: string) => Promise<void>;
  deleteAllRead: () => Promise<void>;

  restoreNotifications: (items: Notification[]) => void;
  reinsertNotifications: (list: Notification[]) => void;
  clearUnreadVisual: () => void;

  fetchNotifications: () => Promise<void>;
};

const NotificationContext =
  createContext<NotificationContextType | null>(null);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] =
    useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  /* ==========================
     Fonte única da verdade
     ========================== */
  const recomputeUnread = useCallback(
    (list: Notification[]) =>
      list.reduce(
        (acc, n) => (n.read ? acc : acc + 1),
        0,
      ),
    [],
  );

  /* ==========================
     REST
     ========================== */
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } =
        await api.get<Notification[]>(
          '/notifications/me',
        );

      setNotifications(data);
      setUnreadCount(recomputeUnread(data));
    } catch (err) {

    } finally {
      setLoading(false);
    }
  }, [recomputeUnread]);

  /* ==========================
     Atualizações locais
     ========================== */
  const reinsertNotifications = (
    items: Notification[],
  ) => {
    setNotifications(prev => {
      const map = new Map<string, Notification>();

      for (const n of prev) map.set(n.id, n);
      for (const n of items) map.set(n.id, n);

      const next = Array.from(map.values());
      setUnreadCount(recomputeUnread(next));
      return next;
    });
  };

  const restoreNotifications = (
    items: Notification[],
  ) => {
    reinsertNotifications(items);
  };

  /* ==========================
     Ações
     ========================== */
  const markAsRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);

    setNotifications(prev => {
      const next = prev.map(n =>
        n.id === id ? { ...n, read: true } : n,
      );
      setUnreadCount(recomputeUnread(next));
      return next;
    });
  };

  const markGroupAsRead = async (ids: string[]) => {
    if (!ids.length) return;

    // tentativa batch no backend
    try {
      await api.post('/notifications/mark-group-read', {
        ids,
      });
    } catch {
      // fallback seguro
      for (const id of ids) {
        await markAsRead(id);
      }
    }

    // estado local
    setNotifications(prev => {
      const next = prev.map(n =>
        ids.includes(n.id)
          ? { ...n, read: true }
          : n,
      );
      setUnreadCount(recomputeUnread(next));
      return next;
    });
  };

  const markAllAsRead = async () => {
    await api.patch('/notifications/read-all');

    setNotifications(prev => {
      const next = prev.map(n => ({
        ...n,
        read: true,
      }));
      setUnreadCount(0);
      return next;
    });
  };

  const deleteNotification = async (id: string) => {
    await api.delete(`/notifications/${id}`);

    setNotifications(prev => {
      const next = prev.filter(n => n.id !== id);
      setUnreadCount(recomputeUnread(next));
      return next;
    });
  };

  const deleteAllRead = async () => {
    await api.delete('/notifications/read/all');

    setNotifications(prev => {
      const next = prev.filter(n => !n.read);
      setUnreadCount(recomputeUnread(next));
      return next;
    });
  };

  /* ==========================
     Visual only
     ========================== */
  const clearUnreadVisual = () => {
    setUnreadCount(0);
  };

  useEffect(() => {
  const socket = getSocket();

  if (!socket) return;

  // 🔔 nova notificação
  socket.on("notification", (data) => {
    setNotifications(prev => {
      const next = [data, ...prev];
      setUnreadCount(recomputeUnread(next));
      return next;
    });
  });

  // 🔢 contador vindo do backend
  socket.on("notification:unread-count", ({ unreadCount }) => {
    setUnreadCount(unreadCount);
  });

  return () => {
    socket.off("notification");
    socket.off("notification:unread-count");
  };
}, [recomputeUnread]);
  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        loading,

        markAsRead,
        markGroupAsRead,
        markAllAsRead,

        deleteNotification,
        deleteAllRead,

        restoreNotifications,
        reinsertNotifications,
        clearUnreadVisual,

        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      'useNotifications deve ser usado dentro de NotificationProvider',
    );
  }
  return ctx;
}
