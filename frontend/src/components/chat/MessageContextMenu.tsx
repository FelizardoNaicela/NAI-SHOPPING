import type { Message } from "./types";
import { getSocket } from "../../socket/socket";
import {
    Reply,
    Copy,
    Pencil,
    Trash2,
    Share2,
} from "lucide-react";

type Props = {
  contextMenu: {
    x: number;
    y: number;
    message: Message;
  } | null;

  userId: string;

  setContextMenu: (
    value: {
      x: number;
      y: number;
      message: Message;
    } | null
  ) => void;

  setReplyingTo: (
    message: Message | null
  ) => void;

  setEditingMessageId: (
    id: string | null
  ) => void;

  setEditingContent: (
    content: string
  ) => void;

  setMessages: React.Dispatch<
    React.SetStateAction<Message[]>
  >;

  onShare: (message: Message) => void;
};

export function MessageContextMenu({
  contextMenu,
  userId,
  setContextMenu,
  setReplyingTo,
  setEditingMessageId,
  setEditingContent,
  setMessages,
  onShare,
}: Props) {
  if (!contextMenu) return null;

  const canEdit =
  contextMenu.message.senderId === userId &&
  !contextMenu.message.deletedAt &&
  (!contextMenu.message.messageType ||
    contextMenu.message.messageType === "TEXT");

    const menuButtonStyle = {
    width: "100%",

    display: "flex",
    alignItems: "center",
    gap: 10,

    padding: "11px 13px",

    border: "none",

    background: "transparent",

    borderRadius: 10,

    cursor: "pointer",

    color: "var(--text)",

    fontSize: 14,

    fontWeight: 500,

    transition:
        "background .22s, transform .18s",
} as const;

const MENU_WIDTH = 220;
const MENU_HEIGHT = 250;

const left = Math.min(
    contextMenu.x,
    window.innerWidth - MENU_WIDTH - 12
);

const top = Math.min(
    contextMenu.y,
    window.innerHeight - MENU_HEIGHT - 12
);

  return (
    <div
      style={{
        position: "fixed",
       top,
left,
        background:"var(--surface-glass)",
        zIndex: 99999,
        minWidth: 180,

        backdropFilter:"blur(20px)",
WebkitBackdropFilter:"blur(20px)",

border:"1px solid var(--border)",

boxShadow:"var(--shadow-lg)",

padding:8,

borderRadius:16,

overflow:"hidden",
      }}
    >
      <button
        onClick={() => {
          setReplyingTo(
            contextMenu.message
          );

          setContextMenu(null);
        }}
        style={menuButtonStyle}
        onMouseEnter={(e)=>{
    e.currentTarget.style.background="rgba(249,115,22,.12)";
    e.currentTarget.style.transform="translateX(3px)";
}}

onMouseLeave={(e)=>{
    e.currentTarget.style.background="transparent";
    e.currentTarget.style.transform="translateX(0)";
}}
      >
       <>
    <Reply size={17}/>
    Responder
</>
      </button>

      <button
  onClick={() => {
    onShare(contextMenu.message);

    setContextMenu(null);
  }}
  style={menuButtonStyle}
  onMouseEnter={(e)=>{
    e.currentTarget.style.background="rgba(249,115,22,.12)";
    e.currentTarget.style.transform="translateX(3px)";
}}

onMouseLeave={(e)=>{
    e.currentTarget.style.background="transparent";
    e.currentTarget.style.transform="translateX(0)";
}}
>
 <>
    <Share2 size={17}/>
    Compartilhar
</>
</button>

      <button
        onClick={() => {
          navigator.clipboard.writeText(
            contextMenu.message.content ||
              contextMenu.message
                .imageUrl ||
              ""
          );

          setContextMenu(null);
        }}
        style={menuButtonStyle}
        onMouseEnter={(e)=>{
    e.currentTarget.style.background="rgba(249,115,22,.12)";
    e.currentTarget.style.transform="translateX(3px)";
}}

onMouseLeave={(e)=>{
    e.currentTarget.style.background="transparent";
    e.currentTarget.style.transform="translateX(0)";
}}
      >
       <>
    <Copy size={17}/>
    Copiar
</>
      </button>

      {canEdit && (
  <button
    onClick={() => {
      setEditingMessageId(
        contextMenu.message.id
      );

      setEditingContent(
    contextMenu.message.content ?? ""
);

      setContextMenu(null);
    }}
    style={menuButtonStyle}
  onMouseEnter={(e)=>{
    e.currentTarget.style.background="rgba(249,115,22,.12)";
    e.currentTarget.style.transform="translateX(3px)";
}}

onMouseLeave={(e)=>{
    e.currentTarget.style.background="transparent";
    e.currentTarget.style.transform="translateX(0)";
}}
  >
    <Pencil size={17}/>
    Editar
  </button>
)}

{contextMenu.message.senderId === userId &&
 !contextMenu.message.deletedAt && (
            <button
              onClick={() => {
                const confirmed =
                  window.confirm(
                    "Apagar esta mensagem?"
                  );

                if (!confirmed)
                  return;

                getSocket()?.emit(
                  "chat:delete",
                  {
                    messageId:
                      contextMenu.message
                        .id,
                  }
                );

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id ===
                    contextMenu.message.id
                      ? {
                          ...msg,
                          content:
                            "🚫Mensagem apagada",
                          deletedAt:
                            new Date().toISOString(),
                          imageUrl:
                            undefined,
                        }
                      : msg
                  )
                );

                setContextMenu(null);
              }}
              style={{
    ...menuButtonStyle,

    color:"var(--danger)",
}}
onMouseEnter={(e)=>{
    e.currentTarget.style.background="rgba(249,115,22,.12)";
    e.currentTarget.style.transform="translateX(3px)";
}}

onMouseLeave={(e)=>{
    e.currentTarget.style.background="transparent";
    e.currentTarget.style.transform="translateX(0)";
}}
            >
         <>
    <Trash2 size={17}/>
    Apagar
</>
            </button>
        )}
    </div>
  );
}