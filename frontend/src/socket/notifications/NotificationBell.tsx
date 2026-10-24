import { useState, useRef, useEffect } from 'react';
import { useNotifications } from './NotificationContext';
import { NotificationDropdown } from './NotificationDropdown';
import { Bell } from "lucide-react";

export function NotificationBell() {
  const { unreadCount } = useNotifications();

  const [open, setOpen] = useState(false);
  const [animate, setAnimate] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const prevUnread = useRef(unreadCount);
  const animationTimeout = useRef<number | null>(null);

  // 🔔 animação quando chegam novas notificações
  useEffect(() => {
    if (unreadCount > prevUnread.current) {
      setAnimate(false);

      requestAnimationFrame(() => {
        setAnimate(true);
      });

      if (animationTimeout.current) {
        clearTimeout(animationTimeout.current);
      }

      animationTimeout.current = window.setTimeout(() => {
        setAnimate(false);
      }, 800);
    }

    prevUnread.current = unreadCount;

    return () => {
      if (animationTimeout.current) {
        clearTimeout(animationTimeout.current);
      }
    };
  }, [unreadCount]);

  // 👇 clique fora fecha dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      );
    };
  }, [open]);

  const toggleOpen = () => {
    if (unreadCount === 0) return; // UX: nada para ver
    setOpen(prev => !prev);
  };

  const badgeText =
    unreadCount > 99 ? '99+' : unreadCount.toString();

  return (
    <div
      ref={wrapperRef}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <span
        role="button"
        tabIndex={0}
        aria-label="Notificações"
        onClick={toggleOpen}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            toggleOpen();
          }
        }}
        className={animate ? 'bell-animate' : ''}
       style={{
        cursor: unreadCount > 0 ? "pointer" : "default",
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    }}

        onMouseEnter={(e) => {
  e.currentTarget.style.background = "#f5f5f5";
}}
onMouseLeave={(e) => {
  e.currentTarget.style.background = "transparent";
}}
      >
      <Bell size={18} strokeWidth={2.2} />
      </span>

      {unreadCount > 0 && (
        <span
          className={animate ? 'badge-pulse' : ''}
          aria-label={`${unreadCount} notificações não lidas`}
          style={{
            position: 'absolute',
            top: -5,
            right: -10,
            background: 'red',
            color: 'white',
            borderRadius: '999px',
            padding: '2px 6px',
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1,
            minWidth: 18,
            textAlign: 'center',
          }}
        >
          {badgeText}
        </span>
      )}

      {open && (
        <NotificationDropdown
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
