import { getSocket } from "../../socket/socket";
import ConversationPicker from "../share/ConversationPicker";


type Props = {
  open: boolean;
  messageId: string | null;
  onClose(): void;
};

export function ShareMessageModal({
    open,
  messageId,
  onClose,
}: Props) {


if (!open) return null;

async function handleShare(
    conversationId: string
) {
    if (!messageId) return;

    getSocket()?.emit(
        "chat:share-message",
        {
            conversationId,
            sharedMessageId:
                messageId,
        }
    );

    onClose();
}

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.38)",
backdropFilter: "blur(8px)",
WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
    width: 430,

    maxWidth: "95vw",

    maxHeight: "82vh",

    overflow: "hidden",

    borderRadius: 22,

    background: "var(--surface-glass)",

    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",

    border: "1px solid var(--border)",

    boxShadow: "var(--shadow-lg)",

    display: "flex",
    flexDirection: "column",
}}
      >
        <div
          style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",

    padding: "18px 22px",

    borderBottom: "1px solid var(--border)",

    background: "var(--surface-soft)",

    position: "sticky",
    top: 0,
    zIndex: 5,
}}
        >
         <h2
    style={{
        margin: 0,

        color: "var(--text)",

        fontSize: 22,

        fontWeight: 700,
    }}
>
    Compartilhar
</h2>
        </div>

<ConversationPicker
    onSelect={handleShare}
/>

        <div
          style={{
            padding: 16,
            borderTop: "1px solid var(--border)",
background: "var(--surface-soft)",
          }}
        >
          <button
    onClick={onClose}
    style={{
        width: "100%",

        padding: "12px",

        borderRadius: 12,

        border: "1px solid var(--border)",

        background: "var(--surface)",

        color: "var(--text)",

        fontWeight: 600,

        cursor: "pointer",

        transition:
            "background .25s, transform .18s",
    }}

    onMouseEnter={(e)=>{
        e.currentTarget.style.background="var(--surface-soft)";
        e.currentTarget.style.transform="translateY(-2px)";
    }}

    onMouseLeave={(e)=>{
        e.currentTarget.style.background="var(--surface)";
        e.currentTarget.style.transform="translateY(0)";
    }}
>
    Cancelar
</button>
        </div>
      </div>
    </div>
  );
}