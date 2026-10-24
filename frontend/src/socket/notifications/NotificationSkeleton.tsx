import './notifications.css';

type Props = {
  lines?: number;
};

export function NotificationSkeleton({ lines = 3 }: Props) {
  return (
    <>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="notification-skeleton">
          <div className="skeleton-icon" />
          <div className="skeleton-content">
            <div className="skeleton-line short" />
            <div className="skeleton-line" />
          </div>
        </div>
      ))}
    </>
  );
}
