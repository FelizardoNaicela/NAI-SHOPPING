import { NotificationList } from "../socket/notifications/NotificationList";

export default function NotificationsPage() {

  return (

    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: 24
      }}
    >

      <NotificationList />

    </div>

  );

}