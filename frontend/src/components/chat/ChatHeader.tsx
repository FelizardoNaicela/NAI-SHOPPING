import Avatar from "../common/Avatar";

type Props = {
  conversationName?: string;
  avatarUrl?: string;

  isOnline: boolean;

  isTyping: boolean;

  lastSeen?: string;

  onBack(): void;

  onOpenInfo(): void;
};

export function ChatHeader({
  conversationName,
  avatarUrl,
  isOnline,
  isTyping,
  lastSeen,
  onBack,
  onOpenInfo,
}: Props) {
  function formatLastSeen(date?: string) {
    if (!date) return "offline";

    const diff =
      Date.now() -
      new Date(date).getTime();

    const minutes = Math.floor(
      diff / 60000
    );

    if (minutes < 1)
      return "visto agora";

    if (minutes < 60) {
      return `visto há ${minutes} min`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `visto há ${hours} h`;
    }

    return new Date(
      date
    ).toLocaleDateString();
  }

  return (
    <div
      style={{
        padding: 12,
        borderBottom:"1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        background:"var(--surface)",
      }}
    >
      <button
        onClick={onBack}
        style={{
          border: "none",

          background:
            "transparent",

          fontSize: 20,

          cursor: "pointer",

          padding: 4,
          color:"var(--text)"
        }}
      >
        ←
      </button>

      <button
        onClick={onOpenInfo}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background:
            "transparent",
          border: "none",
          cursor: "pointer",
          padding: 0,
          color:"var(--text)"
        }}
      >
        <Avatar
    src={avatarUrl}
    name={conversationName}
    size={42}
/>

        <div
          style={{
            textAlign: "left",
          }}
        >
          <div
            style={{
              fontWeight: "bold",

              color:"var(--text)",
            }}
          >
            {conversationName}
          </div>

          <div
            style={{
              fontSize: 12,

              color: isOnline
                ? "#22c55e"
                : "var(--text-soft)",
            }}
          >
            {isOnline
              ? "online"
              : formatLastSeen(
                  lastSeen
                )}
          </div>

          {isTyping && (
            <div
              style={{
                fontSize: 12,

                color:"var(--text-soft)",
              }}
            >
              digitando...
            </div>
          )}
        </div>
      </button>
    </div>
  );
}